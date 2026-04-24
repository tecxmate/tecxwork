import { NextRequest, NextResponse } from "next/server";
import { db, eventConfig, jobOpenings, recruiters } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { findFlaggedJobLanguage } from "@/lib/job-moderation";
import {
  EMPLOYMENT_TYPE_VALUES,
  SALARY_PERIOD_VALUES,
  SENIORITY_VALUES,
  VISA_SUPPORT_VALUES,
  WORKPLACE_TYPE_VALUES,
} from "@/lib/job-posting";

function toCleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNullablePositiveInt(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const int = Math.round(parsed);
  return int >= 0 ? int : null;
}

function toNullableDateString(value: unknown) {
  const normalized = toCleanString(value);
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }
  const parsed = new Date(`${normalized}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : normalized;
}

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

  const [config] = await db
    .select({ jobModerationEnabled: eventConfig.jobModerationEnabled })
    .from(eventConfig)
    .limit(1);
  const moderationEnabled = config?.jobModerationEnabled ?? true;

  const body = await req.json();
  const title = toCleanString(body.title);
  const jdLink = toCleanString(body.jdLink);
  const location = toCleanString(body.location);
  const description = toCleanString(body.description);
  const responsibilities = toCleanString(body.responsibilities);
  const requirements = toCleanString(body.requirements);
  const employmentType = toCleanString(body.employmentType);
  const workplaceType = toCleanString(body.workplaceType);
  const salaryCurrency = toCleanString(body.salaryCurrency) || "TWD";
  const salaryPeriod = toCleanString(body.salaryPeriod) || "month";
  const seniority = toCleanString(body.seniority);
  const languageRequirement = toCleanString(body.languageRequirement);
  const visaSupport = toCleanString(body.visaSupport);
  const applicationDeadline = toNullableDateString(body.applicationDeadline);
  const salaryMin = toNullablePositiveInt(body.salaryMin);
  const salaryMax = toNullablePositiveInt(body.salaryMax);

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!location) {
    return NextResponse.json({ error: "Location is required" }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json(
      { error: "Description is required" },
      { status: 400 }
    );
  }
  if (!employmentType || !EMPLOYMENT_TYPE_VALUES.has(employmentType)) {
    return NextResponse.json(
      { error: "Valid employment type is required" },
      { status: 400 }
    );
  }
  if (workplaceType && !WORKPLACE_TYPE_VALUES.has(workplaceType)) {
    return NextResponse.json(
      { error: "Invalid workplace type" },
      { status: 400 }
    );
  }
  if (!SALARY_PERIOD_VALUES.has(salaryPeriod)) {
    return NextResponse.json(
      { error: "Invalid salary period" },
      { status: 400 }
    );
  }
  if (seniority && !SENIORITY_VALUES.has(seniority)) {
    return NextResponse.json({ error: "Invalid seniority" }, { status: 400 });
  }
  if (visaSupport && !VISA_SUPPORT_VALUES.has(visaSupport)) {
    return NextResponse.json({ error: "Invalid visa support" }, { status: 400 });
  }
  if (body.applicationDeadline && !applicationDeadline) {
    return NextResponse.json(
      { error: "Invalid application deadline" },
      { status: 400 }
    );
  }
  if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
    return NextResponse.json(
      { error: "Salary range is invalid" },
      { status: 400 }
    );
  }

  const flaggedTerm = findFlaggedJobLanguage([
    title,
    description,
    jdLink,
    responsibilities,
    requirements,
    location,
    seniority,
    languageRequirement,
    visaSupport,
    applicationDeadline ?? "",
  ]);
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
      title,
      jdLink: jdLink || null,
      location,
      employmentType,
      workplaceType,
      salaryMin,
      salaryMax,
      salaryCurrency: salaryCurrency.toUpperCase().slice(0, 8),
      salaryPeriod,
      seniority,
      languageRequirement,
      visaSupport,
      applicationDeadline,
      description,
      responsibilities,
      requirements,
      moderationStatus: moderationEnabled ? "draft" : "approved",
      moderationNotes: "",
      submittedAt: null,
      reviewedAt: moderationEnabled ? null : new Date(),
    })
    .returning();

  return NextResponse.json({ job }, { status: 201 });
}
