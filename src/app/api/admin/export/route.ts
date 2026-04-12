import { NextResponse } from "next/server";
import { db, bookings, slots, applicantSlots, recruiters } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Mode A bookings
  const modeA = await db
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
      company: recruiters.company,
      contactEmail: recruiters.contactEmail,
    })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(recruiters, eq(bookings.recruiterId, recruiters.id))
    .orderBy(slots.startTime);

  // Mode B bookings
  const modeB = await db
    .select({
      id: bookings.id,
      direction: bookings.direction,
      applicantName: bookings.applicantName,
      applicantEmail: bookings.applicantEmail,
      cvLink: bookings.cvLink,
      status: bookings.status,
      createdAt: bookings.createdAt,
      slotStart: applicantSlots.startTime,
      slotEnd: applicantSlots.endTime,
      company: recruiters.company,
      contactEmail: recruiters.contactEmail,
    })
    .from(bookings)
    .innerJoin(applicantSlots, eq(bookings.applicantSlotId, applicantSlots.id))
    .innerJoin(recruiters, eq(bookings.recruiterId, recruiters.id))
    .orderBy(applicantSlots.startTime);

  const all = [...modeA, ...modeB].sort(
    (a, b) =>
      new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime()
  );

  // Build CSV
  const headers = [
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
  ];

  const escape = (v: string) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;

  const rows = all.map((b) => [
    b.id,
    b.direction,
    escape(b.applicantName),
    escape(b.applicantEmail),
    escape(b.company),
    escape(b.contactEmail),
    new Date(b.slotStart).toISOString(),
    new Date(b.slotEnd).toISOString(),
    escape(b.cvLink),
    b.status,
    b.createdAt ? new Date(b.createdAt).toISOString() : "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vgen-bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
