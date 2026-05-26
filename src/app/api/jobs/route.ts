import { NextRequest, NextResponse } from "next/server";
import { db, jobOpenings } from "@/lib/db";
import { and, eq } from "drizzle-orm";

/** GET /api/jobs?recruiterId=X — public listing of job openings */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const recruiterId = url.searchParams.get("recruiterId");

  if (!recruiterId) {
    return NextResponse.json({ error: "recruiterId required" }, { status: 400 });
  }

  const jobs = await db
    .select({
      id: jobOpenings.id,
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
    })
    .from(jobOpenings)
    .where(
      and(
        eq(jobOpenings.recruiterId, parseInt(recruiterId)),
        eq(jobOpenings.moderationStatus, "approved")
      )
    )
    .orderBy(jobOpenings.createdAt);

  return NextResponse.json({ jobs });
}
