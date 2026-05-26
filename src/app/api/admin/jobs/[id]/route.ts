import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getAdminSession } from "@/lib/auth";
import { db, jobOpenings, recruiters } from "@/lib/db";
import { JOB_CATEGORY_VALUES } from "@/lib/job-posting";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const jobId = parseInt(id, 10);
  if (Number.isNaN(jobId)) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  const body = await req.json();
  const action = body.action;
  const moderationNotes =
    typeof body.moderationNotes === "string" ? body.moderationNotes.trim() : "";
  const hasAction = action !== undefined;

  if (hasAction && !["approve", "reject", "reset"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updates: Partial<typeof jobOpenings.$inferInsert> = {};
  if ("jobCategory" in body) {
    const jobCategory =
      typeof body.jobCategory === "string" ? body.jobCategory.trim() : "";
    if (jobCategory && !JOB_CATEGORY_VALUES.has(jobCategory)) {
      return NextResponse.json({ error: "Invalid job category" }, { status: 400 });
    }
    updates.jobCategory = jobCategory;
  }

  if (hasAction) {
    updates.moderationStatus =
      action === "approve"
        ? "approved"
        : action === "reject"
          ? "rejected"
          : "draft";
    updates.moderationNotes = moderationNotes;
    updates.reviewedAt = new Date();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No job updates provided" }, { status: 400 });
  }

  const [job] = await db
    .select({ id: jobOpenings.id })
    .from(jobOpenings)
    .where(eq(jobOpenings.id, jobId))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  await db
    .update(jobOpenings)
    .set(updates)
    .where(eq(jobOpenings.id, jobId));

  const [updated] = await db
    .select({
      id: jobOpenings.id,
      recruiterId: recruiters.id,
      company: recruiters.company,
      title: jobOpenings.title,
      jobCategory: jobOpenings.jobCategory,
      jdLink: jobOpenings.jdLink,
      location: jobOpenings.location,
      employmentType: jobOpenings.employmentType,
      workplaceType: jobOpenings.workplaceType,
      salaryMin: jobOpenings.salaryMin,
      salaryMax: jobOpenings.salaryMax,
      salaryCurrency: jobOpenings.salaryCurrency,
      salaryPeriod: jobOpenings.salaryPeriod,
      seniority: jobOpenings.seniority,
      languageRequirement: jobOpenings.languageRequirement,
      visaSupport: jobOpenings.visaSupport,
      applicationDeadline: jobOpenings.applicationDeadline,
      description: jobOpenings.description,
      responsibilities: jobOpenings.responsibilities,
      requirements: jobOpenings.requirements,
      benefits: jobOpenings.benefits,
      moderationStatus: jobOpenings.moderationStatus,
      moderationNotes: jobOpenings.moderationNotes,
      submittedAt: jobOpenings.submittedAt,
      reviewedAt: jobOpenings.reviewedAt,
      createdAt: jobOpenings.createdAt,
    })
    .from(jobOpenings)
    .innerJoin(recruiters, eq(jobOpenings.recruiterId, recruiters.id))
    .where(eq(jobOpenings.id, jobId))
    .limit(1);

  return NextResponse.json({ job: updated });
}
