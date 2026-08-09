import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {
  applicantSlots,
  bookings,
  db,
  recruiters,
  slots,
} from "@/lib/db";
import { getApplicantFromSession, getRecruiterFromSession } from "@/lib/auth";
import { getEventBranding } from "@/lib/event-branding";
import { EVENT_CONFIG } from "@/lib/data";
import { buildCalendar, bookingUid } from "@/lib/calendar";

export const dynamic = "force-dynamic";

/** Alert an hour ahead — enough time to travel to the venue. */
const REMINDER_MINUTES = 60;

/**
 * GET /api/bookings/[id]/calendar — download this interview as an .ics file.
 *
 * Restricted to the two parties on the booking. An interview time paired with a
 * candidate's name is exactly the sort of thing that should not be readable by
 * anyone holding a guessable integer id.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const [applicant, recruiter] = await Promise.all([
    getApplicantFromSession(),
    getRecruiterFromSession(),
  ]);
  if (!applicant && !recruiter) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [row] = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      applicantId: bookings.applicantId,
      applicantName: bookings.applicantName,
      recruiterId: bookings.recruiterId,
      position: bookings.position,
      requestedTime: bookings.requestedTime,
      slotStart: slots.startTime,
      slotEnd: slots.endTime,
      applicantSlotStart: applicantSlots.startTime,
      applicantSlotEnd: applicantSlots.endTime,
      company: recruiters.company,
    })
    .from(bookings)
    .leftJoin(slots, eq(bookings.slotId, slots.id))
    .leftJoin(applicantSlots, eq(bookings.applicantSlotId, applicantSlots.id))
    .leftJoin(recruiters, eq(bookings.recruiterId, recruiters.id))
    .where(eq(bookings.id, bookingId));

  // Same 404 for "no such booking" and "not yours" — a different status would let a
  // stranger enumerate which booking ids exist.
  const isParty =
    (applicant && row?.applicantId === applicant.applicantId) ||
    (recruiter && row?.recruiterId === recruiter.recruiterId);
  if (!row || !isParty) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const start = row.slotStart ?? row.applicantSlotStart ?? row.requestedTime;
  if (!start) {
    return NextResponse.json(
      { error: "This booking has no confirmed time yet" },
      { status: 409 }
    );
  }

  const end =
    row.slotEnd ??
    row.applicantSlotEnd ??
    new Date(start.getTime() + EVENT_CONFIG.slotDuration * 60_000);

  const branding = await getEventBranding();
  const company = row.company ?? branding.name;

  // A cancelled booking still gets a file — issued as CANCELLED so a calendar that
  // already holds the event removes it rather than leaving a ghost interview.
  const cancelled = row.status === "cancelled" || row.status === "rejected";

  const ics = buildCalendar(
    [
      {
        uid: bookingUid(row.id),
        title: `Interview — ${company}`,
        start,
        end,
        location: branding.location,
        description: [
          `Candidate: ${row.applicantName}`,
          row.position ? `Position: ${row.position}` : null,
          `Event: ${branding.emailEventName}`,
        ]
          .filter(Boolean)
          .join("\n"),
        status: cancelled ? "CANCELLED" : "CONFIRMED",
        reminderMinutes: cancelled ? undefined : REMINDER_MINUTES,
      },
    ],
    new Date()
  );

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="interview-${row.id}.ics"`,
      // Times change when an interview is rescheduled; a cached copy would be wrong.
      "Cache-Control": "no-store",
    },
  });
}
