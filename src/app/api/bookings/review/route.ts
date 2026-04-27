import { NextRequest, NextResponse } from "next/server";
import { db, bookings, slots, recruiters } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { sendBookingEmails, sendRejectionEmail } from "@/lib/email";
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
  const session = await getSession();
  if (!session || session.role !== "recruiter") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { bookingId, action, note } = body;

  if (!bookingId || !["accept", "reject", "waitlist"].includes(action)) {
    return NextResponse.json(
      { error: "bookingId and action (accept/reject/waitlist) required" },
      { status: 400 }
    );
  }

  // Verify recruiter owns this booking
  const [recruiter] = await db
    .select({ id: recruiters.id })
    .from(recruiters)
    .where(eq(recruiters.userId, session.userId));

  if (!recruiter) {
    return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
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

  // Find a random available slot at the requested time
  const [randomSlot] = await db
    .select({
      id: slots.id,
      startTime: slots.startTime,
      endTime: slots.endTime,
    })
    .from(slots)
    .where(
      and(
        eq(slots.recruiterId, recruiter.id),
        eq(slots.startTime, booking.requestedTime),
        eq(slots.status, "available")
      )
    )
    .orderBy(sql`random()`)
    .limit(1);

  if (!randomSlot) {
    return NextResponse.json(
      {
        error:
          "No available interviewer slots at this time. All interviewers are booked. Try waitlisting instead.",
      },
      { status: 409 }
    );
  }

  // Atomic lock the slot
  const updated = await db
    .update(slots)
    .set({ status: "booked" })
    .where(and(eq(slots.id, randomSlot.id), eq(slots.status, "available")))
    .returning({ id: slots.id });

  if (!updated.length) {
    return NextResponse.json(
      { error: "Slot was just taken. Try again." },
      { status: 409 }
    );
  }

  // Update booking: assign slot, mark accepted
  await db
    .update(bookings)
    .set({ slotId: randomSlot.id, status: "accepted" })
    .where(eq(bookings.id, bookingId));

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
