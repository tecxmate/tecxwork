import { NextRequest, NextResponse } from "next/server";
import { db, eventConfig, jobOpenings } from "@/lib/db";
import { getRecruiterFromSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { findFlaggedJobLanguage } from "@/lib/job-moderation";
import {
  EMPLOYMENT_TYPE_VALUES,
  normalizeSalaryCurrencyOptions,
  SALARY_CURRENCY_VALUES,
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

/** PUT — update a job opening */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getRecruiterFromSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rec = { id: auth.recruiterId };

  const { id } = await params;
  const jobId = parseInt(id);

  const [config] = await db
    .select({
      jobModerationEnabled: eventConfig.jobModerationEnabled,
      salaryCurrencyOptions: eventConfig.salaryCurrencyOptions,
    })
    .from(eventConfig)
    .limit(1);
  const moderationEnabled = config?.jobModerationEnabled ?? true;
  const enabledSalaryCurrencies = normalizeSalaryCurrencyOptions(
    config?.salaryCurrencyOptions
  );

  const body = await req.json();
  const [existing] = await db
    .select()
    .from(jobOpenings)
    .where(and(eq(jobOpenings.id, jobId), eq(jobOpenings.recruiterId, rec.id)));

  if (!existing) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (body.action === "submit") {
    const [submitted] = await db
      .update(jobOpenings)
      .set({
        moderationStatus: moderationEnabled ? "pending_review" : "approved",
        submittedAt: moderationEnabled ? new Date() : null,
        reviewedAt: moderationEnabled ? null : new Date(),
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
    body.location,
    body.requirements,
    body.responsibilities,
    body.benefits,
    body.languageRequirement,
    body.applicationDeadline,
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

  if ("title" in body) {
    const title = toCleanString(body.title);
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    updates.title = title;
  }

  if ("jdLink" in body) {
    const jdLink = toCleanString(body.jdLink);
    updates.jdLink = jdLink || null;
  }

  if ("description" in body) {
    updates.description = toCleanString(body.description);
  }

  if ("location" in body) {
    const location = toCleanString(body.location);
    updates.location = location;
  }

  if ("requirements" in body) {
    updates.requirements = toCleanString(body.requirements);
  }

  if ("responsibilities" in body) {
    updates.responsibilities = toCleanString(body.responsibilities);
  }

  if ("benefits" in body) {
    updates.benefits = toCleanString(body.benefits);
  }

  if ("employmentType" in body) {
    const employmentType = toCleanString(body.employmentType);
    if (!employmentType || !EMPLOYMENT_TYPE_VALUES.has(employmentType)) {
      return NextResponse.json(
        { error: "Valid employment type is required" },
        { status: 400 }
      );
    }
    updates.employmentType = employmentType;
  }

  if ("seniority" in body) {
    const seniority = toCleanString(body.seniority);
    if (seniority && !SENIORITY_VALUES.has(seniority)) {
      return NextResponse.json({ error: "Invalid seniority" }, { status: 400 });
    }
    updates.seniority = seniority;
  }

  if ("languageRequirement" in body) {
    updates.languageRequirement = toCleanString(body.languageRequirement);
  }

  if ("visaSupport" in body) {
    const visaSupport = toCleanString(body.visaSupport);
    if (visaSupport && !VISA_SUPPORT_VALUES.has(visaSupport)) {
      return NextResponse.json(
        { error: "Invalid visa support" },
        { status: 400 }
      );
    }
    updates.visaSupport = visaSupport;
  }

  if ("applicationDeadline" in body) {
    if (body.applicationDeadline === null || body.applicationDeadline === "") {
      updates.applicationDeadline = null;
    } else {
      const applicationDeadline = toNullableDateString(body.applicationDeadline);
      if (!applicationDeadline) {
        return NextResponse.json(
          { error: "Invalid application deadline" },
          { status: 400 }
        );
      }
      updates.applicationDeadline = applicationDeadline;
    }
  }

  if ("workplaceType" in body) {
    const workplaceType = toCleanString(body.workplaceType);
    if (workplaceType && !WORKPLACE_TYPE_VALUES.has(workplaceType)) {
      return NextResponse.json(
        { error: "Invalid workplace type" },
        { status: 400 }
      );
    }
    updates.workplaceType = workplaceType;
  }

  if ("salaryCurrency" in body) {
    const salaryCurrency = toCleanString(body.salaryCurrency).toUpperCase() || "TWD";
    if (
      !SALARY_CURRENCY_VALUES.has(salaryCurrency) ||
      !enabledSalaryCurrencies.includes(salaryCurrency)
    ) {
      return NextResponse.json(
        { error: "Invalid salary currency" },
        { status: 400 }
      );
    }
    updates.salaryCurrency = salaryCurrency;
  }

  if ("salaryPeriod" in body) {
    const salaryPeriod = toCleanString(body.salaryPeriod) || "month";
    if (!SALARY_PERIOD_VALUES.has(salaryPeriod)) {
      return NextResponse.json(
        { error: "Invalid salary period" },
        { status: 400 }
      );
    }
    updates.salaryPeriod = salaryPeriod;
  }

  const salaryMin = "salaryMin" in body ? toNullablePositiveInt(body.salaryMin) : undefined;
  const salaryMax = "salaryMax" in body ? toNullablePositiveInt(body.salaryMax) : undefined;
  const nextSalaryMin =
    salaryMin !== undefined ? salaryMin : (existing.salaryMin ?? null);
  const nextSalaryMax =
    salaryMax !== undefined ? salaryMax : (existing.salaryMax ?? null);
  if (salaryMin !== undefined) {
    updates.salaryMin = salaryMin;
  }
  if (salaryMax !== undefined) {
    updates.salaryMax = salaryMax;
  }
  if (
    (salaryMin !== undefined || salaryMax !== undefined) &&
    nextSalaryMin !== null &&
    nextSalaryMax !== null &&
    nextSalaryMin > nextSalaryMax
  ) {
    return NextResponse.json({ error: "Salary range is invalid" }, { status: 400 });
  }

  if (Object.keys(updates).length > 0) {
    updates.moderationStatus = moderationEnabled ? "draft" : "approved";
    updates.moderationNotes = "";
    updates.submittedAt = null;
    updates.reviewedAt = moderationEnabled ? null : new Date();
  } else {
    return NextResponse.json({ job: existing });
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
  const auth = await getRecruiterFromSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const jobId = parseInt(id);

  await db
    .delete(jobOpenings)
    .where(and(eq(jobOpenings.id, jobId), eq(jobOpenings.recruiterId, auth.recruiterId)));

  return NextResponse.json({ ok: true });
}
