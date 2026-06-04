import { NextRequest, NextResponse } from "next/server";
import { db, bookings, recruiters, applicantSlots } from "@/lib/db";
import { eq, and, sql, or, ne, inArray } from "drizzle-orm";
import { getRecruiterFromSession } from "@/lib/auth";
import { sendBookingEmails, sendRejectionEmail, sendWaitlistEmail } from "@/lib/email";
import { createBookingNotification } from "@/lib/notifications";
import { users } from "@/lib/db";
import { parseJsonBody, reviewBookingSchema } from "@/lib/validation";
import { logBookingAction } from "@/lib/booking-action-log";

/**
 * PUT /api/bookings/review
 * Body: { bookingId, action: "accept" | "reject" | "waitlist" }
 *
 * On accept: randomly assign an available interviewer slot, lock it, email both parties.
 * On reject/waitlist: just update status.
 */
export async function PUT(req: NextRequest) {
  const auth = await getRecruiterFromSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const recruiter = { id: auth.recruiterId };

  const parsed = await parseJsonBody(req, reviewBookingSchema);
  if (!parsed.ok) return parsed.response;
  const { bookingId, action, note } = parsed.data;

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.recruiterId !== recruiter.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (booking.status !== "pending" && booking.status !== "waitlisted") {
    return NextResponse.json(
      { error: `Cannot ${action} a booking with status "${booking.status}"` },
      { status: 400 }
    );
  }

  // --- REJECT or WAITLIST ---
  if (action === "reject" || action === "waitlist") {
    await db
      .update(bookings)
      .set({ status: action === "reject" ? "rejected" : "waitlisted" })
      .where(eq(bookings.id, bookingId));

    await logBookingAction({
      bookingId,
      recruiterId: booking.recruiterId,
      applicantId: booking.applicantId,
      actorRole: "recruiter",
      actorUserId: auth.session.userId,
      actorEmail: auth.session.email,
      action: action === "reject" ? "recruiter_rejected" : "recruiter_waitlisted",
      statusBefore: booking.status,
      statusAfter: action === "reject" ? "rejected" : "waitlisted",
      requestedTime: booking.requestedTime,
      proposedTime: booking.proposedTime,
      metadata: {
        hadNote: Boolean(note?.trim()),
      },
    });

    // Send rejection email with optional note
    if (action === "reject") {
      const [rec] = await db
        .select({ company: recruiters.company })
        .from(recruiters)
        .where(eq(recruiters.id, recruiter.id));

      if (rec) {
        sendRejectionEmail({
          applicantName: booking.applicantName,
          applicantEmail: booking.applicantEmail,
          company: rec.company,
          recruiterNote: note?.trim() || undefined,
          action: "rejected",
        }).catch(() => {});

        createBookingNotification({
          recipientEmail: booking.applicantEmail,
          recipientRole: "applicant",
          status: "rejected",
          companyName: rec.company,
          position: booking.position ?? undefined,
          note: note?.trim() || undefined,
        }).catch(() => {});
      }
    }

    if (action === "waitlist") {
      const [rec] = await db
        .select({ company: recruiters.company })
        .from(recruiters)
        .where(eq(recruiters.id, recruiter.id));

      if (rec) {
        sendWaitlistEmail({
          applicantName: booking.applicantName,
          applicantEmail: booking.applicantEmail,
          company: rec.company,
          position: booking.position ?? undefined,
        }).catch(() => {});

        createBookingNotification({
          recipientEmail: booking.applicantEmail,
          recipientRole: "applicant",
          status: "waitlisted",
          companyName: rec.company,
          position: booking.position ?? undefined,
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      ok: true,
      status: action === "reject" ? "rejected" : "waitlisted",
    });
  }

  // --- ACCEPT ---
  if (!booking.requestedTime) {
    return NextResponse.json(
      { error: "Booking has no requested time" },
      { status: 400 }
    );
  }

  const acceptanceResult = await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`${booking.applicantEmail}:${booking.requestedTime!.toISOString()}`}))`
    );

    const [currentBooking] = await tx
      .select({
        id: bookings.id,
        status: bookings.status,
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!currentBooking || !["pending", "waitlisted"].includes(currentBooking.status)) {
      return {
        ok: false as const,
        status: 409,
        error: `Cannot ${action} a booking with status "${currentBooking?.status ?? "missing"}"`,
      };
    }

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
            eq(bookings.requestedTime, booking.requestedTime!),
            eq(applicantSlots.startTime, booking.requestedTime!)
          )
        )
      )
      .limit(1);

    if (acceptedConflict) {
      return {
        ok: false as const,
        status: 409,
        error:
          "This applicant already has an accepted interview at this time.",
      };
    }

    // Claim an available interviewer slot atomically. SKIP LOCKED is the
    // Postgres job-queue pattern: two concurrent acceptances pick different
    // rows, so we never spuriously report "no slot" when a free one exists.
    const claimed = await tx.execute<{
      id: number;
      start_time: Date;
      end_time: Date;
    }>(sql`
      UPDATE slots SET status = 'booked'
      WHERE id = (
        SELECT id FROM slots
        WHERE recruiter_id = ${recruiter.id}
          AND start_time = ${booking.requestedTime!}
          AND status = 'available'
        ORDER BY random()
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING id, start_time, end_time
    `);

    const claimedRow = claimed.rows?.[0];
    if (!claimedRow) {
      return {
        ok: false as const,
        status: 409,
        error:
          "No available interviewer slots at this time. All interviewers are booked. Try waitlisting instead.",
      };
    }

    const randomSlot = {
      id: claimedRow.id,
      startTime: claimedRow.start_time,
      endTime: claimedRow.end_time,
    };

    // Update booking: assign slot, mark accepted
    const accepted = await tx
      .update(bookings)
      .set({ slotId: randomSlot.id, status: "accepted" })
      .where(
        and(
          eq(bookings.id, bookingId),
          inArray(bookings.status, ["pending", "waitlisted"])
        )
      )
      .returning({ id: bookings.id });

    if (!accepted.length) {
      throw new Error("Booking status changed before acceptance completed");
    }

    return { ok: true as const, slot: randomSlot };
  });

  if (!acceptanceResult.ok) {
    return NextResponse.json(
      { error: acceptanceResult.error },
      { status: acceptanceResult.status }
    );
  }

  const randomSlot = acceptanceResult.slot;

  await logBookingAction({
    bookingId,
    recruiterId: booking.recruiterId,
    applicantId: booking.applicantId,
    actorRole: "recruiter",
    actorUserId: auth.session.userId,
    actorEmail: auth.session.email,
    action: "recruiter_accepted",
    statusBefore: booking.status,
    statusAfter: "accepted",
    requestedTime: booking.requestedTime,
    proposedTime: booking.proposedTime,
    metadata: {
      slotId: randomSlot.id,
    },
  });

  // Send confirmation emails
  const [rec] = await db
    .select({
      company: recruiters.company,
      contactEmail: recruiters.contactEmail,
      name: users.name,
    })
    .from(recruiters)
    .innerJoin(users, eq(recruiters.userId, users.id))
    .where(eq(recruiters.id, recruiter.id));

  if (rec) {
    sendBookingEmails({
      applicantName: booking.applicantName,
      applicantEmail: booking.applicantEmail,
      recruiterName: rec.name,
      recruiterEmail: rec.contactEmail,
      company: rec.company,
      slotStart: randomSlot.startTime,
      slotEnd: randomSlot.endTime,
      cvLink: booking.cvLink,
      direction: "applicant_books_recruiter",
    }).catch(() => {});

    createBookingNotification({
      recipientEmail: booking.applicantEmail,
      recipientRole: "applicant",
      status: "accepted",
      companyName: rec.company,
      position: booking.position ?? undefined,
      interviewTime: randomSlot.startTime,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, status: "accepted" });
}
