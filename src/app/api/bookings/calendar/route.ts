import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { applicantSlots, bookings, db, recruiters, slots } from "@/lib/db";
import { getApplicantFromSession, getRecruiterFromSession } from "@/lib/auth";
import { getEventBranding } from "@/lib/event-branding";
import { EVENT_CONFIG } from "@/lib/data";
import { buildCalendar, bookingUid } from "@/lib/calendar";

export const dynamic = "force-dynamic";

const REMINDER_MINUTES = 60;

/**
 * GET /api/bookings/calendar — the caller's whole interview day as one .ics file.
 *
 * A recruiter with fourteen interviews will not click "add to calendar" fourteen times.
 * One file, imported once, puts the entire day in front of them — which is the difference
 * between a schedule they follow and a schedule they lose track of by mid-morning.
 */
export async function GET() {
  const [applicant, recruiter] = await Promise.all([
    getApplicantFromSession(),
    getRecruiterFromSession(),
  ]);
  if (!applicant && !recruiter) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mine = recruiter
    ? eq(bookings.recruiterId, recruiter.recruiterId)
    : eq(bookings.applicantId, applicant!.applicantId);

  const rows = await db
    .select({
      id: bookings.id,
      applicantName: bookings.applicantName,
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
    // Only settled interviews. A pending request has no agreed time, and putting it in
    // someone's calendar would imply a commitment that neither side has made.
    .where(and(mine, eq(bookings.status, "accepted")));

  const branding = await getEventBranding();

  const events = rows
    .map((row) => {
      const start = row.slotStart ?? row.applicantSlotStart ?? row.requestedTime;
      if (!start) return null;
      const end =
        row.slotEnd ??
        row.applicantSlotEnd ??
        new Date(start.getTime() + EVENT_CONFIG.slotDuration * 60_000);

      // A recruiter is scanning for who they are about to meet; an applicant for where
      // they need to be. Lead each with the name that answers their question.
      const title = recruiter
        ? `Interview — ${row.applicantName}`
        : `Interview — ${row.company ?? branding.name}`;

      return {
        uid: bookingUid(row.id),
        title,
        start,
        end,
        location: branding.location,
        description: [
          recruiter ? null : `Candidate: ${row.applicantName}`,
          row.position ? `Position: ${row.position}` : null,
          `Event: ${branding.emailEventName}`,
        ]
          .filter(Boolean)
          .join("\n"),
        reminderMinutes: REMINDER_MINUTES,
      };
    })
    .filter((event): event is NonNullable<typeof event> => event !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const ics = buildCalendar(events, new Date());

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="interviews.ics"',
      "Cache-Control": "no-store",
    },
  });
}
