import { NextRequest, NextResponse } from "next/server";
import { db, applicantProfiles, eventConfig, users } from "@/lib/db";
import { hashPassword, createToken, COOKIE_NAME } from "@/lib/auth";
import { MAX_STUDENT_WORK_EXPERIENCES, type StudentWorkExperience } from "@/lib/student-profile";

function sanitizeWorkExperiences(value: unknown): StudentWorkExperience[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, MAX_STUDENT_WORK_EXPERIENCES)
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];

      const record = item as Record<string, unknown>;
      const experience: StudentWorkExperience = {
        company: typeof record.company === "string" ? record.company.trim() : "",
        title: typeof record.title === "string" ? record.title.trim() : "",
        employmentType:
          typeof record.employmentType === "string"
            ? record.employmentType.trim()
            : "",
        startDate: typeof record.startDate === "string" ? record.startDate.trim() : "",
        endDate: typeof record.endDate === "string" ? record.endDate.trim() : "",
        isCurrent: Boolean(record.isCurrent),
        description:
          typeof record.description === "string"
            ? record.description.trim()
            : "",
      };

      if (
        !experience.company &&
        !experience.title &&
        !experience.employmentType &&
        !experience.startDate &&
        !experience.endDate &&
        !experience.description &&
        !experience.isCurrent
      ) {
        return [];
      }

      return [experience];
    });
}

// GET — public listing of applicant profiles (for recruiter browsing)
export async function GET() {
  const result = await db
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
    .orderBy(applicantProfiles.name);

  return NextResponse.json({ applicants: result });
}

// POST — applicant self-signup (creates user + profile, logs in automatically)
export async function POST(req: NextRequest) {
  const body = await req.json();
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

  if (!name || !email || !password || !cvLink) {
    return NextResponse.json(
      { error: "Name, email, password, and CV link are required" },
      { status: 400 }
    );
  }

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

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  if (!pipaConsent) {
    return NextResponse.json(
      { error: "PIPA consent is required" },
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
    const token = createToken({
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
