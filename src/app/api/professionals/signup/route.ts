import { NextRequest, NextResponse } from "next/server";
import { db, users, professionalProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { COOKIE_NAME } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function POST(req: NextRequest) {
  let body: {
    email: string;
    password: string;
    name: string;
    company: string;
    jobTitle: string;
    industry: string;
    linkedinUrl?: string;
    bio?: string;
    graduatedFrom?: string;
    graduationYear?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password, name, company, jobTitle, industry } = body;

  if (!email || !password || !name || !company || !jobTitle || !industry) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      name,
      passwordHash,
      role: "professional",
    })
    .returning();

  const [profile] = await db
    .insert(professionalProfiles)
    .values({
      userId: newUser.id,
      name,
      email: normalizedEmail,
      company,
      jobTitle,
      industry,
      linkedinUrl: body.linkedinUrl || null,
      bio: body.bio || "",
      graduatedFrom: body.graduatedFrom || null,
      graduationYear: body.graduationYear || null,
    })
    .returning();

  const token = sign(
    { userId: newUser.id, role: newUser.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  const res = NextResponse.json({
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    },
    profile,
  });

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return res;
}
