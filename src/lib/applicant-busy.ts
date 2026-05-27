import { db, bookings, slots, applicantSlots } from "@/lib/db";
import { and, eq, inArray, ne } from "drizzle-orm";

export type BusyRange = { start: Date; end: Date };

const FALLBACK_DURATION_MS = 30 * 60 * 1000;

/**
 * Time ranges where this student is already committed to an interview
 * (status = accepted or reschedule_proposed) across all companies.
 * Used to warn a recruiter before they propose an overlapping time.
 *
 * Returns time-only data — no company or position — so callers can show
 * "busy 14:00–14:30" without leaking which other company the student is with.
 */
export async function getApplicantBusyRanges(
  applicantEmail: string,
  excludeBookingId: number
): Promise<BusyRange[]> {
  const rows = await db
    .select({
      status: bookings.status,
      requestedTime: bookings.requestedTime,
      proposedTime: bookings.proposedTime,
      slotStart: slots.startTime,
      slotEnd: slots.endTime,
      appStart: applicantSlots.startTime,
      appEnd: applicantSlots.endTime,
    })
    .from(bookings)
    .leftJoin(slots, eq(bookings.slotId, slots.id))
    .leftJoin(applicantSlots, eq(bookings.applicantSlotId, applicantSlots.id))
    .where(
      and(
        eq(bookings.applicantEmail, applicantEmail),
        inArray(bookings.status, ["accepted", "reschedule_proposed"]),
        ne(bookings.id, excludeBookingId)
      )
    );

  const out: BusyRange[] = [];
  for (const r of rows) {
    if (r.slotStart && r.slotEnd) {
      out.push({ start: r.slotStart, end: r.slotEnd });
      continue;
    }
    if (r.appStart && r.appEnd) {
      out.push({ start: r.appStart, end: r.appEnd });
      continue;
    }
    const anchor =
      r.status === "reschedule_proposed" ? r.proposedTime : r.requestedTime;
    if (anchor) {
      out.push({
        start: anchor,
        end: new Date(anchor.getTime() + FALLBACK_DURATION_MS),
      });
    }
  }
  return out;
}

export function overlapsBusy(
  start: Date,
  end: Date,
  ranges: BusyRange[]
): BusyRange | null {
  const s = start.getTime();
  const e = end.getTime();
  for (const r of ranges) {
    if (s < r.end.getTime() && e > r.start.getTime()) return r;
  }
  return null;
}
