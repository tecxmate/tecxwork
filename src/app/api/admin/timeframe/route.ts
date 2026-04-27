import { NextRequest, NextResponse } from "next/server";
import { db, eventConfig, slots, recruiters, bookings, applicantProfiles } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { eq, and, count, inArray } from "drizzle-orm";
import { EVENT_CONFIG } from "@/lib/data";
import { getResend, EMAIL_FROM } from "@/lib/email";

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

  const body = await req.json();
  const { forceOverride } = body;

  // Check if any bookings exist (pending, accepted, or waitlisted)
  const [activeBookingsCount] = await db
    .select({ count: count() })
    .from(bookings)
    .where(eq(bookings.status, "pending"));

  const [acceptedBookingsCount] = await db
    .select({ count: count() })
    .from(bookings)
    .where(eq(bookings.status, "accepted"));

  const [waitlistedBookingsCount] = await db
    .select({ count: count() })
    .from(bookings)
    .where(eq(bookings.status, "waitlisted"));

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
        applicantId: bookings.applicantId,
        status: bookings.status,
      })
      .from(bookings)
      .where(inArray(bookings.status, ["pending", "accepted", "waitlisted"]));

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

    // Send rescheduling emails to affected students
    const resend = getResend();
    if (resend) {
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
                  The event organizer has updated the interview time frame for the ${EVENT_CONFIG.organizerShort} ${EVENT_CONFIG.displayYear} Career Fair.
                </p>

                <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 14px; color: #92400e;">
                    <strong>Your previous interview booking has been cancelled.</strong><br>
                    Please visit the platform to book a new interview slot.
                  </p>
                </div>

                <div style="margin-bottom: 24px;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://tecxwork.com"}/browse" target="_blank" style="display: inline-block; background: #8C52FF; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
                    Book New Interview
                  </a>
                </div>

                <p style="font-size: 12px; color: #999; margin-top: 32px;">
                  ${EVENT_CONFIG.name}<br>
                  Powered by <a href="https://tecxmate.com" style="color: #8C52FF; text-decoration: none; font-weight: 500;">TECXMATE.COM</a>
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
