import { NextRequest, NextResponse } from "next/server";
import {
  db,
  applicantSlots,
  bookings,
  applicantProfiles,
  recruiters,
  users,
} from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { sendBookingEmails } from "@/lib/email";

/**
 * POST — Recruiter books an applicant's slot (Mode B).
 * Requires recruiter session. Uses session recruiter ID, not client input.
 */
export async function POST(req: NextRequest) {
  // Auth: must be recruiter
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "recruiter") {
    return NextResponse.json(
      { error: "Only recruiters can book applicants" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { applicantSlotId } = body;

  if (!applicantSlotId) {
    return NextResponse.json(
      { error: "applicantSlotId is required" },
      { status: 400 }
    );
  }

  // Fetch recruiter record from session (not client)
  const [recruiter] = await db
    .select({ id: recruiters.id })
    .from(recruiters)
    .where(eq(recruiters.userId, session.userId));

  if (!recruiter) {
    return NextResponse.json(
      { error: "Recruiter profile not found" },
      { status: 404 }
    );
  }

  // Fetch slot and its owner (applicant)
  const [slot] = await db
    .select({
      id: applicantSlots.id,
      applicantId: applicantSlots.applicantId,
      startTime: applicantSlots.startTime,
      endTime: applicantSlots.endTime,
    })
    .from(applicantSlots)
    .where(eq(applicantSlots.id, applicantSlotId));

  if (!slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  // Fetch applicant info
  const [applicant] = await db
    .select({
      id: applicantProfiles.id,
      name: applicantProfiles.name,
      email: applicantProfiles.email,
      cvLink: applicantProfiles.cvLink,
    })
    .from(applicantProfiles)
    .where(eq(applicantProfiles.id, slot.applicantId));

  if (!applicant) {
    return NextResponse.json(
      { error: "Applicant not found" },
      { status: 404 }
    );
  }

  // Atomic: only book if slot is still available
  const updated = await db
    .update(applicantSlots)
    .set({ status: "booked" })
    .where(
      and(
        eq(applicantSlots.id, applicantSlotId),
        eq(applicantSlots.status, "available")
      )
    )
    .returning({ id: applicantSlots.id });

  if (!updated.length) {
    return NextResponse.json(
      { error: "This slot is no longer available." },
      { status: 409 }
    );
  }

  try {
    const [booking] = await db
      .insert(bookings)
      .values({
        direction: "recruiter_books_applicant",
        applicantSlotId,
        recruiterId: recruiter.id,
        applicantId: applicant.id,
        applicantName: applicant.name,
        applicantEmail: applicant.email,
        cvLink: applicant.cvLink,
        pipaConsent: true,
      })
      .returning();

    // Fetch recruiter details for email
    const [rec] = await db
      .select({
        company: recruiters.company,
        contactEmail: recruiters.contactEmail,
        name: users.name,
      })
      .from(recruiters)
      .innerJoin(users, eq(recruiters.userId, users.id))
      .where(eq(recruiters.id, recruiter.id));

    if (rec) {
      sendBookingEmails({
        applicantName: applicant.name,
        applicantEmail: applicant.email,
        recruiterName: rec.name,
        recruiterEmail: rec.contactEmail,
        company: rec.company,
        slotStart: slot.startTime,
        slotEnd: slot.endTime,
        cvLink: applicant.cvLink,
        direction: "recruiter_books_applicant",
      }).catch(() => {});
    }

    return NextResponse.json({ booking });
  } catch {
    // Roll back slot on failure
    await db
      .update(applicantSlots)
      .set({ status: "available" })
      .where(eq(applicantSlots.id, applicantSlotId));

    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
