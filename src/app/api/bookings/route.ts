import { NextRequest, NextResponse } from "next/server";
import { db, slots, bookings, applicantProfiles } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

/**
 * POST — Applicant books a recruiter's slot (Mode A).
 * Requires applicant session. Uses profile data from DB, not client input.
 */
export async function POST(req: NextRequest) {
  // Auth: must be applicant
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

  let body: { slotId: number; pipaConsent: boolean; cvLink?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.slotId) {
    return NextResponse.json({ error: "slotId is required" }, { status: 400 });
  }

  if (!body.pipaConsent) {
    return NextResponse.json(
      { error: "PIPA consent is required" },
      { status: 400 }
    );
  }

  // Fetch the applicant profile from session (trust DB, not client)
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

  // Validate slot exists and get its true recruiterId (don't trust client)
  const [slot] = await db
    .select({ id: slots.id, recruiterId: slots.recruiterId, status: slots.status })
    .from(slots)
    .where(eq(slots.id, body.slotId));

  if (!slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  // Atomic: only update if slot is still available
  const updated = await db
    .update(slots)
    .set({ status: "booked" })
    .where(and(eq(slots.id, body.slotId), eq(slots.status, "available")))
    .returning({ id: slots.id });

  if (!updated.length) {
    return NextResponse.json(
      { error: "This slot is no longer available. Please choose another time." },
      { status: 409 }
    );
  }

  try {
    const [booking] = await db
      .insert(bookings)
      .values({
        direction: "applicant_books_recruiter",
        slotId: body.slotId,
        recruiterId: slot.recruiterId,
        applicantId: profile.id,
        applicantName: profile.name,
        applicantEmail: profile.email,
        cvLink: body.cvLink?.trim() || profile.cvLink,
        pipaConsent: true,
      })
      .returning();

    return NextResponse.json({ booking });
  } catch {
    // Roll back slot status if booking insert fails
    await db
      .update(slots)
      .set({ status: "available" })
      .where(eq(slots.id, body.slotId));

    return NextResponse.json(
      { error: "Failed to create booking. Please try again." },
      { status: 500 }
    );
  }
}
