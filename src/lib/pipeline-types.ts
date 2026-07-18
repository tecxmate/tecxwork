// Client-safe pipeline types + constants (no server imports — safe to import
// from client components and the shared API route).

export const PIPELINE_STAGES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface PipelineCard {
  id: number;
  jobOpeningId: number;
  stage: PipelineStage;
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
  jobs: PipelineJob[];
  cards: PipelineCard[];
}
