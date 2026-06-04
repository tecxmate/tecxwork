import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, ne, or, sql } from "drizzle-orm";

import { getAdminSession } from "@/lib/auth";
import {
  db,
  bookings,
  slots,
  applicantSlots,
  recruiters,
  users,
} from "@/lib/db";
import { logBookingReschedule } from "@/lib/booking-reschedule-log";
import {
  getPublicBaseUrl,
  sendBookingEmails,
  sendRescheduleProposalEmail,
} from "@/lib/email";
import { createBookingNotification } from "@/lib/notifications";
import {
  adminBookingTimeOverrideSchema,
  parseJsonBody,
} from "@/lib/validation";

type AdminTimeAction = "propose" | "confirm" | "request";

const REQUEST_STATUSES = ["pending", "waitlisted", "reschedule_proposed"] as const;

async function hasAvailableRecruiterSlot(
  recruiterId: number,
  startTime: Date
): Promise<boolean> {
  const [slot] = await db
    .select({ id: slots.id })
    .from(slots)
    .where(
      and(
        eq(slots.recruiterId, recruiterId),
        eq(slots.startTime, startTime),
        eq(slots.status, "available")
      )
    )
    .limit(1);
  return Boolean(slot);
}

/**
 * PUT /api/admin/bookings/[id]/time
 * Body: { time: ISO string, action: "propose" | "confirm" | "request" }
 *
 * Admin-only time control:
 * - propose: correct or create a reschedule proposal for the student to accept.
 * - confirm: claim an available recruiter slot immediately and mark accepted.
 * - request: edit the requested time for a pending/waitlisted booking.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const bookingId = parseInt(id);
  if (Number.isNaN(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, adminBookingTimeOverrideSchema);
  if (!parsed.ok) return parsed.response;

  const action: AdminTimeAction = parsed.data.action;
  const targetTime = new Date(parsed.data.time);
  if (Number.isNaN(targetTime.getTime())) {
    return NextResponse.json({ error: "Invalid time" }, { status: 400 });
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "cancelled" || booking.status === "rejected") {
    return NextResponse.json(
      { error: `Cannot override a booking with status "${booking.status}"` },
      { status: 400 }
    );
  }

  if (action === "request") {
    if (!REQUEST_STATUSES.includes(booking.status as (typeof REQUEST_STATUSES)[number])) {
      return NextResponse.json(
        { error: `Cannot edit requested time for status "${booking.status}"` },
        { status: 400 }
      );
    }

    await db
      .update(bookings)
      .set({
        requestedTime: targetTime,
        proposedTime: null,
        proposedByEmail: null,
        status: booking.status === "reschedule_proposed" ? "pending" : booking.status,
      })
      .where(eq(bookings.id, bookingId));

    const statusAfter =
      booking.status === "reschedule_proposed" ? "pending" : booking.status;
    await logBookingReschedule({
      bookingId,
      recruiterId: booking.recruiterId,
      applicantId: booking.applicantId,
      actorRole: "admin",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      action: "admin_updated_requested_time",
      statusBefore: booking.status,
      statusAfter,
      requestedTime: targetTime,
      proposedTime: booking.proposedTime,
      metadata: {
        previousRequestedTime: booking.requestedTime?.toISOString() ?? null,
        previousProposedTime: booking.proposedTime?.toISOString() ?? null,
        note: parsed.data.note ?? null,
      },
    });

    return NextResponse.json({
      ok: true,
      booking: {
        id: bookingId,
        status: statusAfter,
        requestedTime: targetTime.toISOString(),
        proposedTime: null,
        slotId: booking.slotId,
      },
    });
  }

  if (!(await hasAvailableRecruiterSlot(booking.recruiterId, targetTime))) {
    await logBookingReschedule({
      bookingId,
      recruiterId: booking.recruiterId,
      applicantId: booking.applicantId,
      actorRole: "admin",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      action:
        action === "confirm"
          ? "admin_confirm_blocked_no_slot"
          : "admin_proposal_blocked_no_slot",
      statusBefore: booking.status,
      statusAfter: booking.status,
      requestedTime: booking.requestedTime,
      proposedTime: targetTime,
      metadata: { note: parsed.data.note ?? null },
    });

    return NextResponse.json(
      {
        error: "slot_unavailable",
        message:
          "No available interviewer slot exists at that exact time. Choose one of the recruiter's available slots.",
      },
      { status: 409 }
    );
  }

  if (action === "propose") {
    if (!REQUEST_STATUSES.includes(booking.status as (typeof REQUEST_STATUSES)[number])) {
      return NextResponse.json(
        { error: `Cannot propose a time for status "${booking.status}"` },
        { status: 400 }
      );
    }

    await db
      .update(bookings)
      .set({
        status: "reschedule_proposed",
        proposedTime: targetTime,
        proposedByEmail: admin.email,
      })
      .where(eq(bookings.id, bookingId));

    await logBookingReschedule({
      bookingId,
      recruiterId: booking.recruiterId,
      applicantId: booking.applicantId,
      actorRole: "admin",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      action: "admin_proposed",
      statusBefore: booking.status,
      statusAfter: "reschedule_proposed",
      requestedTime: booking.requestedTime,
      proposedTime: targetTime,
      metadata: {
        previousProposedTime: booking.proposedTime?.toISOString() ?? null,
        note: parsed.data.note ?? null,
      },
    });

    const [rec] = await db
      .select({
        company: recruiters.company,
        contactEmail: recruiters.contactEmail,
      })
      .from(recruiters)
      .where(eq(recruiters.id, booking.recruiterId));

    if (rec) {
      const proposalPath = `/recruiter/${booking.recruiterId}?proposal=${bookingId}`;
      const proposalUrl = `${getPublicBaseUrl()}${proposalPath}`;

      sendRescheduleProposalEmail({
        applicantName: booking.applicantName,
        applicantEmail: booking.applicantEmail,
        company: rec.company,
        position: booking.position ?? undefined,
        originalTime: booking.requestedTime ?? undefined,
        proposedTime: targetTime,
        recruiterNote: parsed.data.note,
        actionUrl: proposalUrl,
      }).catch(() => {});

      createBookingNotification({
        recipientEmail: booking.applicantEmail,
        recipientRole: "applicant",
        status: "reschedule_proposed",
        companyName: rec.company,
        position: booking.position ?? undefined,
        interviewTime: targetTime,
        note: parsed.data.note,
        bookingId,
        recruiterId: booking.recruiterId,
        actionUrl: proposalPath,
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      booking: {
        id: bookingId,
        status: "reschedule_proposed",
        requestedTime: booking.requestedTime?.toISOString() ?? null,
        proposedTime: targetTime.toISOString(),
        slotId: booking.slotId,
      },
    });
  }

  const confirmation = await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`${booking.applicantEmail}:${targetTime.toISOString()}`}))`
    );

    const [acceptedConflict] = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .leftJoin(applicantSlots, eq(bookings.applicantSlotId, applicantSlots.id))
      .where(
        and(
          eq(bookings.applicantEmail, booking.applicantEmail),
          ne(bookings.id, bookingId),
          eq(bookings.status, "accepted"),
          or(
            eq(bookings.requestedTime, targetTime),
            eq(applicantSlots.startTime, targetTime)
          )
        )
      )
      .limit(1);

    if (acceptedConflict) {
      return {
        ok: false as const,
        status: 409,
        error: "The student already has an accepted interview at this time.",
      };
    }

    const claimed = await tx.execute<{
      id: number;
      start_time: Date;
      end_time: Date;
    }>(sql`
      UPDATE slots SET status = 'booked'
      WHERE id = (
        SELECT id FROM slots
        WHERE recruiter_id = ${booking.recruiterId}
          AND start_time = ${targetTime}
          AND status = 'available'
        ORDER BY random()
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING id, start_time, end_time
    `);

    const claimedSlot = claimed.rows?.[0];
    if (!claimedSlot) {
      return {
        ok: false as const,
        status: 409,
        error:
          "No available interviewer slot exists at that exact time. Choose another slot.",
      };
    }

    if (booking.slotId) {
      await tx
        .update(slots)
        .set({ status: "available" })
        .where(eq(slots.id, booking.slotId));
    }
    if (booking.applicantSlotId) {
      await tx
        .update(applicantSlots)
        .set({ status: "available" })
        .where(eq(applicantSlots.id, booking.applicantSlotId));
    }

    await tx
      .update(bookings)
      .set({
        slotId: claimedSlot.id,
        applicantSlotId: null,
        requestedTime: targetTime,
        proposedTime: null,
        proposedByEmail: null,
        status: "accepted",
      })
      .where(
        and(
          eq(bookings.id, bookingId),
          inArray(bookings.status, [
            "pending",
            "waitlisted",
            "reschedule_proposed",
            "accepted",
          ])
        )
      );

    return {
      ok: true as const,
      slot: {
        id: claimedSlot.id,
        startTime: claimedSlot.start_time,
        endTime: claimedSlot.end_time,
      },
    };
  });

  if (!confirmation.ok) {
    await logBookingReschedule({
      bookingId,
      recruiterId: booking.recruiterId,
      applicantId: booking.applicantId,
      actorRole: "admin",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      action: "admin_confirm_failed",
      statusBefore: booking.status,
      statusAfter: booking.status,
      requestedTime: booking.requestedTime,
      proposedTime: targetTime,
      metadata: {
        error: confirmation.error,
        status: confirmation.status,
        note: parsed.data.note ?? null,
      },
    });

    return NextResponse.json(
      { error: confirmation.error },
      { status: confirmation.status }
    );
  }

  await logBookingReschedule({
    bookingId,
    recruiterId: booking.recruiterId,
    applicantId: booking.applicantId,
    actorRole: "admin",
    actorUserId: admin.userId,
    actorEmail: admin.email,
    action: "admin_confirmed",
    statusBefore: booking.status,
    statusAfter: "accepted",
    requestedTime: targetTime,
    proposedTime: targetTime,
    metadata: {
      slotId: confirmation.slot.id,
      previousSlotId: booking.slotId,
      previousRequestedTime: booking.requestedTime?.toISOString() ?? null,
      previousProposedTime: booking.proposedTime?.toISOString() ?? null,
      note: parsed.data.note ?? null,
    },
  });

  const [rec] = await db
    .select({
      company: recruiters.company,
      contactEmail: recruiters.contactEmail,
      name: users.name,
    })
    .from(recruiters)
    .innerJoin(users, eq(recruiters.userId, users.id))
    .where(eq(recruiters.id, booking.recruiterId));

  if (rec) {
    sendBookingEmails({
      applicantName: booking.applicantName,
      applicantEmail: booking.applicantEmail,
      recruiterName: rec.name,
      recruiterEmail: rec.contactEmail,
      company: rec.company,
      slotStart: confirmation.slot.startTime,
      slotEnd: confirmation.slot.endTime,
      cvLink: booking.cvLink,
      direction: "applicant_books_recruiter",
    }).catch(() => {});

    createBookingNotification({
      recipientEmail: booking.applicantEmail,
      recipientRole: "applicant",
      status: "accepted",
      companyName: rec.company,
      position: booking.position ?? undefined,
      interviewTime: confirmation.slot.startTime,
    }).catch(() => {});

    createBookingNotification({
      recipientEmail: rec.contactEmail,
      recipientRole: "recruiter",
      status: "accepted",
      applicantName: booking.applicantName,
      companyName: rec.company,
      position: booking.position ?? undefined,
      interviewTime: confirmation.slot.startTime,
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    booking: {
      id: bookingId,
      status: "accepted",
      requestedTime: targetTime.toISOString(),
      proposedTime: null,
      slotId: confirmation.slot.id,
    },
  });
}
