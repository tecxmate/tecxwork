import { NextRequest, NextResponse } from "next/server";
import { db, applicantProfiles, users, bookings, applicantSlots } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db
    .select({
      id: applicantProfiles.id,
      name: applicantProfiles.name,
      email: applicantProfiles.email,
      major: applicantProfiles.major,
      createdAt: applicantProfiles.createdAt,
    })
    .from(applicantProfiles)
    .orderBy(applicantProfiles.name);

  return NextResponse.json({ applicants: result });
}

/** DELETE ?id=... — Remove an applicant + their user + bookings + slots */
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const applicantId = parseInt(id);

  const [profile] = await db
    .select({ userId: applicantProfiles.userId })
    .from(applicantProfiles)
    .where(eq(applicantProfiles.id, applicantId));

  if (!profile) {
    return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
  }

  // Cascade delete in a single transaction so a partial failure can't
  // leave orphaned rows (e.g. user without profile, slots without applicant).
  await db.transaction(async (tx) => {
    await tx.delete(bookings).where(eq(bookings.applicantId, applicantId));
    await tx.delete(applicantSlots).where(eq(applicantSlots.applicantId, applicantId));
    await tx.delete(applicantProfiles).where(eq(applicantProfiles.id, applicantId));
    if (profile.userId) {
      await tx.delete(users).where(eq(users.id, profile.userId));
    }
  });

  return NextResponse.json({ ok: true });
}
