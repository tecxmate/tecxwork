import { NextRequest, NextResponse } from "next/server";
import { db, users, recruiters } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { email, password, name, company, industry, description, positions, contactEmail, jdLink } = body;

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
