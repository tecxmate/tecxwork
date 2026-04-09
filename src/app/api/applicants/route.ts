import { NextRequest, NextResponse } from "next/server";
import { db, applicantProfiles } from "@/lib/db";

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

// POST — applicant self-registration
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, major, skills, cvLink, description, pipaConsent } = body;

  if (!name || !email || !cvLink) {
    return NextResponse.json(
      { error: "Name, email, and CV link are required" },
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
    const [profile] = await db
      .insert(applicantProfiles)
      .values({
        name,
        email,
        major: major ?? "",
        skills: skills ?? [],
        cvLink,
        description: description ?? "",
        pipaConsent,
      })
      .returning();

    return NextResponse.json({ profile }, { status: 201 });
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
