import { NextRequest, NextResponse } from "next/server";
import {
  db,
  applicantSlots,
  bookings,
  applicantProfiles,
  recruiters,
  slots,
  users,
} from "@/lib/db";
import { eq, and, sql, or } from "drizzle-orm";
import { getRecruiterFromSession } from "@/lib/auth";
import { sendBookingEmails } from "@/lib/email";
import { createBookingNotification } from "@/lib/notifications";

/**
 * POST — Recruiter books an applicant's slot (Mode B).
 * Requires recruiter session. Uses session recruiter ID, not client input.
 */
export async function POST(req: NextRequest) {
  // Auth: must be recruiter with a profile row
  const auth = await getRecruiterFromSession();
  if (!auth) {
    return NextResponse.json(
      { error: "Only recruiters can book applicants" },
      { status: 403 }
    );
  }
  const recruiter = { id: auth.recruiterId };

  const body = await req.json();
  const { applicantSlotId } = body;

  if (!applicantSlotId) {
    return NextResponse.json(
      { error: "applicantSlotId is required" },
      { status: 400 }
    );
  }

  const bookingResult = await db.transaction(async (tx) => {
    // Fetch slot and its owner (applicant)
    const [applicantSlot] = await tx
      .select({
        id: applicantSlots.id,
        applicantId: applicantSlots.applicantId,
        startTime: applicantSlots.startTime,
        endTime: applicantSlots.endTime,
      })
      .from(applicantSlots)
      .where(eq(applicantSlots.id, applicantSlotId));

    if (!applicantSlot) {
      return {
        ok: false as const,
        status: 404,
        error: "Slot not found",
      };
    }

    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`${recruiter.id}:${applicantSlot.startTime.toISOString()}`}))`
    );

    // Fetch applicant info
    const [applicant] = await tx
      .select({
        id: applicantProfiles.id,
        name: applicantProfiles.name,
        email: applicantProfiles.email,
        cvLink: applicantProfiles.cvLink,
      })
      .from(applicantProfiles)
      .where(eq(applicantProfiles.id, applicantSlot.applicantId));

    if (!applicant) {
      return {
        ok: false as const,
        status: 404,
        error: "Applicant not found",
      };
    }

    const [acceptedConflict] = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .leftJoin(slots, eq(bookings.slotId, slots.id))
      .leftJoin(applicantSlots, eq(bookings.applicantSlotId, applicantSlots.id))
      .where(
        and(
          eq(bookings.applicantEmail, applicant.email),
          eq(bookings.status, "accepted"),
          or(
            eq(bookings.requestedTime, applicantSlot.startTime),
            eq(slots.startTime, applicantSlot.startTime),
            eq(applicantSlots.startTime, applicantSlot.startTime)
          )
        )
      )
      .limit(1);

    if (acceptedConflict) {
      return {
        ok: false as const,
        status: 409,
        error: "This applicant already has an accepted interview at this time.",
      };
    }

    // Claim an interviewer slot atomically. SKIP LOCKED avoids spurious "slot
    // taken" errors when other free slots exist at the same time.
    const claimed = await tx.execute<{
      id: number;
      start_time: Date;
      end_time: Date;
    }>(sql`
      UPDATE slots SET status = 'booked'
      WHERE id = (
        SELECT id FROM slots
        WHERE recruiter_id = ${recruiter.id}
          AND start_time = ${applicantSlot.startTime}
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
          "No available interviewer slots at this time. All interviewers are booked.",
      };
    }

    const recruiterSlot = {
      id: claimedRow.id,
      startTime: claimedRow.start_time,
      endTime: claimedRow.end_time,
    };

    const updatedApplicantSlot = await tx
      .update(applicantSlots)
      .set({ status: "booked" })
      .where(
        and(
          eq(applicantSlots.id, applicantSlotId),
          eq(applicantSlots.status, "available")
        )
      )
      .returning({ id: applicantSlots.id });

    if (!updatedApplicantSlot.length) {
      // Roll back the recruiter slot we just claimed so it doesn't leak.
      await tx
        .update(slots)
        .set({ status: "available" })
        .where(eq(slots.id, recruiterSlot.id));
      return {
        ok: false as const,
        status: 409,
        error: "This slot is no longer available.",
      };
    }

    const [booking] = await tx
      .insert(bookings)
      .values({
        direction: "recruiter_books_applicant",
        slotId: recruiterSlot.id,
        applicantSlotId,
        recruiterId: recruiter.id,
        applicantId: applicant.id,
        applicantName: applicant.name,
        applicantEmail: applicant.email,
        cvLink: applicant.cvLink,
        pipaConsent: true,
        status: "accepted",
      })
      .returning();

    return {
      ok: true as const,
      booking,
      applicant,
      applicantSlot,
      recruiterSlot,
    };
  });

  if (!bookingResult.ok) {
    return NextResponse.json(
      { error: bookingResult.error },
      { status: bookingResult.status }
    );
  }

  const { booking, applicant, recruiterSlot } = bookingResult;

  // Fetch recruiter details for email
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
      applicantName: applicant.name,
      applicantEmail: applicant.email,
      recruiterName: rec.name,
      recruiterEmail: rec.contactEmail,
      company: rec.company,
      slotStart: recruiterSlot.startTime,
      slotEnd: recruiterSlot.endTime,
      cvLink: applicant.cvLink,
      direction: "recruiter_books_applicant",
    }).catch(() => {});

    createBookingNotification({
      recipientEmail: applicant.email,
      recipientRole: "applicant",
      status: "accepted",
      companyName: rec.company,
      interviewTime: recruiterSlot.startTime,
    }).catch(() => {});
  }

  return NextResponse.json({ booking });
}
