import { NextRequest, NextResponse } from "next/server";
import { db, recruiters, slots, bookings } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

/** PUT /api/me/recruiter — recruiter updates their own company profile */
import { EVENT_CONFIG } from "@/lib/data";

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "recruiter") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { description, positions, jdLink, interviewerCount } = body;

  // Fetch current recruiter
  const [current] = await db
    .select({
      id: recruiters.id,
      interviewerCount: recruiters.interviewerCount,
    })
    .from(recruiters)
    .where(eq(recruiters.userId, session.userId));

  if (!current) {
    return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof description === "string") updates.description = description.trim();
  if (Array.isArray(positions)) updates.positions = positions;
  if (typeof jdLink === "string") updates.jdLink = jdLink.trim() || null;

  const newCount =
    typeof interviewerCount === "number"
      ? Math.max(1, Math.min(10, interviewerCount))
      : null;

  if (newCount !== null) {
    updates.interviewerCount = newCount;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(recruiters)
    .set(updates)
    .where(eq(recruiters.id, current.id))
    .returning();

  // If interviewer count changed, regenerate unbooked slots
  if (newCount !== null && newCount !== current.interviewerCount) {
    // Delete only unbooked slots (preserve booked ones)
    await db
      .delete(slots)
      .where(
        and(eq(slots.recruiterId, current.id), eq(slots.status, "available"))
      );

    // Find what interviewer numbers already exist (from booked slots)
    const bookedSlots = await db
      .select({
        startTime: slots.startTime,
        interviewerNumber: slots.interviewerNumber,
      })
      .from(slots)
      .where(eq(slots.recruiterId, current.id));

    const bookedSet = new Set(
      bookedSlots.map(
        (s) => `${s.startTime.toISOString()}_${s.interviewerNumber}`
      )
    );

    // Regenerate slots for all interviewer numbers
    const dateObj = EVENT_CONFIG.date;
    const eventDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    const newSlots: {
      recruiterId: number;
      startTime: Date;
      endTime: Date;
      interviewerNumber: number;
    }[] = [];

    const sH = EVENT_CONFIG.startHour as number;
    const eH = EVENT_CONFIG.endHour as number;
    const eM = EVENT_CONFIG.endMinutes as number;
    const dur = EVENT_CONFIG.slotDuration as number;

    for (let h = sH; h <= eH; h++) {
      for (let m = 0; m < 60; m += dur) {
        if (h === eH && m >= eM) break;
        const start = new Date(
          `${eventDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+08:00`
        );
        const end = new Date(start.getTime() + EVENT_CONFIG.slotDuration * 60 * 1000);

        for (let i = 1; i <= newCount; i++) {
          const key = `${start.toISOString()}_${i}`;
          if (!bookedSet.has(key)) {
            newSlots.push({
              recruiterId: current.id,
              startTime: start,
              endTime: end,
              interviewerNumber: i,
            });
          }
        }
      }
    }

    if (newSlots.length > 0) {
      await db.insert(slots).values(newSlots).onConflictDoNothing();
    }
  }

  return NextResponse.json({ recruiter: updated });
}
