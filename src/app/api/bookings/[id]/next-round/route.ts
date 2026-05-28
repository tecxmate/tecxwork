import { NextRequest, NextResponse } from "next/server";
import { db, bookings, recruiters, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getRecruiterFromSession } from "@/lib/auth";
import { parseJsonBody, nextRoundSchema } from "@/lib/validation";
import { sendRescheduleProposalEmail } from "@/lib/email";
import { createBookingNotification } from "@/lib/notifications";

/**
 * POST /api/bookings/[id]/next-round
 * Body: { proposedTime: ISO string, label?: string, note?: string }
 *
 * Recruiter advances a candidate to the next interview round. Creates a NEW
 * booking row (round_number = parent + 1, parent_booking_id = parent) in
 * `reschedule_proposed` status with the proposed time, and marks the parent
 * round's outcome as "advanced". The student accepts/declines through the
 * existing /respond-proposal flow, which claims a slot at the proposed time.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getRecruiterFromSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parentId = parseInt(id);
  if (isNaN(parentId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, nextRoundSchema);
  if (!parsed.ok) return parsed.response;
  const { proposedTime, label, note } = parsed.data;

  const proposedDate = new Date(proposedTime);
  if (isNaN(proposedDate.getTime())) {
    return NextResponse.json({ error: "Invalid proposed time" }, { status: 400 });
  }

  const [parent] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, parentId));

  if (!parent) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (parent.recruiterId !== auth.recruiterId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (parent.status !== "accepted") {
    return NextResponse.json(
      { error: "Can only add a next round after the current round is accepted." },
      { status: 400 }
    );
  }

  const [rec] = await db
    .select({
      company: recruiters.company,
      contactEmail: recruiters.contactEmail,
      userEmail: users.email,
    })
    .from(recruiters)
    .innerJoin(users, eq(recruiters.userId, users.id))
    .where(eq(recruiters.id, auth.recruiterId));

  const [created] = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(bookings)
      .values({
        direction: parent.direction,
        recruiterId: parent.recruiterId,
        applicantId: parent.applicantId,
        position: parent.position,
        applicantName: parent.applicantName,
        applicantEmail: parent.applicantEmail,
        cvLink: parent.cvLink,
        pipaConsent: parent.pipaConsent,
        status: "reschedule_proposed",
        proposedTime: proposedDate,
        proposedByEmail: rec?.userEmail ?? null,
        roundNumber: parent.roundNumber + 1,
        roundLabel: label ?? null,
        parentBookingId: parent.id,
      })
      .returning();

    await tx
      .update(bookings)
      .set({ outcome: "advanced" })
      .where(eq(bookings.id, parent.id));

    return inserted;
  });

  if (rec) {
    sendRescheduleProposalEmail({
      applicantName: parent.applicantName,
      applicantEmail: parent.applicantEmail,
      company: rec.company,
      position: parent.position ?? undefined,
      proposedTime: proposedDate,
      recruiterNote: note,
    }).catch(() => {});

    createBookingNotification({
      recipientEmail: parent.applicantEmail,
      recipientRole: "applicant",
      status: "reschedule_proposed",
      companyName: rec.company,
      position: parent.position ?? undefined,
      interviewTime: proposedDate,
      note,
    }).catch(() => {});
  }

  return NextResponse.json({ booking: created }, { status: 201 });
}
