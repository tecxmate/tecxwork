import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { getSession } from "@/lib/auth";
import { db, recruiters, bookings, eventConfig } from "@/lib/db";
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
    })
    .from(recruiters)
    .where(eq(recruiters.userId, session.userId));

  if (!recruiter) redirect("/login");

  const allBookings = await db
    .select({
      id: bookings.id,
      direction: bookings.direction,
      position: bookings.position,
      applicantName: bookings.applicantName,
      applicantEmail: bookings.applicantEmail,
      cvLink: bookings.cvLink,
      status: bookings.status,
      createdAt: bookings.createdAt,
      requestedTime: bookings.requestedTime,
      slotId: bookings.slotId,
    })
    .from(bookings)
    .where(eq(bookings.recruiterId, recruiter.id))
    .orderBy(bookings.requestedTime, bookings.createdAt);

  const [config] = await db
    .select({
      mode: eventConfig.mode,
      jobModerationEnabled: eventConfig.jobModerationEnabled,
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
  };
}
