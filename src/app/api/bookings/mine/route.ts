import { NextRequest, NextResponse } from "next/server";
import { db, bookings, recruiters, slots, applicantSlots } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getApplicantFromSession } from "@/lib/auth";

/** GET /api/bookings/mine?recruiterId=X — student's bookings, optionally scoped to one recruiter */
export async function GET(req: NextRequest) {
  const auth = await getApplicantFromSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const recruiterId = url.searchParams.get("recruiterId");
  const parsedRecruiterId = recruiterId ? parseInt(recruiterId) : null;
  if (recruiterId && Number.isNaN(parsedRecruiterId)) {
    return NextResponse.json({ error: "Invalid recruiterId" }, { status: 400 });
  }

  let query = db
    .select({
      id: bookings.id,
      recruiterId: bookings.recruiterId,
      jobOpeningId: bookings.jobOpeningId,
      position: bookings.position,
      status: bookings.status,
      requestedTime: bookings.requestedTime,
      proposedTime: bookings.proposedTime,
      company: recruiters.company,
      slotStart: slots.startTime,
      applicantSlotStart: applicantSlots.startTime,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(recruiters, eq(bookings.recruiterId, recruiters.id))
    .leftJoin(slots, eq(bookings.slotId, slots.id))
    .leftJoin(applicantSlots, eq(bookings.applicantSlotId, applicantSlots.id))
    .where(
      recruiterId
        ? and(
            eq(bookings.applicantId, auth.applicantId),
            eq(bookings.recruiterId, parsedRecruiterId as number)
          )
        : eq(bookings.applicantId, auth.applicantId)
    )
    .$dynamic();

  query = query.orderBy(bookings.createdAt);
  const result = await query;

  return NextResponse.json({
    bookings: result.map(({ slotStart, applicantSlotStart, ...booking }) => ({
      ...booking,
      requestedTime: slotStart ?? applicantSlotStart ?? booking.requestedTime,
    })),
  });
}
