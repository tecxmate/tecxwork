import { NextRequest, NextResponse } from "next/server";
import { db, bookings, slots, applicantSlots, recruiters } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { currentEventId } from "@/lib/tenant";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const recruiterId = url.searchParams.get("recruiterId");

  let query = db
    .select({
      id: bookings.id,
      applicantName: bookings.applicantName,
      applicantEmail: bookings.applicantEmail,
      cvLink: bookings.cvLink,
      status: bookings.status,
      recruiterId: bookings.recruiterId,
      slotId: bookings.slotId,
      createdAt: bookings.createdAt,
      requestedTime: bookings.requestedTime,
      proposedTime: bookings.proposedTime,
      slotStart: slots.startTime,
      slotEnd: slots.endTime,
      applicantSlotStart: applicantSlots.startTime,
      applicantSlotEnd: applicantSlots.endTime,
      company: recruiters.company,
    })
    .from(bookings)
    .leftJoin(slots, eq(bookings.slotId, slots.id))
    .leftJoin(applicantSlots, eq(bookings.applicantSlotId, applicantSlots.id))
    .innerJoin(recruiters, eq(bookings.recruiterId, recruiters.id))
    .orderBy(bookings.createdAt)
    .$dynamic();

  const conditions = [eq(bookings.eventId, await currentEventId())];
  if (recruiterId) {
    conditions.push(eq(bookings.recruiterId, parseInt(recruiterId)));
  }
  query = query.where(and(...conditions));

  const result = await query;
  return NextResponse.json({
    bookings: result.map(({ applicantSlotStart, applicantSlotEnd, ...booking }) => ({
      ...booking,
      slotStart: booking.slotStart ?? applicantSlotStart,
      slotEnd: booking.slotEnd ?? applicantSlotEnd,
    })),
  });
}
