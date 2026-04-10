import { NextResponse } from "next/server";
import { db, applicantProfiles } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

/** GET /api/me/profile — returns the current applicant's profile */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "applicant") {
    return NextResponse.json(
      { error: "Only applicants have profiles" },
      { status: 403 }
    );
  }

  const [profile] = await db
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
    .where(eq(applicantProfiles.userId, session.userId));

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
