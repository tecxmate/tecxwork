import { NextRequest, NextResponse } from "next/server";
import { db, bookings } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getRecruiterFromSession } from "@/lib/auth";
import { getApplicantBusyRanges } from "@/lib/applicant-busy";

/**
 * GET /api/bookings/[id]/applicant-busy
 *
 * Returns the busy time ranges for the student associated with this booking,
 * across all their bookings at other companies. Time-only — no company name
 * or position — so the recruiter can avoid double-booking without learning
 * who else the student is interviewing with.
 *
 * Scoped to the recruiter who owns the booking.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getRecruiterFromSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const bookingId = parseInt(id);
  if (isNaN(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const [booking] = await db
    .select({
      recruiterId: bookings.recruiterId,
      applicantEmail: bookings.applicantEmail,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.recruiterId !== auth.recruiterId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ranges = await getApplicantBusyRanges(
    booking.applicantEmail,
    bookingId
  );

  return NextResponse.json({
    ranges: ranges.map((r) => ({
      start: r.start.toISOString(),
      end: r.end.toISOString(),
    })),
  });
}
