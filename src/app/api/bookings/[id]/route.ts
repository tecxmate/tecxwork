import { NextRequest, NextResponse } from "next/server";
import {
  db,
  bookings,
  slots,
  applicantSlots,
  recruiters,
  eventConfig,
} from "@/lib/db";
import { eq, and } from "drizzle-orm";
import {
  getApplicantFromSession,
  getRecruiterFromSession,
  getSession,
} from "@/lib/auth";
import { sendApplicantCancellationEmail, sendRejectionEmail } from "@/lib/email";
import { createBookingNotification } from "@/lib/notifications";
import { cancelBookingSchema } from "@/lib/validation";
import { logBookingReschedule } from "@/lib/booking-reschedule-log";

/**
 * DELETE /api/bookings/[id] — cancel a booking.
 * If it was accepted, releases the slot.
 * Auto-promotes the first waitlisted applicant for the same time+recruiter.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse optional note from request body. Empty/missing body is fine —
  // schema is fully optional so an empty parse still succeeds.
  let note: string | undefined;
  try {
    const raw = await req.json();
    const parsed = cancelBookingSchema.safeParse(raw);
    if (parsed.success) {
      note = parsed.data.note;
    }
  } catch {
    // No body or invalid JSON — note stays undefined
  }

  const { id } = await params;
  const bookingId = parseInt(id);
  if (isNaN(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  const actorEmail = session.email;

  // Authorization
  if (session.role === "applicant") {
    const auth = await getApplicantFromSession();
    if (!auth || auth.applicantId !== booking.applicantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [config] = await db
      .select({
        studentCancellationEnabled: eventConfig.studentCancellationEnabled,
      })
      .from(eventConfig)
      .limit(1);
    if (config?.studentCancellationEnabled !== true) {
      return NextResponse.json(
        { error: "Student cancellation is currently disabled." },
        { status: 403 }
      );
    }
  } else if (session.role === "recruiter") {
    const auth = await getRecruiterFromSession();
    if (!auth || auth.recruiterId !== booking.recruiterId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Release slot if it was accepted (had a slot assigned)
  if (booking.slotId) {
    await db
      .update(slots)
      .set({ status: "available" })
      .where(eq(slots.id, booking.slotId));
  }
  if (booking.applicantSlotId) {
    await db
      .update(applicantSlots)
      .set({ status: "available" })
      .where(eq(applicantSlots.id, booking.applicantSlotId));
  }

  // Mark as cancelled (don't delete — keep for records)
  await db
    .update(bookings)
    .set({ status: "cancelled" })
    .where(eq(bookings.id, bookingId));

  await logBookingReschedule({
    bookingId,
    recruiterId: booking.recruiterId,
    applicantId: booking.applicantId,
    actorRole: session.role,
    actorEmail,
    action:
      session.role === "applicant"
        ? "student_cancelled"
        : session.role === "recruiter"
          ? "recruiter_cancelled"
          : "admin_cancelled",
    statusBefore: booking.status,
    statusAfter: "cancelled",
    requestedTime: booking.requestedTime,
    proposedTime: booking.proposedTime,
    metadata: {
      releasedSlotId: booking.slotId,
      releasedApplicantSlotId: booking.applicantSlotId,
      note: note ?? null,
    },
  });

  // Send cancellation email to applicant (only when recruiter cancels)
  if (session.role === "recruiter" || session.role === "admin") {
    const [rec] = await db
      .select({ company: recruiters.company })
      .from(recruiters)
      .where(eq(recruiters.id, booking.recruiterId));

    if (rec) {
      sendRejectionEmail({
        applicantName: booking.applicantName,
        applicantEmail: booking.applicantEmail,
        company: rec.company,
        recruiterNote: note,
        action: "cancelled",
      }).catch(() => {});

      createBookingNotification({
        recipientEmail: booking.applicantEmail,
        recipientRole: "applicant",
        status: "cancelled",
        companyName: rec.company,
        position: booking.position ?? undefined,
        note,
      }).catch(() => {});
    }
  } else if (session.role === "applicant") {
    const [rec] = await db
      .select({
        company: recruiters.company,
        contactEmail: recruiters.contactEmail,
      })
      .from(recruiters)
      .where(eq(recruiters.id, booking.recruiterId));

    if (rec) {
      sendApplicantCancellationEmail({
        applicantName: booking.applicantName,
        applicantEmail: booking.applicantEmail,
        recruiterEmail: rec.contactEmail,
        company: rec.company,
        position: booking.position ?? undefined,
        interviewTime: booking.requestedTime,
      }).catch(() => {});

      createBookingNotification({
        recipientEmail: rec.contactEmail,
        recipientRole: "recruiter",
        status: "cancelled",
        applicantName: booking.applicantName,
        companyName: rec.company,
        position: booking.position ?? undefined,
        interviewTime: booking.requestedTime ?? undefined,
        bookingId,
        recruiterId: booking.recruiterId,
        actionUrl: "/dashboard",
      }).catch(() => {});
    }
  }

  // Auto-promote: if there's a waitlisted applicant for the same time+recruiter,
  // promote them to pending so recruiter can accept
  if (booking.requestedTime && booking.status === "accepted") {
    const [waitlisted] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.recruiterId, booking.recruiterId),
          eq(bookings.requestedTime, booking.requestedTime),
          eq(bookings.status, "waitlisted")
        )
      )
      .orderBy(bookings.createdAt)
      .limit(1);

    if (waitlisted) {
      await db
        .update(bookings)
        .set({ status: "pending" })
        .where(eq(bookings.id, waitlisted.id));
    }
  }

  return NextResponse.json({ ok: true });
}
