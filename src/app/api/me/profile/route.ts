import { NextRequest, NextResponse } from "next/server";
import { db, applicantProfiles } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

/** GET /api/me/profile — returns the current applicant's profile */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "applicant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

/** PUT /api/me/profile — update applicant profile */
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "applicant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, major, skills, cvLink, description } = body;

  const updates: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) updates.name = name.trim();
  if (typeof major === "string") updates.major = major.trim();
  if (Array.isArray(skills)) updates.skills = skills;
  if (typeof cvLink === "string" && cvLink.trim()) updates.cvLink = cvLink.trim();
  if (typeof description === "string") updates.description = description.trim();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(applicantProfiles)
    .set(updates)
    .where(eq(applicantProfiles.userId, session.userId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile: updated });
}
