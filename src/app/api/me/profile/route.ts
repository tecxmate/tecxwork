import { NextRequest, NextResponse } from "next/server";
import { db, applicantProfiles } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import {
  MAX_STUDENT_CERTIFICATIONS,
  MAX_STUDENT_WORK_EXPERIENCES,
  type StudentCertification,
  type StudentWorkExperience,
} from "@/lib/student-profile";

function sanitizeCertifications(value: unknown): StudentCertification[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, MAX_STUDENT_CERTIFICATIONS)
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];

      const record = item as Record<string, unknown>;
      const cert: StudentCertification = {
        type: typeof record.type === "string" ? record.type.trim() : "language",
        name: typeof record.name === "string" ? record.name.trim() : "",
        score: typeof record.score === "string" ? record.score.trim() : "",
        issueDate: typeof record.issueDate === "string" ? record.issueDate.trim() : "",
      };

      if (!cert.name && !cert.score && !cert.issueDate) {
        return [];
      }

      return [cert];
    });
}

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
      phone: applicantProfiles.phone,
      nationality: applicantProfiles.nationality,
      schoolCode: applicantProfiles.schoolCode,
      schoolName: applicantProfiles.schoolName,
      schoolNameEn: applicantProfiles.schoolNameEn,
      major: applicantProfiles.major,
      studyLevel: applicantProfiles.studyLevel,
      studyYear: applicantProfiles.studyYear,
      expectedGraduation: applicantProfiles.expectedGraduation,
      jobSeekingStatus: applicantProfiles.jobSeekingStatus,
      workAuthorization: applicantProfiles.workAuthorization,
      skills: applicantProfiles.skills,
      preferredLocations: applicantProfiles.preferredLocations,
      preferredIndustries: applicantProfiles.preferredIndustries,
      workExperiences: applicantProfiles.workExperiences,
      certifications: applicantProfiles.certifications,
      cvLink: applicantProfiles.cvLink,
      linkedinUrl: applicantProfiles.linkedinUrl,
      portfolioUrl: applicantProfiles.portfolioUrl,
      avatarUrl: applicantProfiles.avatarUrl,
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
  const {
    name,
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
    certifications,
    cvLink,
    linkedinUrl,
    portfolioUrl,
    avatarUrl,
    description,
  } = body;

  const updates: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) updates.name = name.trim();
  if (typeof phone === "string") updates.phone = phone.trim();
  if (typeof nationality === "string") updates.nationality = nationality.trim();
  if (typeof schoolCode === "string") updates.schoolCode = schoolCode.trim();
  if (typeof schoolName === "string") updates.schoolName = schoolName.trim();
  if (typeof schoolNameEn === "string") updates.schoolNameEn = schoolNameEn.trim();
  if (typeof major === "string") updates.major = major.trim();
  if (typeof studyLevel === "string") updates.studyLevel = studyLevel.trim();
  if (typeof studyYear === "string") updates.studyYear = studyYear.trim();
  if (typeof expectedGraduation === "string") updates.expectedGraduation = expectedGraduation.trim();
  if (typeof jobSeekingStatus === "string") updates.jobSeekingStatus = jobSeekingStatus.trim();
  if (typeof workAuthorization === "string") updates.workAuthorization = workAuthorization.trim();
  if (Array.isArray(skills)) updates.skills = skills;
  if (Array.isArray(preferredLocations)) updates.preferredLocations = preferredLocations;
  if (Array.isArray(preferredIndustries)) updates.preferredIndustries = preferredIndustries;
  if (Array.isArray(workExperiences)) {
    updates.workExperiences = sanitizeWorkExperiences(workExperiences);
  }
  if (Array.isArray(certifications)) {
    updates.certifications = sanitizeCertifications(certifications);
  }
  if (typeof cvLink === "string" && cvLink.trim()) updates.cvLink = cvLink.trim();
  if (typeof linkedinUrl === "string") updates.linkedinUrl = linkedinUrl.trim();
  if (typeof portfolioUrl === "string") updates.portfolioUrl = portfolioUrl.trim();
  if (typeof avatarUrl === "string" || avatarUrl === null) updates.avatarUrl = avatarUrl;
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
