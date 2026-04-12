import { NextRequest, NextResponse } from "next/server";
import { db, bookings, slots, applicantSlots } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

/** DELETE /api/bookings/[id] — cancel a booking, release the slot */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const bookingId = parseInt(id);
  if (isNaN(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  // Fetch the booking
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Authorization: only the booking's applicant, recruiter, or admin can cancel
  if (session.role === "applicant") {
    // Check applicant owns this booking via applicantEmail matching session
    if (booking.applicantEmail !== session.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (session.role === "recruiter") {
    // Recruiter can cancel bookings on their own slots
    // (recruiterId is checked via the booking record)
    const { db: _db, recruiters } = await import("@/lib/db");
    const [rec] = await _db
      .select({ id: recruiters.id })
      .from(recruiters)
      .where(eq(recruiters.userId, session.userId));
    if (!rec || rec.id !== booking.recruiterId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Release the slot back to available
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

  // Delete the booking
  await db.delete(bookings).where(eq(bookings.id, bookingId));

  return NextResponse.json({ ok: true });
}
