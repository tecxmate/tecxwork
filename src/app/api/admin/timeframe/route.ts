import { NextRequest, NextResponse } from "next/server";
import { db, eventConfig, slots, recruiters, bookings, applicantProfiles, applicantSlots } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { and, eq, count, inArray } from "drizzle-orm";
import { getEventBranding, invalidateEventConfigCache } from "@/lib/event-branding";
import { currentEventId } from "@/lib/tenant";
import { getResend, EMAIL_FROM, getPublicBaseUrl } from "@/lib/email";
import { logBookingAction } from "@/lib/booking-action-log";

/**
 * PUT /api/admin/timeframe
 * Body: { startHour, endHour, endMinute, slotDuration }
 * Updates event_config and regenerates unbooked slots for all recruiters.
 */
export async function PUT(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await handlePut(req, admin);
  } catch (err) {
    console.error("PUT /api/admin/timeframe failed:", err);
    return NextResponse.json(
      {
        error: `Failed to save time frame: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
      { status: 500 }
    );
  }
}

async function handlePut(
  req: NextRequest,
  admin: { userId: number; email: string }
) {
  const body = await req.json();
  const { forceOverride } = body;
  const { startHour, startMinute = 0, endHour, endMinute, slotDuration, bufferMinutes = 0 } = body;

  if (
    typeof startHour !== "number" ||
    typeof startMinute !== "number" ||
    typeof endHour !== "number" ||
    typeof endMinute !== "number" ||
    typeof slotDuration !== "number" ||
    typeof bufferMinutes !== "number" ||
    startHour < 0 || startHour > 23 ||
    startMinute < 0 || startMinute > 59 ||
    endHour < startHour || endHour > 24 ||
    endMinute < 0 || endMinute > 59 ||
    slotDuration < 5 || slotDuration > 120 ||
    bufferMinutes < 0 || bufferMinutes > 30
  ) {
    return NextResponse.json({ error: "Invalid time parameters" }, { status: 400 });
  }

  const eventId = await currentEventId();

  // Check if any bookings exist (pending, accepted, or waitlisted)
  const [activeBookingsCount] = await db
    .select({ count: count() })
    .from(bookings)
    .where(and(eq(bookings.status, "pending"), eq(bookings.eventId, eventId)));

  const [acceptedBookingsCount] = await db
    .select({ count: count() })
    .from(bookings)
    .where(and(eq(bookings.status, "accepted"), eq(bookings.eventId, eventId)));

  const [waitlistedBookingsCount] = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(eq(bookings.status, "waitlisted"), eq(bookings.eventId, eventId))
    );

  const totalActive =
    activeBookingsCount.count + acceptedBookingsCount.count + waitlistedBookingsCount.count;

  if (totalActive > 0 && !forceOverride) {
    return NextResponse.json(
      {
        error: `Cannot change time frame — ${totalActive} active booking${totalActive > 1 ? "s" : ""} exist (${acceptedBookingsCount.count} accepted, ${activeBookingsCount.count} pending, ${waitlistedBookingsCount.count} waitlisted). Use force override to cancel all bookings and notify students.`,
        activeBookings: totalActive,
        canForceOverride: true,
      },
      { status: 423 }
    );
  }

  // If force override, cancel all active bookings and send emails
  if (totalActive > 0 && forceOverride) {
    const activeBookingsList = await db
      .select({
        id: bookings.id,
        recruiterId: bookings.recruiterId,
        applicantId: bookings.applicantId,
        slotId: bookings.slotId,
        applicantSlotId: bookings.applicantSlotId,
        status: bookings.status,
        requestedTime: bookings.requestedTime,
        proposedTime: bookings.proposedTime,
      })
      .from(bookings)
      .where(
        and(
          inArray(bookings.status, ["pending", "accepted", "waitlisted"]),
          eq(bookings.eventId, eventId)
        )
      );

    const applicantIds = [...new Set(
      activeBookingsList
        .map((b) => b.applicantId)
        .filter((id): id is number => id !== null)
    )];

    const applicants = applicantIds.length > 0
      ? await db
          .select({
            id: applicantProfiles.id,
            name: applicantProfiles.name,
            email: applicantProfiles.email,
          })
          .from(applicantProfiles)
          .where(inArray(applicantProfiles.id, applicantIds))
      : [];

    // Cancel all active bookings
    await db
      .update(bookings)
      .set({ status: "cancelled" })
      .where(inArray(bookings.status, ["pending", "accepted", "waitlisted"]));

    const recruiterSlotIds = activeBookingsList
      .map((b) => b.slotId)
      .filter((id): id is number => id !== null);
    const applicantSlotIds = activeBookingsList
      .map((b) => b.applicantSlotId)
      .filter((id): id is number => id !== null);

    if (recruiterSlotIds.length > 0) {
      await db
        .update(slots)
        .set({ status: "available" })
        .where(inArray(slots.id, recruiterSlotIds));
    }
    if (applicantSlotIds.length > 0) {
      await db
        .update(applicantSlots)
        .set({ status: "available" })
        .where(inArray(applicantSlots.id, applicantSlotIds));
    }

    await Promise.all(
      activeBookingsList.map((booking) =>
        logBookingAction({
          bookingId: booking.id,
          recruiterId: booking.recruiterId,
          applicantId: booking.applicantId,
          actorRole: "admin",
          actorUserId: admin.userId,
          actorEmail: admin.email,
          action: "admin_timeframe_force_cancelled",
          statusBefore: booking.status,
          statusAfter: "cancelled",
          requestedTime: booking.requestedTime,
          proposedTime: booking.proposedTime,
          metadata: {
            reason: "timeframe_force_override",
            releasedSlotId: booking.slotId,
            releasedApplicantSlotId: booking.applicantSlotId,
            nextTimeframe: {
              startHour,
              startMinute,
              endHour,
              endMinute,
              slotDuration,
              bufferMinutes,
            },
          },
        })
      )
    );

    // Send rescheduling emails to affected students
    const resend = getResend();
    if (resend) {
      const branding = await getEventBranding();
      const emailPromises = applicants.map(async (applicant) => {
        try {
          await resend.emails.send({
            from: EMAIL_FROM,
            to: applicant.email,
            subject: `Interview Rescheduled — Please Book Again`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px;">
                <h2 style="margin: 0 0 8px; font-size: 20px;">Interview Rescheduled</h2>
                <p style="color: #666; margin: 0 0 24px; font-size: 14px;">
                  The event organizer has updated the interview time frame for the ${branding.organizerShort} ${branding.displayYear} Career Fair.
                </p>

                <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 14px; color: #92400e;">
                    <strong>Your previous interview booking has been cancelled.</strong><br>
                    Please visit the platform to book a new interview slot.
                  </p>
                </div>

                <div style="margin-bottom: 24px;">
                  <a href="${getPublicBaseUrl()}/browse" target="_blank" style="display: inline-block; background: #8C52FF; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
                    Book New Interview
                  </a>
                </div>

                <p style="font-size: 12px; color: #999; margin-top: 32px;">
                  ${branding.name}<br>
                  Powered by <a href="https://work.tecxmate.com" style="color: #8C52FF; text-decoration: none; font-weight: 500;">TECXWORK</a>
                </p>
              </div>
            `,
          });
        } catch (err) {
          console.error(`Failed to send rescheduling email to ${applicant.email}:`, err);
        }
      });

      await Promise.allSettled(emailPromises);
    }

    console.log(`Force override: cancelled ${activeBookingsList.length} bookings, notified ${applicants.length} students`);
  }

  // Update config
  const [config] = await db
    .select({ id: eventConfig.id })
    .from(eventConfig)
    .where(eq(eventConfig.eventId, eventId))
    .limit(1);
  if (!config) {
    return NextResponse.json({ error: "Event config not found" }, { status: 404 });
  }

  await db
    .update(eventConfig)
    .set({
      startHour,
      startMinute,
      endHour,
      endMinute,
      slotDurationMinutes: slotDuration,
      bufferMinutes,
    })
    .where(eq(eventConfig.id, config.id));
  await invalidateEventConfigCache(eventId);

  // Regenerate unbooked slots for all recruiters.
  // Cancelled/rejected bookings can still hold FK references to
  // available slots, which blocks the delete. Null those refs first.
  const availableSlotRows = await db
    .select({ id: slots.id })
    .from(slots)
    .where(and(eq(slots.status, "available"), eq(slots.eventId, eventId)));
  const availableSlotIds = availableSlotRows.map((r) => r.id);
  if (availableSlotIds.length > 0) {
    await db
      .update(bookings)
      .set({ slotId: null })
      .where(inArray(bookings.slotId, availableSlotIds));
    await db.delete(slots).where(inArray(slots.id, availableSlotIds));
  }

  // Get all recruiters
  const allRecruiters = await db
    .select({ id: recruiters.id, interviewerCount: recruiters.interviewerCount })
    .from(recruiters)
    .where(eq(recruiters.eventId, eventId));

  // Format the event day in Asia/Taipei explicitly. Vercel runs in UTC,
  // so dateObj.getDate() can return the previous day for early-morning
  // Taipei start times. sv-SE returns "YYYY-MM-DD HH:mm:ss".
  const branding = await getEventBranding();
  const eventDate = branding.date
    .toLocaleString("sv-SE", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .slice(0, 10);
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

    const slotInterval = slotDuration + bufferMinutes;
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Iterate in absolute minutes so non-60-dividing slot durations
    // (e.g., 45 min) keep a consistent cadence across hour boundaries,
    // and a slot is only created if it ends within the event window.
    for (
      let t = startMinutes;
      t + slotDuration <= endMinutes;
      t += slotInterval
    ) {
      const h = Math.floor(t / 60);
      const m = t % 60;
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

    if (newSlots.length > 0) {
      await db.insert(slots).values(newSlots).onConflictDoNothing();
      totalCreated += newSlots.length;
    }
  }

  return NextResponse.json({
    ok: true,
    startHour,
    startMinute,
    endHour,
    endMinute,
    slotDuration,
    bufferMinutes,
    slotsRegenerated: totalCreated,
  });
}
