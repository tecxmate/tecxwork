import { NextRequest, NextResponse } from "next/server";
import { db, bookings } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

/** GET /api/bookings/mine?recruiterId=X — student's bookings for a specific recruiter */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "applicant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const recruiterId = url.searchParams.get("recruiterId");

  if (!recruiterId) {
    return NextResponse.json(
      { error: "recruiterId required" },
      { status: 400 }
    );
  }

  const result = await db
    .select({
      id: bookings.id,
      position: bookings.position,
      status: bookings.status,
      requestedTime: bookings.requestedTime,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.applicantEmail, session.email),
        eq(bookings.recruiterId, parseInt(recruiterId))
      )
    );

  return NextResponse.json({ bookings: result });
}
