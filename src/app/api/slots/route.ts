import { NextRequest, NextResponse } from "next/server";
import { db, slots } from "@/lib/db";
import { eq, and, gte, lt, sql } from "drizzle-orm";

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
        eq(slots.recruiterId, parseInt(recruiterId)),
        gte(slots.startTime, dayStart),
        lt(slots.startTime, dayEnd)
      )
    )
    .groupBy(slots.startTime, slots.endTime)
    .orderBy(slots.startTime);

  return NextResponse.json({ slots: result });
}
