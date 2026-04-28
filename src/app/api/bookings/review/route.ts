import { NextRequest, NextResponse } from "next/server";
import { db, bookings, slots, recruiters, applicantSlots } from "@/lib/db";
import { eq, and, sql, or, ne, inArray } from "drizzle-orm";
import { getRecruiterFromSession } from "@/lib/auth";
import { sendBookingEmails, sendRejectionEmail, sendWaitlistEmail } from "@/lib/email";
import { createBookingNotification } from "@/lib/notifications";
import { users } from "@/lib/db";

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

  const body = await req.json();
  const { bookingId, action, note } = body;

  if (!bookingId || !["accept", "reject", "waitlist"].includes(action)) {
    return NextResponse.json(
      { error: "bookingId and action (accept/reject/waitlist) required" },
      { status: 400 }
    );
  }

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

    // Find a random available slot at the requested time
    const [randomSlot] = await tx
      .select({
        id: slots.id,
        startTime: slots.startTime,
        endTime: slots.endTime,
      })
      .from(slots)
      .where(
        and(
          eq(slots.recruiterId, recruiter.id),
          eq(slots.startTime, booking.requestedTime!),
          eq(slots.status, "available")
        )
      )
      .orderBy(sql`random()`)
      .limit(1);

    if (!randomSlot) {
      return {
        ok: false as const,
        status: 409,
        error:
          "No available interviewer slots at this time. All interviewers are booked. Try waitlisting instead.",
      };
    }

    // Atomic lock the slot
    const updated = await tx
      .update(slots)
      .set({ status: "booked" })
      .where(and(eq(slots.id, randomSlot.id), eq(slots.status, "available")))
      .returning({ id: slots.id });

    if (!updated.length) {
      return {
        ok: false as const,
        status: 409,
        error: "Slot was just taken. Try again.",
      };
    }

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
