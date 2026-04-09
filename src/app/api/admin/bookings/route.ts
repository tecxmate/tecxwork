import { NextRequest, NextResponse } from "next/server";
import { db, bookings, slots, recruiters } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
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
      createdAt: bookings.createdAt,
      slotStart: slots.startTime,
      slotEnd: slots.endTime,
      company: recruiters.company,
    })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(recruiters, eq(bookings.recruiterId, recruiters.id))
    .orderBy(slots.startTime)
    .$dynamic();

  if (recruiterId) {
    query = query.where(eq(bookings.recruiterId, parseInt(recruiterId)));
  }

  const result = await query;
  return NextResponse.json({ bookings: result });
}
