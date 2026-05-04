import { NextRequest, NextResponse } from "next/server";
import { db, recruiters, slots, bookings } from "@/lib/db";
import { getRecruiterFromSession } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import { getEventBranding } from "@/lib/event-branding";

/** PUT /api/me/recruiter — recruiter updates their own company profile */

export async function PUT(req: NextRequest) {
  const auth = await getRecruiterFromSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { description, websiteUrl, interviewerCount, logoUrl, galleryUrls } = body;

  // Fetch the current interviewerCount — needed below to detect changes.
  const [current] = await db
    .select({
      id: recruiters.id,
      interviewerCount: recruiters.interviewerCount,
    })
    .from(recruiters)
    .where(eq(recruiters.id, auth.recruiterId));

  if (!current) {
    return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof description === "string") updates.description = description.trim();
  if (typeof websiteUrl === "string" || websiteUrl === null) updates.websiteUrl = websiteUrl;
  if (typeof logoUrl === "string" || logoUrl === null) updates.logoUrl = logoUrl;
  if (Array.isArray(galleryUrls)) updates.galleryUrls = galleryUrls.slice(0, 4);

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

    // Regenerate slots for all interviewer numbers. Use the live event
    // branding (matches /api/admin/timeframe) and Asia/Taipei date format
    // so an early-morning Taipei start doesn't roll back a day on UTC.
    const branding = await getEventBranding();
    const eventDate = branding.date
      .toLocaleString("sv-SE", {
        timeZone: "Asia/Taipei",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .slice(0, 10);

    const newSlots: {
      recruiterId: number;
      startTime: Date;
      endTime: Date;
      interviewerNumber: number;
    }[] = [];

    const dur = branding.slotDuration;
    const startMinutes = branding.startHour * 60;
    const endMinutes = branding.endHour * 60 + branding.endMinutes;

    for (let t = startMinutes; t + dur <= endMinutes; t += dur) {
      const h = Math.floor(t / 60);
      const m = t % 60;
      const start = new Date(
        `${eventDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+08:00`
      );
      const end = new Date(start.getTime() + dur * 60 * 1000);

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

    if (newSlots.length > 0) {
      await db.insert(slots).values(newSlots).onConflictDoNothing();
    }
  }

  return NextResponse.json({ recruiter: updated });
}
