import { eq, ne, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getRecruiterFromSession } from "@/lib/auth";
import {
  applications,
  applicantProfiles,
  jobOpenings,
  recruiters,
} from "@/lib/db/schema";

export type {
  PipelineBoard,
  PipelineCard,
  PipelineJob,
  PipelineStage,
} from "@/lib/pipeline-types";
export { PIPELINE_STAGES } from "@/lib/pipeline-types";

import type { PipelineBoard, PipelineCard } from "@/lib/pipeline-types";

/**
 * Recruiter pipeline board, scoped to the logged-in recruiter.
 *
 * - A normal recruiter (client / subsidiary) sees ONLY their own jobs and the
 *   applications to them.
 * - An "agency" recruiter (clientKind "agency", e.g. Yang Luck HQ) keeps the
 *   cross-client placement super-view: every client company's jobs + all
 *   applications, grouped client-side by company. This is the real agency
 *   model, not a demo shortcut.
 *
 * Returns null when there is no recruiter session or the recruiter has no jobs.
 */
export async function getPipelineBoard(): Promise<PipelineBoard | null> {
  const auth = await getRecruiterFromSession();
  if (!auth) return null;

  const db = getDb();
  const [me] = await db
    .select({
      id: recruiters.id,
      company: recruiters.company,
      clientKind: recruiters.clientKind,
      orgId: recruiters.orgId,
    })
    .from(recruiters)
    .where(eq(recruiters.id, auth.recruiterId))
    .limit(1);
  if (!me) return null;

  const isAgency = me.clientKind === "agency";

  const jobsQuery = db
    .select({
      id: jobOpenings.id,
      title: jobOpenings.title,
      jobCategory: jobOpenings.jobCategory,
      location: jobOpenings.location,
      clientCompany: recruiters.company,
      clientIndustry: recruiters.industry,
      clientKind: recruiters.clientKind,
    })
    .from(jobOpenings)
    .innerJoin(recruiters, eq(jobOpenings.recruiterId, recruiters.id))
    .where(
      isAgency
        ? me.orgId != null
          ? and(ne(recruiters.clientKind, "agency"), eq(recruiters.orgId, me.orgId))
          : ne(recruiters.clientKind, "agency")
        : eq(jobOpenings.recruiterId, me.id)
    );

  const cardsBase = db
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
    );

  const [jobs, rows] = await Promise.all([
    jobsQuery,
    isAgency
      ? me.orgId != null
        ? cardsBase.where(eq(applications.orgId, me.orgId))
        : cardsBase
      : cardsBase.where(eq(applications.recruiterId, me.id)),
  ]);

  if (jobs.length === 0) return null;

  const cards: PipelineCard[] = rows.map((r) => ({
    id: r.id,
    jobOpeningId: r.jobOpeningId,
    stage: r.stage as PipelineCard["stage"],
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

  return { recruiter: { id: me.id, company: me.company }, jobs, cards };
}
