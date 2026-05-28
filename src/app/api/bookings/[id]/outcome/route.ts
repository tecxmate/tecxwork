import { NextRequest, NextResponse } from "next/server";
import { db, bookings } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getRecruiterFromSession } from "@/lib/auth";
import { parseJsonBody, setOutcomeSchema } from "@/lib/validation";

/**
 * PATCH /api/bookings/[id]/outcome
 * Body: { outcome: "advanced" | "hired" | "rejected" | "no_show" | null }
 *
 * Recruiter records the verdict for an interview round. This is an annotation
 * on the round; it does not change the booking status (use accept/reject/cancel
 * for that). "rejected"/"hired" simply mark where the pipeline ended.
 */
export async function PATCH(
  req: NextRequest,
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

  const parsed = await parseJsonBody(req, setOutcomeSchema);
  if (!parsed.ok) return parsed.response;
  const { outcome } = parsed.data;

  const [booking] = await db
    .select({ recruiterId: bookings.recruiterId })
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.recruiterId !== auth.recruiterId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [updated] = await db
    .update(bookings)
    .set({ outcome })
    .where(eq(bookings.id, bookingId))
    .returning({ id: bookings.id, outcome: bookings.outcome });

  return NextResponse.json({ ok: true, booking: updated });
}
