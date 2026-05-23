import { NextRequest, NextResponse } from "next/server";
import { db, users, professionalProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { COOKIE_NAME, createToken, hashPassword } from "@/lib/auth";
import { parseJsonBody, professionalSignupSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, professionalSignupSchema);
  if (!parsed.ok) return parsed.response;
  const {
    email: normalizedEmail,
    password,
    name,
    company,
    jobTitle,
    industry,
    linkedinUrl,
    bio,
    graduatedFrom,
    graduationYear,
  } = parsed.data;

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

  const passwordHash = await hashPassword(password);

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
      linkedinUrl: linkedinUrl || null,
      bio: bio || "",
      graduatedFrom: graduatedFrom || null,
      graduationYear: graduationYear || null,
    })
    .returning();

  const token = createToken({
    userId: newUser.id,
    email: newUser.email,
    role: "professional",
  });

  const res = NextResponse.json({
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    },
    profile,
  }, { status: 201 });

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return res;
}
