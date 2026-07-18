import { eq, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
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
 * Yang Luck agency view: the whole placement pipeline across every client
 * company (each client company is its own recruiter). The board groups by the
 * client company; the agency recruiter itself (clientKind "agency") is excluded.
 */
export async function getPipelineBoard(): Promise<PipelineBoard | null> {
  const db = getDb();
  const [jobs, rows] = await Promise.all([
    db
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
      .where(ne(recruiters.clientKind, "agency")),
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
      ),
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

  return { recruiter: { id: 0, company: "揚運 Yang Luck" }, jobs, cards };
}
