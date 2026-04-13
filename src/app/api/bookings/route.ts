import { NextRequest, NextResponse } from "next/server";
import { db, slots, bookings, applicantProfiles, recruiters, users } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { sendBookingEmails } from "@/lib/email";

/**
 * POST — Applicant books a recruiter at a specific time (Mode A).
 *
 * Body: { recruiterId, startTime (ISO), position, cvLink?, pipaConsent }
 *
 * The system randomly assigns an available interviewer slot at that time.
 * This prevents interviewer selection bias.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "applicant") {
    return NextResponse.json(
      { error: "Only applicants can book recruiter slots" },
      { status: 403 }
    );
  }

  let body: {
    recruiterId: number;
    startTime: string;
    position: string;
    cvLink?: string;
    pipaConsent: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.recruiterId || !body.startTime || !body.position) {
    return NextResponse.json(
      { error: "recruiterId, startTime, and position are required" },
      { status: 400 }
    );
  }

  if (!body.pipaConsent) {
    return NextResponse.json(
      { error: "PIPA consent is required" },
      { status: 400 }
    );
  }

  // Fetch applicant profile from session
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

  // Check: same student + same time (any recruiter) = conflict
  const timeConflict = await db
    .select({ id: bookings.id })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .where(
      and(
        eq(bookings.applicantEmail, profile.email),
        eq(slots.startTime, requestedTime)
      )
    );

  if (timeConflict.length > 0) {
    return NextResponse.json(
      {
        error:
          "You already have an interview at this time. Choose a different slot.",
      },
      { status: 409 }
    );
  }

  // Check: same student + same recruiter + same position = already applied
  const positionConflict = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.applicantEmail, profile.email),
        eq(bookings.recruiterId, body.recruiterId),
        eq(bookings.position, body.position)
      )
    );

  if (positionConflict.length > 0) {
    return NextResponse.json(
      {
        error: `You have already applied for "${body.position}" at this company. Choose a different position.`,
      },
      { status: 409 }
    );
  }

  // Randomly pick one available slot at this time for this recruiter
  // ORDER BY random() LIMIT 1 — server-side randomness, ungameable
  const [randomSlot] = await db
    .select({
      id: slots.id,
      recruiterId: slots.recruiterId,
      startTime: slots.startTime,
      endTime: slots.endTime,
    })
    .from(slots)
    .where(
      and(
        eq(slots.recruiterId, body.recruiterId),
        eq(slots.startTime, requestedTime),
        eq(slots.status, "available")
      )
    )
    .orderBy(sql`random()`)
    .limit(1);

  if (!randomSlot) {
    return NextResponse.json(
      { error: "No available slots at this time. Please choose another." },
      { status: 409 }
    );
  }

  // Atomic lock
  const updated = await db
    .update(slots)
    .set({ status: "booked" })
    .where(and(eq(slots.id, randomSlot.id), eq(slots.status, "available")))
    .returning({ id: slots.id });

  if (!updated.length) {
    return NextResponse.json(
      { error: "Slot was just taken. Please try again." },
      { status: 409 }
    );
  }

  try {
    const [booking] = await db
      .insert(bookings)
      .values({
        direction: "applicant_books_recruiter",
        slotId: randomSlot.id,
        recruiterId: body.recruiterId,
        applicantId: profile.id,
        position: body.position,
        applicantName: profile.name,
        applicantEmail: profile.email,
        cvLink: body.cvLink?.trim() || profile.cvLink,
        pipaConsent: true,
      })
      .returning();

    // Send emails (non-blocking)
    const [rec] = await db
      .select({
        company: recruiters.company,
        contactEmail: recruiters.contactEmail,
        name: users.name,
      })
      .from(recruiters)
      .innerJoin(users, eq(recruiters.userId, users.id))
      .where(eq(recruiters.id, body.recruiterId));

    if (rec) {
      sendBookingEmails({
        applicantName: profile.name,
        applicantEmail: profile.email,
        recruiterName: rec.name,
        recruiterEmail: rec.contactEmail,
        company: rec.company,
        slotStart: randomSlot.startTime,
        slotEnd: randomSlot.endTime,
        cvLink: body.cvLink?.trim() || profile.cvLink,
        direction: "applicant_books_recruiter",
      }).catch(() => {});
    }

    return NextResponse.json({ booking });
  } catch {
    // Roll back
    await db
      .update(slots)
      .set({ status: "available" })
      .where(eq(slots.id, randomSlot.id));

    return NextResponse.json(
      { error: "Failed to create booking. Please try again." },
      { status: 500 }
    );
  }
}
