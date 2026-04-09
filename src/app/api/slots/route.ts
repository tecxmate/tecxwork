import { NextRequest, NextResponse } from "next/server";
import { db, slots, recruiters } from "@/lib/db";
import { eq, and, gte, lt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const recruiterId = url.searchParams.get("recruiterId");
  const date = url.searchParams.get("date"); // YYYY-MM-DD

  if (!recruiterId || !date) {
    return NextResponse.json(
      { error: "Missing recruiterId or date" },
      { status: 400 }
    );
  }

  const dayStart = new Date(`${date}T00:00:00+08:00`);
  const dayEnd = new Date(`${date}T23:59:59+08:00`);

  const available = await db
    .select({
      id: slots.id,
      startTime: slots.startTime,
      endTime: slots.endTime,
      status: slots.status,
    })
    .from(slots)
    .where(
      and(
        eq(slots.recruiterId, parseInt(recruiterId)),
        gte(slots.startTime, dayStart),
        lt(slots.startTime, dayEnd)
      )
    )
    .orderBy(slots.startTime);

  return NextResponse.json({ slots: available });
}
