import { NextRequest, NextResponse } from "next/server";
import {
  db,
  users,
  recruiters,
  bookings,
  slots,
  jobOpenings,
  recruiterEmailApprovals,
} from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { ensureDefaultRecruiterSlots } from "@/lib/recruiter-onboarding";

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
    contactEmail,
  } = body;

  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail || !company) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!password) {
    try {
      const [approval] = await db
        .insert(recruiterEmailApprovals)
        .values({
          email: normalizedEmail,
          company,
          industry: industry ?? "Technology",
          status: "approved",
        })
        .returning();

      return NextResponse.json({ approval }, { status: 201 });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("unique")) {
        return NextResponse.json(
          { error: "This recruiter email is already approved" },
          { status: 409 }
        );
      }
      throw err;
    }
  }

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ email: normalizedEmail, name, passwordHash, role: "recruiter" })
    .returning();

  const [recruiter] = await db
    .insert(recruiters)
    .values({
      userId: user.id,
      company,
      industry: industry ?? "",
      description: description ?? "",
      contactEmail: contactEmail ?? normalizedEmail,
    })
    .returning();

  await ensureDefaultRecruiterSlots(recruiter.id);

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

  // Cascade delete in a single transaction so a partial failure can't leave
  // orphaned rows (e.g. recruiter row gone but jobs/bookings still reference it).
  await db.transaction(async (tx) => {
    await tx.delete(bookings).where(eq(bookings.recruiterId, recruiterId));
    await tx.delete(slots).where(eq(slots.recruiterId, recruiterId));
    await tx.delete(jobOpenings).where(eq(jobOpenings.recruiterId, recruiterId));
    await tx.delete(recruiters).where(eq(recruiters.id, recruiterId));
    await tx.delete(users).where(eq(users.id, rec.userId));
  });

  return NextResponse.json({ ok: true });
}
