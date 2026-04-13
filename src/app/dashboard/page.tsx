import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  db,
  recruiters,
  bookings,
  slots,
  applicantSlots,
  eventConfig,
} from "@/lib/db";
import { eq } from "drizzle-orm";
import { RecruiterDashboard } from "./recruiter-dashboard";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const [recruiter] = await db
    .select({
      id: recruiters.id,
      company: recruiters.company,
      industry: recruiters.industry,
      description: recruiters.description,
      positions: recruiters.positions,
      contactEmail: recruiters.contactEmail,
      jdLink: recruiters.jdLink,
      interviewerCount: recruiters.interviewerCount,
    })
    .from(recruiters)
    .where(eq(recruiters.userId, session.userId));

  if (!recruiter) redirect("/login");

  // All bookings for this recruiter (includes pending, accepted, waitlisted, etc.)
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
    .select({ mode: eventConfig.mode })
    .from(eventConfig)
    .limit(1);

  return (
    <RecruiterDashboard
      recruiter={recruiter}
      bookings={allBookings}
      eventMode={config?.mode ?? "both"}
    />
  );
}
