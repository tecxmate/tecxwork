import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";

import { getSession } from "@/lib/auth";
import {
  db,
  recruiters,
  bookings,
  slots,
  applicantProfiles,
  eventConfig,
  allowedDomains,
  users,
  jobOpenings,
} from "@/lib/db";

export type AdminOnboardingMode = "minimal" | "full";

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
      locked: eventConfig.modeLocked,
      startHour: eventConfig.startHour,
      endHour: eventConfig.endHour,
      endMinute: eventConfig.endMinute,
      slotDuration: eventConfig.slotDurationMinutes,
    })
    .from(eventConfig)
    .limit(1);

  const domains = await db
    .select()
    .from(allowedDomains)
    .orderBy(allowedDomains.company);

  const bookingList = await db
    .select({
      id: bookings.id,
      position: bookings.position,
      applicantName: bookings.applicantName,
      applicantEmail: bookings.applicantEmail,
      cvLink: bookings.cvLink,
      status: bookings.status,
      requestedTime: bookings.requestedTime,
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
      jdLink: jobOpenings.jdLink,
      description: jobOpenings.description,
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
      b.status === "waitlisted"
  ).length;
  const onboardingMode: AdminOnboardingMode =
    config?.onboardingMode === "minimal" ? "minimal" : "full";

  return {
    recruiters: recruiterList,
    applicants: applicantList,
    bookings: bookingList,
    jobs: jobList,
    domains,
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
    initialLocked: config?.locked ?? false,
    timeFrame: {
      startHour: config?.startHour ?? 10,
      endHour: config?.endHour ?? 17,
      endMinute: config?.endMinute ?? 30,
      slotDuration: config?.slotDuration ?? 15,
    },
  };
}
