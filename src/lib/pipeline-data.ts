import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  applications,
  applicantProfiles,
  jobOpenings,
  recruiters,
} from "@/lib/db/schema";
import { getRecruiterFromSession } from "@/lib/auth";
import type { PipelineBoard, PipelineCard, PipelineStage } from "@/lib/pipeline-types";

export type { PipelineBoard, PipelineCard, PipelineJob, PipelineStage } from "@/lib/pipeline-types";
export { PIPELINE_STAGES } from "@/lib/pipeline-types";

/**
 * Resolve the recruiter whose board to show: the logged-in recruiter if there
 * is a session, otherwise the demo recruiter (the single seeded Yang Luck row).
 * Demo-mode fallback keeps the pitch URL clickable with no login.
 */
async function resolveRecruiter() {
  const db = getDb();
  const fromSession = await getRecruiterFromSession();
  if (fromSession) {
    const [r] = await db
      .select({ id: recruiters.id, company: recruiters.company })
      .from(recruiters)
      .where(eq(recruiters.id, fromSession.recruiterId))
      .limit(1);
    if (r) return r;
  }
  const [demo] = await db
    .select({ id: recruiters.id, company: recruiters.company })
    .from(recruiters)
    .limit(1);
  return demo ?? null;
}

export async function getPipelineBoard(): Promise<PipelineBoard | null> {
  const recruiter = await resolveRecruiter();
  if (!recruiter) return null;

  const db = getDb();
  const [jobs, rows] = await Promise.all([
    db
      .select({
        id: jobOpenings.id,
        title: jobOpenings.title,
        jobCategory: jobOpenings.jobCategory,
        location: jobOpenings.location,
      })
      .from(jobOpenings)
      .where(eq(jobOpenings.recruiterId, recruiter.id)),
    db
      .select({
        id: applications.id,
        jobOpeningId: applications.jobOpeningId,
        stage: applications.stage,
        aiScore: applications.aiScore,
        notes: applications.notes,
        name: applicantProfiles.name,
        nationality: applicantProfiles.nationality,
        schoolName: applicantProfiles.schoolName,
        schoolNameEn: applicantProfiles.schoolNameEn,
        major: applicantProfiles.major,
        studyLevel: applicantProfiles.studyLevel,
        skills: applicantProfiles.skills,
        cvLink: applicantProfiles.cvLink,
        description: applicantProfiles.description,
      })
      .from(applications)
      .innerJoin(
        applicantProfiles,
        eq(applications.applicantId, applicantProfiles.id)
      )
      .where(eq(applications.recruiterId, recruiter.id)),
  ]);

  const cards: PipelineCard[] = rows.map((r) => ({
    id: r.id,
    jobOpeningId: r.jobOpeningId,
    stage: r.stage as PipelineStage,
    aiScore: r.aiScore,
    notes: r.notes,
    applicant: {
      name: r.name,
      nationality: r.nationality,
      schoolName: r.schoolName,
      schoolNameEn: r.schoolNameEn,
      major: r.major,
      studyLevel: r.studyLevel,
      skills: r.skills,
      cvLink: r.cvLink,
      description: r.description,
    },
  }));

  return { recruiter, jobs, cards };
}
