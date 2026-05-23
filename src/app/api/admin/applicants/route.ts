import { NextRequest, NextResponse } from "next/server";
import { db, applicantProfiles, users, bookings, applicantSlots } from "@/lib/db";
import {
  getAdminSession,
  hashPassword,
  isPasswordValid,
  PASSWORD_REQUIREMENT_MESSAGE,
} from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  if (!(await getAdminSession())) {
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

/** POST — Admin manually creates an applicant account (bypasses email verification). */
export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { email, name, password } =
    (body as { email?: unknown; name?: unknown; password?: unknown }) ?? {};

  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedName = typeof name === "string" ? name.trim() : "";

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!normalizedName) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!isPasswordValid(password)) {
    return NextResponse.json(
      { error: PASSWORD_REQUIREMENT_MESSAGE },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const profile = await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        email: normalizedEmail,
        name: normalizedName,
        passwordHash,
        role: "applicant",
      })
      .returning();
    const [created] = await tx
      .insert(applicantProfiles)
      .values({
        userId: user.id,
        name: normalizedName,
        email: normalizedEmail,
        cvLink: "",
        pipaConsent: true,
      })
      .returning({
        id: applicantProfiles.id,
        name: applicantProfiles.name,
        email: applicantProfiles.email,
        major: applicantProfiles.major,
        createdAt: applicantProfiles.createdAt,
      });
    return created;
  });

  return NextResponse.json({ applicant: profile }, { status: 201 });
}

/** DELETE ?id=... — Remove an applicant + their user + bookings + slots */
export async function DELETE(req: NextRequest) {
  if (!(await getAdminSession())) {
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
