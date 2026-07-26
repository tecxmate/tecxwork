// Client-safe pipeline types + constants (no server imports — safe to import
// from client components and the shared API route).

// Coarse, stable stage semantics used for cross-org reporting + bilingual
// labels, even when a template's display names differ.
export const STAGE_KINDS = [
  "sourced",
  "screened",
  "internal_submit",
  "client_submit",
  "interview",
  "offer",
  "placed",
  "onboarding",
  "started",
  "rejected",
] as const;

export type StageKind = (typeof STAGE_KINDS)[number];

export interface PipelineStageDef {
  id: number;
  name: string;
  stageKind: StageKind;
  sortOrder: number;
}

export interface PipelineCard {
  id: number;
  jobOpeningId: number;
  stageId: number;
  aiScore: number | null;
  notes: string;
  applicant: {
    name: string;
    nationality: string;
    schoolName: string;
    schoolNameEn: string;
    major: string;
    studyLevel: string;
    skills: string[];
    cvLink: string;
    description: string;
  };
}

export interface PipelineJob {
  id: number;
  title: string;
  jobCategory: string;
  location: string;
  clientCompany: string;
  clientIndustry: string;
  clientKind: string;
}

export interface PipelineBoard {
  recruiter: { id: number; company: string };
  stages: PipelineStageDef[];
  jobs: PipelineJob[];
  cards: PipelineCard[];
}
