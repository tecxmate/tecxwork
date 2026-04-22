import { NextRequest, NextResponse } from "next/server";
import { db, jobOpenings, recruiters } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { findFlaggedJobLanguage } from "@/lib/job-moderation";

/** PUT — update a job opening */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "recruiter") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const jobId = parseInt(id);

  const [rec] = await db
    .select({ id: recruiters.id })
    .from(recruiters)
    .where(eq(recruiters.userId, session.userId));

  if (!rec) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  if (body.action === "submit") {
    const [submitted] = await db
      .update(jobOpenings)
      .set({
        moderationStatus: "pending_review",
        submittedAt: new Date(),
        moderationNotes: "",
      })
      .where(and(eq(jobOpenings.id, jobId), eq(jobOpenings.recruiterId, rec.id)))
      .returning();

    if (!submitted) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job: submitted });
  }

  const flaggedTerm = findFlaggedJobLanguage([
    body.title,
    body.description,
    body.jdLink,
  ]);
  if (flaggedTerm) {
    return NextResponse.json(
      {
        error: `Please remove potentially discriminatory or risky wording before saving this job: "${flaggedTerm}"`,
      },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
  if (typeof body.jdLink === "string") updates.jdLink = body.jdLink.trim() || null;
  if (typeof body.description === "string") updates.description = body.description.trim();
  if (Object.keys(updates).length > 0) {
    updates.moderationStatus = "draft";
    updates.moderationNotes = "";
    updates.submittedAt = null;
    updates.reviewedAt = null;
  }

  const [updated] = await db
    .update(jobOpenings)
    .set(updates)
    .where(and(eq(jobOpenings.id, jobId), eq(jobOpenings.recruiterId, rec.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ job: updated });
}

/** DELETE — remove a job opening */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "recruiter") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const jobId = parseInt(id);

  const [rec] = await db
    .select({ id: recruiters.id })
    .from(recruiters)
    .where(eq(recruiters.userId, session.userId));

  if (!rec) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .delete(jobOpenings)
    .where(and(eq(jobOpenings.id, jobId), eq(jobOpenings.recruiterId, rec.id)));

  return NextResponse.json({ ok: true });
}
