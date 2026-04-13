import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db, recruiters, bookings, slots, applicantSlots, eventConfig } from "@/lib/db";
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

  // Mode A bookings (applicant booked recruiter's slot)
  const modeABookings = await db
    .select({
      id: bookings.id,
      direction: bookings.direction,
      applicantName: bookings.applicantName,
      applicantEmail: bookings.applicantEmail,
      cvLink: bookings.cvLink,
      status: bookings.status,
      createdAt: bookings.createdAt,
      slotStart: slots.startTime,
      slotEnd: slots.endTime,
    })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .where(eq(bookings.recruiterId, recruiter.id))
    .orderBy(slots.startTime);

  // Mode B bookings (recruiter booked applicant's slot)
  const modeBBookings = await db
    .select({
      id: bookings.id,
      direction: bookings.direction,
      applicantName: bookings.applicantName,
      applicantEmail: bookings.applicantEmail,
      cvLink: bookings.cvLink,
      status: bookings.status,
      createdAt: bookings.createdAt,
      slotStart: applicantSlots.startTime,
      slotEnd: applicantSlots.endTime,
    })
    .from(bookings)
    .innerJoin(applicantSlots, eq(bookings.applicantSlotId, applicantSlots.id))
    .where(eq(bookings.recruiterId, recruiter.id))
    .orderBy(applicantSlots.startTime);

  const allBookings = [...modeABookings, ...modeBBookings].sort(
    (a, b) => new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime()
  );

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
