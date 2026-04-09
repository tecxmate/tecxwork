import { NextRequest, NextResponse } from "next/server";
import { db, applicantSlots } from "@/lib/db";
import { eq, and, gte, lt } from "drizzle-orm";

// GET — available slots for an applicant on a given date
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const applicantId = url.searchParams.get("applicantId");
  const date = url.searchParams.get("date");

  if (!applicantId || !date) {
    return NextResponse.json(
      { error: "Missing applicantId or date" },
      { status: 400 }
    );
  }

  const dayStart = new Date(`${date}T00:00:00+08:00`);
  const dayEnd = new Date(`${date}T23:59:59+08:00`);

  const result = await db
    .select({
      id: applicantSlots.id,
      startTime: applicantSlots.startTime,
      endTime: applicantSlots.endTime,
      status: applicantSlots.status,
    })
    .from(applicantSlots)
    .where(
      and(
        eq(applicantSlots.applicantId, parseInt(applicantId)),
        gte(applicantSlots.startTime, dayStart),
        lt(applicantSlots.startTime, dayEnd)
      )
    )
    .orderBy(applicantSlots.startTime);

  return NextResponse.json({ slots: result });
}

// POST — applicant creates their own availability slots
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { applicantId, date, startHour = 9, endHour = 17, durationMinutes = 15 } = body;

  if (!applicantId || !date) {
    return NextResponse.json(
      { error: "applicantId and date are required" },
      { status: 400 }
    );
  }

  const newSlots: { applicantId: number; startTime: Date; endTime: Date }[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += durationMinutes) {
      const start = new Date(
        `${date}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00+08:00`
      );
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      const endLimit = new Date(
        `${date}T${String(endHour).padStart(2, "0")}:00:00+08:00`
      );
      if (end > endLimit) break;
      newSlots.push({ applicantId, startTime: start, endTime: end });
    }
  }

  if (newSlots.length === 0) {
    return NextResponse.json({ error: "No slots to create" }, { status: 400 });
  }

  const created = await db
    .insert(applicantSlots)
    .values(newSlots)
    .onConflictDoNothing()
    .returning();

  return NextResponse.json({ created: created.length, total: newSlots.length });
}
