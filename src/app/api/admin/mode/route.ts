import { NextRequest, NextResponse } from "next/server";
import { db, eventConfig } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { normalizeSalaryCurrencyOptions } from "@/lib/job-posting";

export async function GET() {
  const [config] = await db
    .select({
      mode: eventConfig.mode,
      onboardingMode: eventConfig.onboardingMode,
      jobModerationEnabled: eventConfig.jobModerationEnabled,
      studentCancellationEnabled: eventConfig.studentCancellationEnabled,
      salaryCurrencyOptions: eventConfig.salaryCurrencyOptions,
      locked: eventConfig.modeLocked,
    })
    .from(eventConfig)
    .limit(1);

  return NextResponse.json({
    mode: config?.mode ?? "both",
    onboardingMode: config?.onboardingMode ?? "full",
    jobModerationEnabled: config?.jobModerationEnabled ?? true,
    studentCancellationEnabled: config?.studentCancellationEnabled ?? false,
    salaryCurrencyOptions: normalizeSalaryCurrencyOptions(
      config?.salaryCurrencyOptions
    ),
    locked: config?.locked ?? false,
  });
}

export async function PUT(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    mode,
    onboardingMode,
    jobModerationEnabled,
    studentCancellationEnabled,
    salaryCurrencyOptions,
    lock,
  } = body;

  const [config] = await db
    .select({ id: eventConfig.id, locked: eventConfig.modeLocked })
    .from(eventConfig)
    .limit(1);

  if (!config) {
    return NextResponse.json({ error: "Event config not found" }, { status: 404 });
  }

  // Lock toggle — always allowed by admin
  if (typeof lock === "boolean") {
    await db
      .update(eventConfig)
      .set({ modeLocked: lock })
      .where(eq(eventConfig.id, config.id));
    return NextResponse.json({ locked: lock });
  }

  if (typeof jobModerationEnabled === "boolean") {
    await db
      .update(eventConfig)
      .set({ jobModerationEnabled })
      .where(eq(eventConfig.id, config.id));

    return NextResponse.json({ jobModerationEnabled });
  }

  if (typeof studentCancellationEnabled === "boolean") {
    await db
      .update(eventConfig)
      .set({ studentCancellationEnabled })
      .where(eq(eventConfig.id, config.id));

    return NextResponse.json({ studentCancellationEnabled });
  }

  if (Array.isArray(salaryCurrencyOptions)) {
    const normalized = normalizeSalaryCurrencyOptions(salaryCurrencyOptions);
    await db
      .update(eventConfig)
      .set({ salaryCurrencyOptions: normalized })
      .where(eq(eventConfig.id, config.id));

    return NextResponse.json({ salaryCurrencyOptions: normalized });
  }

  // Mode change — blocked if currently locked
  if (mode) {
    if (config.locked) {
      return NextResponse.json(
        { error: "Event mode is locked. Unlock it first to make changes." },
        { status: 423 }
      );
    }

    if (
      !["applicant_books_recruiter", "recruiter_books_applicant", "both"].includes(mode)
    ) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    await db
      .update(eventConfig)
      .set({ mode })
      .where(eq(eventConfig.id, config.id));
    return NextResponse.json({ mode });
  }

  if (onboardingMode) {
    if (!["minimal", "full"].includes(onboardingMode)) {
      return NextResponse.json({ error: "Invalid onboarding mode" }, { status: 400 });
    }

    await db
      .update(eventConfig)
      .set({ onboardingMode })
      .where(eq(eventConfig.id, config.id));

    return NextResponse.json({ onboardingMode });
  }

  return NextResponse.json({ error: "No changes provided" }, { status: 400 });
}
