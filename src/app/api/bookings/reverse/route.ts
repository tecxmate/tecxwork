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
import { getSession } from "@/lib/auth";
import { sendBookingEmails } from "@/lib/email";
import { createBookingNotification } from "@/lib/notifications";

/**
 * POST — Recruiter books an applicant's slot (Mode B).
 * Requires recruiter session. Uses session recruiter ID, not client input.
 */
export async function POST(req: NextRequest) {
  // Auth: must be recruiter
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "recruiter") {
    return NextResponse.json(
      { error: "Only recruiters can book applicants" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { applicantSlotId } = body;

  if (!applicantSlotId) {
    return NextResponse.json(
      { error: "applicantSlotId is required" },
      { status: 400 }
    );
  }

  // Fetch recruiter record from session (not client)
  const [recruiter] = await db
    .select({ id: recruiters.id })
    .from(recruiters)
    .where(eq(recruiters.userId, session.userId));

  if (!recruiter) {
    return NextResponse.json(
      { error: "Recruiter profile not found" },
      { status: 404 }
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

    const [recruiterSlot] = await tx
      .select({
        id: slots.id,
        startTime: slots.startTime,
        endTime: slots.endTime,
      })
      .from(slots)
      .where(
        and(
          eq(slots.recruiterId, recruiter.id),
          eq(slots.startTime, applicantSlot.startTime),
          eq(slots.status, "available")
        )
      )
      .orderBy(sql`random()`)
      .limit(1);

    if (!recruiterSlot) {
      return {
        ok: false as const,
        status: 409,
        error:
          "No available interviewer slots at this time. All interviewers are booked.",
      };
    }

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
      return {
        ok: false as const,
        status: 409,
        error: "This slot is no longer available.",
      };
    }

    const updatedRecruiterSlot = await tx
      .update(slots)
      .set({ status: "booked" })
      .where(and(eq(slots.id, recruiterSlot.id), eq(slots.status, "available")))
      .returning({ id: slots.id });

    if (!updatedRecruiterSlot.length) {
      return {
        ok: false as const,
        status: 409,
        error: "Interviewer slot was just taken. Try another time.",
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
