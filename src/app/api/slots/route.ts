import { NextRequest, NextResponse } from "next/server";
import { db, slots, bookings } from "@/lib/db";
import { eq, and, gte, lt, sql, inArray } from "drizzle-orm";

/**
 * GET /api/slots?recruiterId=X&date=YYYY-MM-DD
 *
 * Returns time slots grouped by start time with availability counts.
 * When a recruiter has multiple interviewers, each time has multiple slots.
 * Response: { slots: [{ startTime, endTime, total, available }] }
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const recruiterId = url.searchParams.get("recruiterId");
  const date = url.searchParams.get("date");

  if (!recruiterId || !date) {
    return NextResponse.json(
      { error: "Missing recruiterId or date" },
      { status: 400 }
    );
  }

  const dayStart = new Date(`${date}T00:00:00+08:00`);
  const dayEnd = new Date(`${date}T23:59:59+08:00`);

  const recruiterIdNum = parseInt(recruiterId);

  // Group slots by start_time, count total and available
  const result = await db
    .select({
      startTime: slots.startTime,
      endTime: slots.endTime,
      total: sql<number>`count(*)::int`,
      available: sql<number>`count(*) filter (where ${slots.status} = 'available')::int`,
    })
    .from(slots)
    .where(
      and(
        eq(slots.recruiterId, recruiterIdNum),
        gte(slots.startTime, dayStart),
        lt(slots.startTime, dayEnd)
      )
    )
    .groupBy(slots.startTime, slots.endTime)
    .orderBy(slots.startTime);

  // Pending applications for this recruiter and day, grouped by requested_time.
  // Mode A bookings don't lock a slot until accept, so a student picking a busy
  // time can be useful to know about. We expose this so students can self-route.
  const pending = await db
    .select({
      startTime: bookings.requestedTime,
      count: sql<number>`count(*)::int`,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.recruiterId, recruiterIdNum),
        inArray(bookings.status, ["pending", "waitlisted", "reschedule_proposed"]),
        gte(bookings.requestedTime, dayStart),
        lt(bookings.requestedTime, dayEnd)
      )
    )
    .groupBy(bookings.requestedTime);

  const pendingByTime = new Map<string, number>();
  for (const row of pending) {
    if (row.startTime) {
      pendingByTime.set(new Date(row.startTime).toISOString(), row.count);
    }
  }

  const enriched = result.map((slot) => ({
    ...slot,
    pending: pendingByTime.get(new Date(slot.startTime).toISOString()) ?? 0,
  }));

  return NextResponse.json({ slots: enriched });
}
