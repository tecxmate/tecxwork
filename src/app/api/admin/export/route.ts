import { NextResponse } from "next/server";
import { db, bookings, slots, applicantSlots, recruiters } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { csvResponse, datedFilename, toCsv } from "@/lib/csv";
import { eq } from "drizzle-orm";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allBookings = await db
    .select({
      id: bookings.id,
      direction: bookings.direction,
      applicantName: bookings.applicantName,
      applicantEmail: bookings.applicantEmail,
      cvLink: bookings.cvLink,
      status: bookings.status,
      createdAt: bookings.createdAt,
      slotStart: slots.startTime,
      slotEnd: slots.endTime,
      applicantSlotStart: applicantSlots.startTime,
      applicantSlotEnd: applicantSlots.endTime,
      company: recruiters.company,
      contactEmail: recruiters.contactEmail,
    })
    .from(bookings)
    .leftJoin(slots, eq(bookings.slotId, slots.id))
    .leftJoin(applicantSlots, eq(bookings.applicantSlotId, applicantSlots.id))
    .innerJoin(recruiters, eq(bookings.recruiterId, recruiters.id))
    .orderBy(bookings.createdAt);

  const all = allBookings
    .map(({ applicantSlotStart, applicantSlotEnd, ...booking }) => ({
      ...booking,
      slotStart: booking.slotStart ?? applicantSlotStart,
      slotEnd: booking.slotEnd ?? applicantSlotEnd,
    }))
    .sort(
    (a, b) =>
      (a.slotStart ? new Date(a.slotStart).getTime() : 0) -
      (b.slotStart ? new Date(b.slotStart).getTime() : 0)
    );

  // Built through the shared helper, which adds the UTF-8 BOM this file was missing —
  // without it Excel on Windows renders every Vietnamese and Chinese name as mojibake.
  const csv = toCsv(
    [
      "Booking ID",
      "Direction",
      "Applicant Name",
      "Applicant Email",
      "Company",
      "Recruiter Contact",
      "Interview Start",
      "Interview End",
      "CV Link",
      "Status",
      "Booked At",
    ],
    all.map((b) => [
      b.id,
      b.direction,
      b.applicantName,
      b.applicantEmail,
      b.company,
      b.contactEmail,
      b.slotStart ? new Date(b.slotStart) : null,
      b.slotEnd ? new Date(b.slotEnd) : null,
      b.cvLink,
      b.status,
      b.createdAt ? new Date(b.createdAt) : null,
    ])
  );

  return csvResponse(datedFilename("vgen-bookings"), csv);
}
