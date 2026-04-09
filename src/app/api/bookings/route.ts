import { NextRequest, NextResponse } from "next/server";
import { db, slots, bookings } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  let body: {
    slotId: number;
    recruiterId: number;
    name: string;
    email: string;
    cvLink: string;
    pipaConsent: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.slotId || !body.recruiterId || !body.name || !body.email || !body.cvLink) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!body.pipaConsent) {
    return NextResponse.json({ error: "PIPA consent is required" }, { status: 400 });
  }

  // Atomic: only update if slot is still available (prevents double-booking)
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
        slotId: body.slotId,
        recruiterId: body.recruiterId,
        applicantName: body.name,
        applicantEmail: body.email,
        cvLink: body.cvLink,
        pipaConsent: body.pipaConsent,
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
