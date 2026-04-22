import { NextRequest, NextResponse } from "next/server";
import { db, jobOpenings, recruiters } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { findFlaggedJobLanguage } from "@/lib/job-moderation";

/** GET — list my job openings */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "recruiter") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rec] = await db
    .select({ id: recruiters.id })
    .from(recruiters)
    .where(eq(recruiters.userId, session.userId));

  if (!rec) {
    return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
  }

  const jobs = await db
    .select()
    .from(jobOpenings)
    .where(eq(jobOpenings.recruiterId, rec.id))
    .orderBy(jobOpenings.createdAt);

  return NextResponse.json({ jobs });
}

/** POST — create a job opening */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "recruiter") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rec] = await db
    .select({ id: recruiters.id })
    .from(recruiters)
    .where(eq(recruiters.userId, session.userId));

  if (!rec) {
    return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
  }

  const body = await req.json();
  const { title, jdLink, description } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const flaggedTerm = findFlaggedJobLanguage([title, description, jdLink]);
  if (flaggedTerm) {
    return NextResponse.json(
      {
        error: `Please remove potentially discriminatory or risky wording before saving this job: "${flaggedTerm}"`,
      },
      { status: 400 }
    );
  }

  const [job] = await db
    .insert(jobOpenings)
    .values({
      recruiterId: rec.id,
      title: title.trim(),
      jdLink: jdLink?.trim() || null,
      description: description?.trim() ?? "",
      moderationStatus: "draft",
      moderationNotes: "",
    })
    .returning();

  return NextResponse.json({ job }, { status: 201 });
}
