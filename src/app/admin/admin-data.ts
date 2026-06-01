import { redirect } from "next/navigation";
import { count, eq, sql } from "drizzle-orm";

import { getSession } from "@/lib/auth";
import {
  db,
  recruiters,
  bookings,
  slots,
  applicantProfiles,
  eventConfig,
  allowedDomains,
  recruiterEmailApprovals,
  users,
  jobOpenings,
} from "@/lib/db";
import { normalizeSalaryCurrencyOptions } from "@/lib/job-posting";

export type AdminOnboardingMode = "minimal" | "full";

const TAIPEI = "Asia/Taipei";

export type AdminAnalytics = {
  registrations: {
    date: string;
    students: number;
    recruiters: number;
    cumulativeStudents: number;
    cumulativeRecruiters: number;
  }[];
  bookings: {
    date: string;
    accepted: number;
    inProgress: number;
    declined: number;
  }[];
  emails: { date: string; success: number; failed: number }[];
  jobs: { date: string; count: number; cumulative: number }[];
  capacity: {
    company: string;
    total: number;
    booked: number;
    accepted: number;
    unconfirmed: number;
    rejected: number;
  }[];
};

/** YYYY-MM-DD list from start..end inclusive (UTC-midnight stepping). */
function dateSpine(start: string, end: string): string[] {
  const out: string[] = [];
  if (!start || !end || start > end) return out;
  let cursor = new Date(`${start}T00:00:00Z`).getTime();
  const last = new Date(`${end}T00:00:00Z`).getTime();
  const DAY = 86_400_000;
  // hard cap to avoid an unbounded loop on bad input
  for (let i = 0; cursor <= last && i < 800; i += 1, cursor += DAY) {
    out.push(new Date(cursor).toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Daily time-series for the admin Overview, aggregated in Asia/Taipei.
 * Gap-filled from the earliest event across metrics through today so the
 * charts stay continuous, with running totals for the cumulative views.
 */
async function getAnalytics(): Promise<AdminAnalytics> {
  // Raw SQL via db.execute — the day key is selected as TEXT 'YYYY-MM-DD'
  // (Asia/Taipei) so it's immune to how the driver parses a `date` across
  // timezones, and raw SQL sidesteps the query-builder's column/alias
  // machinery (which mis-handles a reused sql() expression in select+groupBy).
  const DAY = sql`to_char((created_at AT TIME ZONE 'Asia/Taipei')::date, 'YYYY-MM-DD')`;
  const rowsOf = async <T>(query: ReturnType<typeof sql>): Promise<T[]> => {
    const res = (await db.execute(query)) as unknown as { rows?: T[] };
    return (res.rows ?? (res as unknown as T[])) ?? [];
  };

  const [studentRows, recruiterRows, bookingRows, emailRows, jobRows, capacityRows] =
    await Promise.all([
      rowsOf<{ d: string; n: number }>(
        sql`SELECT ${DAY} AS d, COUNT(*)::int AS n FROM applicant_profiles GROUP BY 1`
      ),
      rowsOf<{ d: string; n: number }>(
        sql`SELECT ${DAY} AS d, COUNT(*)::int AS n FROM recruiters GROUP BY 1`
      ),
      rowsOf<{ d: string; status: string; n: number }>(
        sql`SELECT ${DAY} AS d, status, COUNT(*)::int AS n FROM bookings GROUP BY 1, status`
      ),
      rowsOf<{ d: string; success: boolean; n: number }>(
        sql`SELECT ${DAY} AS d, success, COUNT(*)::int AS n FROM email_logs GROUP BY 1, success`
      ),
      rowsOf<{ d: string; n: number }>(
        sql`SELECT ${DAY} AS d, COUNT(*)::int AS n FROM job_openings GROUP BY 1`
      ),
      rowsOf<{
        company: string;
        total: number;
        booked: number;
        accepted: number;
        unconfirmed: number;
        rejected: number;
      }>(
        sql`SELECT r.company AS company,
              COALESCE(sl.total, 0)::int AS total,
              COALESCE(sl.booked, 0)::int AS booked,
              COALESCE(bk.accepted, 0)::int AS accepted,
              COALESCE(bk.unconfirmed, 0)::int AS unconfirmed,
              COALESCE(bk.rejected, 0)::int AS rejected
            FROM recruiters r
            LEFT JOIN (
              SELECT recruiter_id,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'booked') AS booked
              FROM slots GROUP BY recruiter_id
            ) sl ON sl.recruiter_id = r.id
            LEFT JOIN (
              SELECT recruiter_id,
                COUNT(*) FILTER (WHERE status = 'accepted') AS accepted,
                COUNT(*) FILTER (WHERE status IN ('pending', 'waitlisted', 'reschedule_proposed')) AS unconfirmed,
                COUNT(*) FILTER (WHERE status IN ('rejected', 'cancelled')) AS rejected
              FROM bookings GROUP BY recruiter_id
            ) bk ON bk.recruiter_id = r.id
            WHERE COALESCE(sl.total, 0) > 0
               OR COALESCE(bk.accepted, 0) + COALESCE(bk.unconfirmed, 0) + COALESCE(bk.rejected, 0) > 0
            ORDER BY total DESC, r.company`
      ),
    ]);

  const asKey = (d: unknown): string => String(d).slice(0, 10);

  const allDates = [
    ...studentRows,
    ...recruiterRows,
    ...bookingRows,
    ...emailRows,
    ...jobRows,
  ].map((r) => asKey(r.d));
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: TAIPEI });
  const start = allDates.length ? allDates.reduce((a, b) => (a < b ? a : b)) : today;
  const spine = dateSpine(start, today);

  const studentByDay = new Map<string, number>();
  for (const r of studentRows) studentByDay.set(asKey(r.d), Number(r.n));
  const recruiterByDay = new Map<string, number>();
  for (const r of recruiterRows) recruiterByDay.set(asKey(r.d), Number(r.n));
  const jobByDay = new Map<string, number>();
  for (const r of jobRows) jobByDay.set(asKey(r.d), Number(r.n));

  const bookingByDay = new Map<
    string,
    { accepted: number; inProgress: number; declined: number }
  >();
  for (const r of bookingRows) {
    const key = asKey(r.d);
    const bucket =
      bookingByDay.get(key) ?? { accepted: 0, inProgress: 0, declined: 0 };
    const n = Number(r.n);
    if (r.status === "accepted") bucket.accepted += n;
    else if (r.status === "rejected" || r.status === "cancelled")
      bucket.declined += n;
    else bucket.inProgress += n; // pending, waitlisted, reschedule_proposed
    bookingByDay.set(key, bucket);
  }

  const emailByDay = new Map<string, { success: number; failed: number }>();
  for (const r of emailRows) {
    const key = asKey(r.d);
    const bucket = emailByDay.get(key) ?? { success: 0, failed: 0 };
    if (r.success) bucket.success += Number(r.n);
    else bucket.failed += Number(r.n);
    emailByDay.set(key, bucket);
  }

  let cumS = 0;
  let cumR = 0;
  const registrations = spine.map((date) => {
    const students = studentByDay.get(date) ?? 0;
    const recs = recruiterByDay.get(date) ?? 0;
    cumS += students;
    cumR += recs;
    return {
      date,
      students,
      recruiters: recs,
      cumulativeStudents: cumS,
      cumulativeRecruiters: cumR,
    };
  });

  let cumJ = 0;
  const jobs = spine.map((date) => {
    const c = jobByDay.get(date) ?? 0;
    cumJ += c;
    return { date, count: c, cumulative: cumJ };
  });

  const bookingsSeries = spine.map((date) => ({
    date,
    ...(bookingByDay.get(date) ?? { accepted: 0, inProgress: 0, declined: 0 }),
  }));

  const emails = spine.map((date) => ({
    date,
    ...(emailByDay.get(date) ?? { success: 0, failed: 0 }),
  }));

  const capacity = capacityRows.map((r) => ({
    company: r.company,
    total: Number(r.total),
    booked: Number(r.booked),
    accepted: Number(r.accepted),
    unconfirmed: Number(r.unconfirmed),
    rejected: Number(r.rejected),
  }));

  return { registrations, bookings: bookingsSeries, emails, jobs, capacity };
}

export async function getAdminDashboardData() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const recruiterList = await db
    .select({
      id: recruiters.id,
      name: users.name,
      company: recruiters.company,
      industry: recruiters.industry,
      contactEmail: recruiters.contactEmail,
      email: users.email,
      createdAt: recruiters.createdAt,
      description: recruiters.description,
      websiteUrl: recruiters.websiteUrl,
      logoUrl: recruiters.logoUrl,
      galleryUrls: recruiters.galleryUrls,
      pinnedRank: recruiters.pinnedRank,
    })
    .from(recruiters)
    .innerJoin(users, eq(recruiters.userId, users.id))
    .orderBy(recruiters.company);

  const applicantList = await db
    .select({
      id: applicantProfiles.id,
      name: applicantProfiles.name,
      email: applicantProfiles.email,
      major: applicantProfiles.major,
      createdAt: applicantProfiles.createdAt,
    })
    .from(applicantProfiles)
    .orderBy(applicantProfiles.name);

  const [bookingCount] = await db.select({ count: count() }).from(bookings);
  const [slotCount] = await db.select({ count: count() }).from(slots);
  const [availableCount] = await db
    .select({ count: count() })
    .from(slots)
    .where(eq(slots.status, "available"));
  const [config] = await db
    .select({
      mode: eventConfig.mode,
      onboardingMode: eventConfig.onboardingMode,
      jobModerationEnabled: eventConfig.jobModerationEnabled,
      studentCancellationEnabled: eventConfig.studentCancellationEnabled,
      jobsPageHeroEnabled: eventConfig.jobsPageHeroEnabled,
      locked: eventConfig.modeLocked,
      startHour: eventConfig.startHour,
      startMinute: eventConfig.startMinute,
      endHour: eventConfig.endHour,
      endMinute: eventConfig.endMinute,
      slotDuration: eventConfig.slotDurationMinutes,
      bufferMinutes: eventConfig.bufferMinutes,
      homepageImages: eventConfig.homepageImages,
      browsePageImages: eventConfig.browsePageImages,
      jobsPageImages: eventConfig.jobsPageImages,
      eventName: eventConfig.eventName,
      emailEventName: eventConfig.emailEventName,
      tagline: eventConfig.tagline,
      organizer: eventConfig.organizer,
      organizerShort: eventConfig.organizerShort,
      hostedAt: eventConfig.hostedAt,
      hostedAtFull: eventConfig.hostedAtFull,
      displayDate: eventConfig.displayDate,
      displayYear: eventConfig.displayYear,
      location: eventConfig.location,
      eventDate: eventConfig.eventDate,
      eventEndDate: eventConfig.eventEndDate,
      heroOverlayEnabled: eventConfig.heroOverlayEnabled,
      salaryCurrencyOptions: eventConfig.salaryCurrencyOptions,
    })
    .from(eventConfig)
    .limit(1);

  const domains = await db
    .select()
    .from(allowedDomains)
    .orderBy(allowedDomains.company);

  const recruiterApprovals = await db
    .select()
    .from(recruiterEmailApprovals)
    .orderBy(recruiterEmailApprovals.company);

  const bookingList = await db
    .select({
      id: bookings.id,
      applicantId: bookings.applicantId,
      position: bookings.position,
      applicantName: bookings.applicantName,
      applicantEmail: bookings.applicantEmail,
      cvLink: bookings.cvLink,
      status: bookings.status,
      recruiterId: bookings.recruiterId,
      slotId: bookings.slotId,
      requestedTime: bookings.requestedTime,
      proposedTime: bookings.proposedTime,
      createdAt: bookings.createdAt,
      company: recruiters.company,
    })
    .from(bookings)
    .innerJoin(recruiters, eq(bookings.recruiterId, recruiters.id))
    .orderBy(bookings.createdAt);

  const jobList = await db
    .select({
      id: jobOpenings.id,
      recruiterId: recruiters.id,
      company: recruiters.company,
      title: jobOpenings.title,
      jobCategory: jobOpenings.jobCategory,
      jdLink: jobOpenings.jdLink,
      location: jobOpenings.location,
      employmentType: jobOpenings.employmentType,
      workplaceType: jobOpenings.workplaceType,
      salaryMin: jobOpenings.salaryMin,
      salaryMax: jobOpenings.salaryMax,
      salaryCurrency: jobOpenings.salaryCurrency,
      salaryPeriod: jobOpenings.salaryPeriod,
      seniority: jobOpenings.seniority,
      languageRequirement: jobOpenings.languageRequirement,
      visaSupport: jobOpenings.visaSupport,
      applicationDeadline: jobOpenings.applicationDeadline,
      description: jobOpenings.description,
      responsibilities: jobOpenings.responsibilities,
      requirements: jobOpenings.requirements,
      benefits: jobOpenings.benefits,
      moderationStatus: jobOpenings.moderationStatus,
      moderationNotes: jobOpenings.moderationNotes,
      submittedAt: jobOpenings.submittedAt,
      reviewedAt: jobOpenings.reviewedAt,
      createdAt: jobOpenings.createdAt,
    })
    .from(jobOpenings)
    .innerJoin(recruiters, eq(jobOpenings.recruiterId, recruiters.id))
    .orderBy(jobOpenings.createdAt);

  const activeBookingCount = bookingList.filter(
    (b) =>
      b.status === "pending" ||
      b.status === "accepted" ||
      b.status === "waitlisted" ||
      b.status === "reschedule_proposed"
  ).length;
  const onboardingMode: AdminOnboardingMode =
    config?.onboardingMode === "minimal" ? "minimal" : "full";

  const analytics = await getAnalytics();

  return {
    recruiters: recruiterList,
    applicants: applicantList,
    bookings: bookingList,
    jobs: jobList,
    domains,
    recruiterApprovals,
    analytics,
    stats: {
      totalRecruiters: recruiterList.length,
      totalBookings: bookingCount.count,
      activeBookings: activeBookingCount,
      totalSlots: slotCount.count,
      availableSlots: availableCount.count,
      totalApplicants: applicantList.length,
    },
    currentMode: config?.mode ?? "both",
    initialOnboardingMode: onboardingMode,
    initialJobModerationEnabled: config?.jobModerationEnabled ?? true,
    initialStudentCancellationEnabled:
      config?.studentCancellationEnabled ?? false,
    initialJobsPageHeroEnabled: config?.jobsPageHeroEnabled ?? false,
    initialSalaryCurrencyOptions: normalizeSalaryCurrencyOptions(
      config?.salaryCurrencyOptions
    ),
    initialLocked: config?.locked ?? false,
    timeFrame: {
      startHour: config?.startHour ?? 10,
      startMinute: config?.startMinute ?? 0,
      endHour: config?.endHour ?? 17,
      endMinute: config?.endMinute ?? 30,
      slotDuration: config?.slotDuration ?? 15,
      bufferMinutes: config?.bufferMinutes ?? 0,
    },
    initialHomepageImages: config?.homepageImages ?? [],
    initialBrowsePageImages: config?.browsePageImages ?? [],
    initialJobsPageImages: config?.jobsPageImages ?? [],
    initialBranding: {
      eventName: config?.eventName ?? "",
      emailEventName: config?.emailEventName ?? "",
      tagline: config?.tagline ?? "",
      organizer: config?.organizer ?? "",
      organizerShort: config?.organizerShort ?? "",
      hostedAt: config?.hostedAt ?? "",
      hostedAtFull: config?.hostedAtFull ?? "",
      displayDate: config?.displayDate ?? "",
      displayYear: config?.displayYear ?? "",
      location: config?.location ?? "",
      eventDate: config?.eventDate?.toISOString() ?? null,
      eventEndDate: config?.eventEndDate?.toISOString() ?? null,
      heroOverlayEnabled: config?.heroOverlayEnabled ?? true,
    },
  };
}
