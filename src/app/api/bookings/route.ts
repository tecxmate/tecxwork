import { NextRequest, NextResponse } from "next/server";
import { db, bookings, applicantProfiles, recruiters } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { createBookingSchema, parseJsonBody } from "@/lib/validation";

/**
 * POST — Student applies for an interview (Mode A).
 * Creates a PENDING application. Recruiter must accept to confirm.
 *
 * Body: { recruiterId, startTime (ISO), position, cvLink?, pipaConsent }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "applicant") {
    return NextResponse.json(
      { error: "Only applicants can apply" },
      { status: 403 }
    );
  }

  const parsed = await parseJsonBody(req, createBookingSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (!body.pipaConsent) {
    return NextResponse.json(
      { error: "PIPA consent is required" },
      { status: 400 }
    );
  }

  // Fetch applicant profile
  const [profile] = await db
    .select({
      id: applicantProfiles.id,
      name: applicantProfiles.name,
      email: applicantProfiles.email,
      cvLink: applicantProfiles.cvLink,
    })
    .from(applicantProfiles)
    .where(eq(applicantProfiles.userId, session.userId));

  if (!profile) {
    return NextResponse.json(
      { error: "Applicant profile not found" },
      { status: 404 }
    );
  }

  const requestedTime = new Date(body.startTime);

  // Check: same student + same time + accepted/pending booking = conflict
  const activeConflicts = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.applicantEmail, profile.email),
        eq(bookings.requestedTime, requestedTime),
        inArray(bookings.status, ["pending", "accepted"])
      )
    );

  if (activeConflicts.length > 0) {
    return NextResponse.json(
      {
        error:
          "You already have a pending or confirmed interview at this time.",
      },
      { status: 409 }
    );
  }

  // Check: same student + same recruiter + same position = already applied
  const positionConflict = await db
    .select({ id: bookings.id, status: bookings.status })
    .from(bookings)
    .where(
      and(
        eq(bookings.applicantEmail, profile.email),
        eq(bookings.recruiterId, body.recruiterId),
        eq(bookings.position, body.position)
      )
    );

  const activePosConflicts = positionConflict.filter(
    (b) => b.status === "pending" || b.status === "accepted"
  );

  if (activePosConflicts.length > 0) {
    return NextResponse.json(
      {
        error: `You already applied for "${body.position}" at this company.`,
      },
      { status: 409 }
    );
  }

  // Create pending application — NO slot lock yet
  const [application] = await db
    .insert(bookings)
    .values({
      direction: "applicant_books_recruiter",
      recruiterId: body.recruiterId,
      applicantId: profile.id,
      position: body.position,
      requestedTime,
      applicantName: profile.name,
      applicantEmail: profile.email,
      cvLink: body.cvLink?.trim() || profile.cvLink,
      pipaConsent: true,
      status: "pending",
    })
    .returning();

  return NextResponse.json({
    booking: application,
    message: "Application submitted! The recruiter will review your CV and confirm.",
  });
}
