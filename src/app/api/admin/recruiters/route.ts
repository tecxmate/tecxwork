import { NextRequest, NextResponse } from "next/server";
import { db, users, recruiters, bookings, slots, jobOpenings } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    email,
    password,
    name,
    company,
    industry,
    description,
    positions,
    contactEmail,
    jdLink,
  } = body;

  if (!email || !password || !name || !company || !industry || !contactEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash, role: "recruiter" })
    .returning();

  const [recruiter] = await db
    .insert(recruiters)
    .values({
      userId: user.id,
      company,
      industry,
      description: description ?? "",
      positions: positions ?? [],
      contactEmail,
      jdLink: jdLink ?? null,
    })
    .returning();

  return NextResponse.json({ recruiter }, { status: 201 });
}

/** DELETE ?id=... — Remove recruiter + user + their slots + bookings */
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

  const recruiterId = parseInt(id);

  const [rec] = await db
    .select({ userId: recruiters.userId })
    .from(recruiters)
    .where(eq(recruiters.id, recruiterId));

  if (!rec) {
    return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
  }

  // Cascade delete: bookings → slots → jobOpenings → recruiter → user
  await db.delete(bookings).where(eq(bookings.recruiterId, recruiterId));
  await db.delete(slots).where(eq(slots.recruiterId, recruiterId));
  await db.delete(jobOpenings).where(eq(jobOpenings.recruiterId, recruiterId));
  await db.delete(recruiters).where(eq(recruiters.id, recruiterId));
  await db.delete(users).where(eq(users.id, rec.userId));

  return NextResponse.json({ ok: true });
}
