import { NextRequest, NextResponse } from "next/server";
import { db, eventConfig, slots, recruiters, bookings } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { eq, and, count } from "drizzle-orm";
import { EVENT_CONFIG } from "@/lib/data";

/**
 * PUT /api/admin/timeframe
 * Body: { startHour, endHour, endMinute, slotDuration }
 * Updates event_config and regenerates unbooked slots for all recruiters.
 */
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Block changes if any bookings exist (pending, accepted, or waitlisted)
  const [activeBookings] = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      eq(bookings.status, "pending")
    );

  const [acceptedBookings] = await db
    .select({ count: count() })
    .from(bookings)
    .where(eq(bookings.status, "accepted"));

  const [waitlistedBookings] = await db
    .select({ count: count() })
    .from(bookings)
    .where(eq(bookings.status, "waitlisted"));

  const totalActive =
    activeBookings.count + acceptedBookings.count + waitlistedBookings.count;

  if (totalActive > 0) {
    return NextResponse.json(
      {
        error: `Cannot change time frame — ${totalActive} active booking${totalActive > 1 ? "s" : ""} exist (${acceptedBookings.count} accepted, ${activeBookings.count} pending, ${waitlistedBookings.count} waitlisted). Cancel or reject all bookings first.`,
      },
      { status: 423 }
    );
  }

  const body = await req.json();
  const { startHour, endHour, endMinute, slotDuration } = body;

  if (
    typeof startHour !== "number" ||
    typeof endHour !== "number" ||
    typeof endMinute !== "number" ||
    typeof slotDuration !== "number" ||
    startHour < 0 || startHour > 23 ||
    endHour < startHour || endHour > 24 ||
    endMinute < 0 || endMinute > 59 ||
    slotDuration < 5 || slotDuration > 120
  ) {
    return NextResponse.json({ error: "Invalid time parameters" }, { status: 400 });
  }

  // Update config
  const [config] = await db.select({ id: eventConfig.id }).from(eventConfig).limit(1);
  if (!config) {
    return NextResponse.json({ error: "Event config not found" }, { status: 404 });
  }

  await db
    .update(eventConfig)
    .set({
      startHour,
      endHour,
      endMinute,
      slotDurationMinutes: slotDuration,
    })
    .where(eq(eventConfig.id, config.id));

  // Regenerate unbooked slots for all recruiters
  // Delete available (unbooked) slots
  await db.delete(slots).where(eq(slots.status, "available"));

  // Get all recruiters
  const allRecruiters = await db
    .select({ id: recruiters.id, interviewerCount: recruiters.interviewerCount })
    .from(recruiters);

  // Format date correctly handling local timezone offset
  const dateObj = EVENT_CONFIG.date;
  const eventDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
  let totalCreated = 0;

  for (const rec of allRecruiters) {
    // Check which slots are already booked for this recruiter
    const bookedSlots = await db
      .select({
        startTime: slots.startTime,
        interviewerNumber: slots.interviewerNumber,
      })
      .from(slots)
      .where(eq(slots.recruiterId, rec.id));

    const bookedSet = new Set(
      bookedSlots.map((s) => `${s.startTime.toISOString()}_${s.interviewerNumber}`)
    );

    const newSlots: {
      recruiterId: number;
      startTime: Date;
      endTime: Date;
      interviewerNumber: number;
    }[] = [];

    for (let h = startHour; h <= endHour; h++) {
      for (let m = 0; m < 60; m += slotDuration) {
        if (h === endHour && m >= endMinute) break;
        if (h > endHour) break;

        const start = new Date(
          `${eventDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+08:00`
        );
        const end = new Date(start.getTime() + slotDuration * 60 * 1000);

        for (let i = 1; i <= rec.interviewerCount; i++) {
          const key = `${start.toISOString()}_${i}`;
          if (!bookedSet.has(key)) {
            newSlots.push({
              recruiterId: rec.id,
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
      totalCreated += newSlots.length;
    }
  }

  return NextResponse.json({
    ok: true,
    startHour,
    endHour,
    endMinute,
    slotDuration,
    slotsRegenerated: totalCreated,
  });
}
