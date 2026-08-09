import { NextRequest, NextResponse } from "next/server";
import { db, applicantProfiles, eventConfig, users, emailVerificationCodes } from "@/lib/db";
import { COOKIE_NAME, createSession, getSession, hashPassword } from "@/lib/auth";
import { sanitizeWorkExperiences } from "@/lib/student-profile";
import { asc, count, desc, ilike, or, sql, eq, and, gte } from "drizzle-orm";
import { applicantSignupSchema, parseJsonBody } from "@/lib/validation";

// GET — applicant profile listing for recruiter/admin review.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "recruiter" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("query")?.trim() ?? "";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(
    24,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "12") || 12)
  );
  const offset = (page - 1) * limit;

  const where = query
    ? or(
        ilike(applicantProfiles.name, `%${query}%`),
        ilike(applicantProfiles.major, `%${query}%`),
        sql`EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(${applicantProfiles.skills}) AS skill
          WHERE skill ILIKE ${`%${query}%`}
        )`
      )
    : undefined;

  const [result, totalResult] = await Promise.all([
    db
      .select({
        id: applicantProfiles.id,
        name: applicantProfiles.name,
        email: applicantProfiles.email,
        phone: applicantProfiles.phone,
        nationality: applicantProfiles.nationality,
        schoolName: applicantProfiles.schoolName,
        schoolNameEn: applicantProfiles.schoolNameEn,
        major: applicantProfiles.major,
        studyLevel: applicantProfiles.studyLevel,
        studyYear: applicantProfiles.studyYear,
        expectedGraduation: applicantProfiles.expectedGraduation,
        skills: applicantProfiles.skills,
        preferredLocations: applicantProfiles.preferredLocations,
        preferredIndustries: applicantProfiles.preferredIndustries,
        workExperiences: applicantProfiles.workExperiences,
        workAuthorization: applicantProfiles.workAuthorization,
        cvLink: applicantProfiles.cvLink,
        linkedinUrl: applicantProfiles.linkedinUrl,
        portfolioUrl: applicantProfiles.portfolioUrl,
        description: applicantProfiles.description,
      })
      .from(applicantProfiles)
      .where(where)
      .orderBy(asc(applicantProfiles.name), desc(applicantProfiles.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(applicantProfiles)
      .where(where),
  ]);
  const total = totalResult[0]?.total ?? 0;

  return NextResponse.json({
    applicants: result,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

// POST — applicant self-signup (creates user + profile, logs in automatically)
export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, applicantSignupSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const {
    name,
    email,
    password,
    phone,
    nationality,
    schoolCode,
    schoolName,
    schoolNameEn,
    major,
    studyLevel,
    studyYear,
    expectedGraduation,
    jobSeekingStatus,
    workAuthorization,
    skills,
    preferredLocations,
    preferredIndustries,
    workExperiences,
    cvLink,
    linkedinUrl,
    portfolioUrl,
    description,
    pipaConsent,
    wantsNewsletter,
  } = body;

  const [config] = await db
    .select({ onboardingMode: eventConfig.onboardingMode })
    .from(eventConfig)
    .limit(1);
  const onboardingMode = config?.onboardingMode === "minimal" ? "minimal" : "full";

  if (
    onboardingMode === "full" &&
    (!schoolName || !major || !studyLevel || !expectedGraduation)
  ) {
    return NextResponse.json(
      {
        error:
          "School, major, study level, graduation date, and CV link are required in full onboarding mode",
      },
      { status: 400 }
    );
  }

  if (!pipaConsent) {
    return NextResponse.json(
      { error: "PIPA consent is required" },
      { status: 400 }
    );
  }

  // Check email was verified
  const [verifiedRecord] = await db
    .select({ id: emailVerificationCodes.id })
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.email, email),
        eq(emailVerificationCodes.verified, true),
        gte(emailVerificationCodes.expiresAt, new Date(Date.now() - 30 * 60 * 1000)) // Allow 30 min after verification
      )
    )
    .limit(1);

  if (!verifiedRecord) {
    return NextResponse.json(
      { error: "Email not verified. Please verify your email first." },
      { status: 400 }
    );
  }

  const normalizedWorkExperiences = sanitizeWorkExperiences(workExperiences);

  try {
    // Create user account
    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({ email, name, passwordHash, role: "applicant" })
      .returning();

    // Create applicant profile
    const [profile] = await db
      .insert(applicantProfiles)
      .values({
        userId: user.id,
        name,
        email,
        phone: phone ?? "",
        nationality: nationality ?? "",
        schoolCode: schoolCode ?? "",
        schoolName,
        schoolNameEn: schoolNameEn ?? "",
        major: major ?? "",
        studyLevel: studyLevel ?? "",
        studyYear: studyYear ?? "",
        expectedGraduation: expectedGraduation ?? "",
        jobSeekingStatus: jobSeekingStatus ?? "",
        workAuthorization: workAuthorization ?? "",
        skills: skills ?? [],
        preferredLocations: preferredLocations ?? [],
        preferredIndustries: preferredIndustries ?? [],
        workExperiences: normalizedWorkExperiences,
        cvLink,
        linkedinUrl: linkedinUrl ?? "",
        portfolioUrl: portfolioUrl ?? "",
        description: description ?? "",
        pipaConsent,
        wantsNewsletter: !!wantsNewsletter,
      })
      .returning();

    // Auto-login
    const token = await createSession({
      userId: user.id,
      email: user.email,
      role: "applicant",
    });

    const res = NextResponse.json({ profile }, { status: 201 });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return res;
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
