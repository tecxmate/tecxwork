import { NextRequest, NextResponse } from "next/server";
import { db, applicantProfiles, users } from "@/lib/db";
import { hashPassword, createToken, COOKIE_NAME } from "@/lib/auth";

// GET — public listing of applicant profiles (for recruiter browsing)
export async function GET() {
  const result = await db
    .select({
      id: applicantProfiles.id,
      name: applicantProfiles.name,
      email: applicantProfiles.email,
      major: applicantProfiles.major,
      skills: applicantProfiles.skills,
      cvLink: applicantProfiles.cvLink,
      description: applicantProfiles.description,
    })
    .from(applicantProfiles)
    .orderBy(applicantProfiles.name);

  return NextResponse.json({ applicants: result });
}

// POST — applicant self-signup (creates user + profile, logs in automatically)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name,
    email,
    password,
    major,
    skills,
    cvLink,
    description,
    pipaConsent,
  } = body;

  if (!name || !email || !password || !cvLink) {
    return NextResponse.json(
      { error: "Name, email, password, and CV link are required" },
      { status: 400 }
    );
  }

  if (!pipaConsent) {
    return NextResponse.json(
      { error: "PIPA consent is required" },
      { status: 400 }
    );
  }

  try {
    // Create user account
    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({ email, name, passwordHash, role: "applicant" })
      .returning();

    // Create applicant profile
    const [profile] = await db
      .insert(applicantProfiles)
      .values({
        userId: user.id,
        name,
        email,
        major: major ?? "",
        skills: skills ?? [],
        cvLink,
        description: description ?? "",
        pipaConsent,
      })
      .returning();

    // Auto-login
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: "applicant",
    });

    const res = NextResponse.json({ profile }, { status: 201 });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return res;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
}
