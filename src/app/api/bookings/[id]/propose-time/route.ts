import { NextRequest, NextResponse } from "next/server";
import { db, bookings, recruiters, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getRecruiterFromSession } from "@/lib/auth";
import { parseJsonBody, proposeTimeSchema } from "@/lib/validation";
import { getPublicBaseUrl, sendRescheduleProposalEmail } from "@/lib/email";
import { createBookingNotification } from "@/lib/notifications";
import { getApplicantBusyRanges, overlapsBusy } from "@/lib/applicant-busy";

const PROPOSAL_DURATION_MS = 30 * 60 * 1000;

/**
 * POST /api/bookings/[id]/propose-time
 * Body: { proposedTime: ISO string, note?: string }
 *
 * Recruiter proposes an alternate interview time. Booking transitions to
 * `reschedule_proposed`. Student must accept (re-routes through the standard
 * acceptance flow with the new time) or decline (cancels).
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
  const bookingId = parseInt(id);
  if (isNaN(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, proposeTimeSchema);
  if (!parsed.ok) return parsed.response;
  const { proposedTime, note, force } = parsed.data;

  const proposedDate = new Date(proposedTime);
  if (isNaN(proposedDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid proposed time" },
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

  if (booking.recruiterId !== auth.recruiterId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    booking.status !== "pending" &&
    booking.status !== "waitlisted" &&
    booking.status !== "reschedule_proposed"
  ) {
    return NextResponse.json(
      {
        error: `Cannot propose a new time for a booking with status "${booking.status}"`,
      },
      { status: 400 }
    );
  }

  if (!force) {
    const proposedEnd = new Date(proposedDate.getTime() + PROPOSAL_DURATION_MS);
    const busy = await getApplicantBusyRanges(booking.applicantEmail, bookingId);
    const hit = overlapsBusy(proposedDate, proposedEnd, busy);
    if (hit) {
      return NextResponse.json(
        {
          error: "applicant_busy",
          message:
            "The student is already booked with another company at this time. Re-submit with force=true to suggest anyway.",
          conflict: {
            start: hit.start.toISOString(),
            end: hit.end.toISOString(),
          },
        },
        { status: 409 }
      );
    }
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

  await db
    .update(bookings)
    .set({
      status: "reschedule_proposed",
      proposedTime: proposedDate,
      proposedByEmail: rec?.userEmail ?? null,
    })
    .where(eq(bookings.id, bookingId));

  if (rec) {
    const proposalPath = `/recruiter/${auth.recruiterId}?proposal=${bookingId}`;
    const proposalUrl = `${getPublicBaseUrl()}${proposalPath}`;

    sendRescheduleProposalEmail({
      applicantName: booking.applicantName,
      applicantEmail: booking.applicantEmail,
      company: rec.company,
      position: booking.position ?? undefined,
      originalTime: booking.requestedTime ?? undefined,
      proposedTime: proposedDate,
      recruiterNote: note,
      actionUrl: proposalUrl,
    }).catch(() => {});

    createBookingNotification({
      recipientEmail: booking.applicantEmail,
      recipientRole: "applicant",
      status: "reschedule_proposed",
      companyName: rec.company,
      position: booking.position ?? undefined,
      interviewTime: proposedDate,
      note,
      bookingId,
      recruiterId: auth.recruiterId,
      actionUrl: proposalPath,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, status: "reschedule_proposed" });
}

/**
 * DELETE /api/bookings/[id]/propose-time
 *
 * Retract a pending proposal. Booking reverts to `pending` and the proposed
 * fields are cleared. No need to wait for the student to respond.
 */
export async function DELETE(
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
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId));

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.recruiterId !== auth.recruiterId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (booking.status !== "reschedule_proposed") {
    return NextResponse.json(
      { error: `No active proposal to retract (status: ${booking.status})` },
      { status: 400 }
    );
  }

  await db
    .update(bookings)
    .set({ status: "pending", proposedTime: null, proposedByEmail: null })
    .where(eq(bookings.id, bookingId));

  return NextResponse.json({ ok: true, status: "pending" });
}
