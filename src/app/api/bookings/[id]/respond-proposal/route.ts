import { NextRequest, NextResponse } from "next/server";
import { db, bookings, recruiters, users } from "@/lib/db";
import { eq, and, sql, inArray, or, ne } from "drizzle-orm";
import { applicantSlots } from "@/lib/db";
import { getApplicantFromSession } from "@/lib/auth";
import { parseJsonBody, respondProposalSchema } from "@/lib/validation";
import {
  sendBookingEmails,
  sendRejectionEmail,
} from "@/lib/email";
import { createBookingNotification } from "@/lib/notifications";

/**
 * POST /api/bookings/[id]/respond-proposal
 * Body: { action: "accept" | "decline" }
 *
 * Student response to a recruiter-proposed alternate time.
 *  - accept: requestedTime ← proposedTime, run the same slot-claim transaction
 *    used by recruiter acceptance, send confirmation emails.
 *  - decline: cancel the booking.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApplicantFromSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const bookingId = parseInt(id);
  if (isNaN(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, respondProposalSchema);
  if (!parsed.ok) return parsed.response;
  const { action } = parsed.data;

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.applicantId !== auth.applicantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (booking.status !== "reschedule_proposed" || !booking.proposedTime) {
    return NextResponse.json(
      { error: "No active reschedule proposal for this booking" },
      { status: 400 }
    );
  }

  const [rec] = await db
    .select({
      company: recruiters.company,
      contactEmail: recruiters.contactEmail,
      name: users.name,
    })
    .from(recruiters)
    .innerJoin(users, eq(recruiters.userId, users.id))
    .where(eq(recruiters.id, booking.recruiterId));

  // --- DECLINE: cancel the booking ---
  if (action === "decline") {
    await db
      .update(bookings)
      .set({ status: "cancelled" })
      .where(eq(bookings.id, bookingId));

    if (rec) {
      sendRejectionEmail({
        applicantName: booking.applicantName,
        applicantEmail: booking.applicantEmail,
        company: rec.company,
        action: "cancelled",
      }).catch(() => {});

      createBookingNotification({
        recipientEmail: rec.contactEmail,
        recipientRole: "recruiter",
        status: "cancelled",
        applicantName: booking.applicantName,
        companyName: rec.company,
        position: booking.position ?? undefined,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  // --- ACCEPT: swap requestedTime → proposedTime, then claim a slot ---
  const proposedTime = booking.proposedTime;

  const acceptanceResult = await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`${booking.applicantEmail}:${proposedTime.toISOString()}`}))`
    );

    const [current] = await tx
      .select({ id: bookings.id, status: bookings.status })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!current || current.status !== "reschedule_proposed") {
      return {
        ok: false as const,
        status: 409,
        error: `Cannot accept a proposal with status "${current?.status ?? "missing"}"`,
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
            eq(bookings.requestedTime, proposedTime),
            eq(applicantSlots.startTime, proposedTime)
          )
        )
      )
      .limit(1);

    if (acceptedConflict) {
      return {
        ok: false as const,
        status: 409,
        error: "You already have an accepted interview at this time.",
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
          AND start_time = ${proposedTime}
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
          "No available interviewer slot at the proposed time. Ask the recruiter to suggest a different time.",
      };
    }

    const accepted = await tx
      .update(bookings)
      .set({
        slotId: claimedRow.id,
        status: "accepted",
        requestedTime: proposedTime,
      })
      .where(
        and(
          eq(bookings.id, bookingId),
          inArray(bookings.status, ["reschedule_proposed"])
        )
      )
      .returning({ id: bookings.id });

    if (!accepted.length) {
      throw new Error("Booking status changed before acceptance completed");
    }

    return {
      ok: true as const,
      slot: {
        id: claimedRow.id,
        startTime: claimedRow.start_time,
        endTime: claimedRow.end_time,
      },
    };
  });

  if (!acceptanceResult.ok) {
    return NextResponse.json(
      { error: acceptanceResult.error },
      { status: acceptanceResult.status }
    );
  }

  const slot = acceptanceResult.slot;

  if (rec) {
    sendBookingEmails({
      applicantName: booking.applicantName,
      applicantEmail: booking.applicantEmail,
      recruiterName: rec.name,
      recruiterEmail: rec.contactEmail,
      company: rec.company,
      slotStart: slot.startTime,
      slotEnd: slot.endTime,
      cvLink: booking.cvLink,
      direction: "applicant_books_recruiter",
    }).catch(() => {});

    createBookingNotification({
      recipientEmail: booking.applicantEmail,
      recipientRole: "applicant",
      status: "accepted",
      companyName: rec.company,
      position: booking.position ?? undefined,
      interviewTime: slot.startTime,
    }).catch(() => {});

    createBookingNotification({
      recipientEmail: rec.contactEmail,
      recipientRole: "recruiter",
      status: "accepted",
      applicantName: booking.applicantName,
      companyName: rec.company,
      position: booking.position ?? undefined,
      interviewTime: slot.startTime,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, status: "accepted" });
}
