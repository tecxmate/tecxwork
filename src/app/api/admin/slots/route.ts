import { NextRequest, NextResponse } from "next/server";
import { db, slots } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

/**
 * POST /api/admin/slots — Bulk generate slots for a recruiter.
 * Body: { recruiterId, date: "YYYY-MM-DD", startHour: 9, endHour: 17, durationMinutes: 15 }
 * Creates slots every `durationMinutes` from startHour to endHour (Asia/Taipei).
 */
export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    recruiterId,
    date,
    startHour = 9,
    endHour = 17,
    durationMinutes = 15,
  } = body;

  if (!recruiterId || !date) {
    return NextResponse.json(
      { error: "recruiterId and date are required" },
      { status: 400 }
    );
  }

  if (
    typeof startHour !== "number" ||
    typeof endHour !== "number" ||
    typeof durationMinutes !== "number" ||
    startHour < 0 ||
    startHour > 23 ||
    endHour <= startHour ||
    endHour > 24 ||
    durationMinutes < 5 ||
    durationMinutes > 120
  ) {
    return NextResponse.json(
      { error: "Invalid time parameters" },
      { status: 400 }
    );
  }

  const newSlots: { recruiterId: number; startTime: Date; endTime: Date }[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += durationMinutes) {
      // Build time in Asia/Taipei (UTC+8)
      const start = new Date(`${date}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00+08:00`);
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

      // Don't exceed endHour
      const endLimit = new Date(`${date}T${String(endHour).padStart(2, "0")}:00:00+08:00`);
      if (end > endLimit) break;

      newSlots.push({
        recruiterId,
        startTime: start,
        endTime: end,
      });
    }
  }

  if (newSlots.length === 0) {
    return NextResponse.json({ error: "No slots to create" }, { status: 400 });
  }

  const created = await db
    .insert(slots)
    .values(newSlots)
    .onConflictDoNothing()
    .returning();

  return NextResponse.json({
    created: created.length,
    total: newSlots.length,
  });
}
