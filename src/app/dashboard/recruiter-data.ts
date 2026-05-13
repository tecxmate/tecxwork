import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { getSession } from "@/lib/auth";
import { db, recruiters, bookings, eventConfig, slots, applicantSlots } from "@/lib/db";
import { normalizeSalaryCurrencyOptions } from "@/lib/job-posting";
import { getRecruiterLocale } from "@/lib/recruiter-locale.server";

export type RecruiterDashboardSection =
  | "interviews"
  | "applicants"
  | "jobs"
  | "company";

export async function getRecruiterDashboardData() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const locale = await getRecruiterLocale();

  const [recruiter] = await db
    .select({
      id: recruiters.id,
      company: recruiters.company,
      industry: recruiters.industry,
      description: recruiters.description,
      contactEmail: recruiters.contactEmail,
      interviewerCount: recruiters.interviewerCount,
      logoUrl: recruiters.logoUrl,
      websiteUrl: recruiters.websiteUrl,
      galleryUrls: recruiters.galleryUrls,
    })
    .from(recruiters)
    .where(eq(recruiters.userId, session.userId));

  if (!recruiter) redirect("/login");

  const allBookings = await db
    .select({
      id: bookings.id,
      direction: bookings.direction,
      applicantId: bookings.applicantId,
      position: bookings.position,
      applicantName: bookings.applicantName,
      applicantEmail: bookings.applicantEmail,
      cvLink: bookings.cvLink,
      status: bookings.status,
      createdAt: bookings.createdAt,
      requestedTime: bookings.requestedTime,
      slotId: bookings.slotId,
      applicantSlotId: bookings.applicantSlotId,
      slotStart: slots.startTime,
      slotEnd: slots.endTime,
      interviewerNumber: slots.interviewerNumber,
      applicantSlotStart: applicantSlots.startTime,
      applicantSlotEnd: applicantSlots.endTime,
    })
    .from(bookings)
    .leftJoin(slots, eq(bookings.slotId, slots.id))
    .leftJoin(applicantSlots, eq(bookings.applicantSlotId, applicantSlots.id))
    .where(eq(bookings.recruiterId, recruiter.id))
    .orderBy(slots.startTime, applicantSlots.startTime, bookings.requestedTime, bookings.createdAt);

  const [config] = await db
    .select({
      mode: eventConfig.mode,
      jobModerationEnabled: eventConfig.jobModerationEnabled,
      salaryCurrencyOptions: eventConfig.salaryCurrencyOptions,
    })
    .from(eventConfig)
    .limit(1);

  const eventMode = config?.mode ?? "both";
  const showApplicants =
    eventMode === "recruiter_books_applicant" || eventMode === "both";

  return {
    locale,
    recruiter,
    bookings: allBookings,
    showApplicants,
    jobModerationEnabled: config?.jobModerationEnabled ?? true,
    salaryCurrencyOptions: normalizeSalaryCurrencyOptions(
      config?.salaryCurrencyOptions
    ),
  };
}
