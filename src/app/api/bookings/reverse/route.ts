import { NextRequest, NextResponse } from "next/server";
import { db, applicantSlots, bookings, applicantProfiles } from "@/lib/db";
import { eq, and } from "drizzle-orm";

/** POST — Recruiter books an applicant's slot (Mode B) */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { applicantSlotId, recruiterId, applicantId } = body;

  if (!applicantSlotId || !recruiterId || !applicantId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Get applicant info
  const [applicant] = await db
    .select({
      name: applicantProfiles.name,
      email: applicantProfiles.email,
      cvLink: applicantProfiles.cvLink,
    })
    .from(applicantProfiles)
    .where(eq(applicantProfiles.id, applicantId));

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
        recruiterId,
        applicantId,
        applicantName: applicant.name,
        applicantEmail: applicant.email,
        cvLink: applicant.cvLink,
        pipaConsent: true,
      })
      .returning();

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
