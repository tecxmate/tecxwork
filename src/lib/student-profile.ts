export type TaiwanSchoolOption = {
  code: string;
  nameZh: string;
  nameEn: string;
  label: string;
  city: string;
  schoolType: string;
  aliases?: string[];
};

export type StudentWorkExperience = {
  company: string;
  title: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
};

export type StudentCertification = {
  type: string;
  name: string;
  score: string;
  issueDate: string;
};

export const MAX_STUDENT_WORK_EXPERIENCES = 5;
export const MAX_STUDENT_CERTIFICATIONS = 10;

export const CERTIFICATION_TYPE_OPTIONS = [
  { value: "language", label: "Language Certificate" },
  { value: "professional", label: "Professional Certificate" },
  { value: "course", label: "Online Course" },
  { value: "other", label: "Other" },
] as const;

export const LANGUAGE_CERT_OPTIONS = [
  "TOCFL",
  "HSK",
  "JLPT",
  "TOEIC",
  "TOEFL",
  "IELTS",
  "TOPIK",
  "DELF/DALF",
  "Goethe-Zertifikat",
  "Other",
] as const;

export const EMPTY_STUDENT_CERTIFICATION: StudentCertification = {
  type: "language",
  name: "",
  score: "",
  issueDate: "",
};

export const EMPTY_STUDENT_WORK_EXPERIENCE: StudentWorkExperience = {
  company: "",
  title: "",
  employmentType: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  description: "",
};

export const STUDY_LEVEL_OPTIONS = [
  { value: "bachelor", label: "Bachelor" },
  { value: "master", label: "Master" },
  { value: "phd", label: "PhD" },
  { value: "exchange", label: "Exchange" },
  { value: "language", label: "Language Program" },
  { value: "other", label: "Other" },
] as const;

export const STUDY_YEAR_OPTIONS = [
  { value: "year-1", label: "Year 1" },
  { value: "year-2", label: "Year 2" },
  { value: "year-3", label: "Year 3" },
  { value: "year-4", label: "Year 4" },
  { value: "year-5-plus", label: "Year 5+" },
  { value: "graduate", label: "Graduate Student" },
  { value: "recent-grad", label: "Recent Graduate" },
] as const;

export const JOB_SEEKING_STATUS_OPTIONS = [
  { value: "actively-looking", label: "Actively looking" },
  { value: "open-to-opportunities", label: "Open to opportunities" },
  { value: "networking", label: "Networking only" },
] as const;

export const WORK_AUTHORIZATION_OPTIONS = [
  { value: "taiwan-citizen", label: "Taiwan citizen" },
  { value: "arc-work-rights", label: "ARC / existing work rights" },
  { value: "student-visa", label: "Student visa" },
  { value: "needs-sponsorship", label: "Needs employer sponsorship" },
  { value: "other", label: "Other" },
] as const;

export const PREFERRED_LOCATION_OPTIONS = [
  "Taipei",
  "New Taipei",
  "Taoyuan",
  "Hsinchu",
  "Taichung",
  "Tainan",
  "Kaohsiung",
  "Remote",
] as const;

export const PREFERRED_INDUSTRY_OPTIONS = [
  "Technology",
  "Semiconductor",
  "Manufacturing",
  "Finance",
  "Consulting",
  "Healthcare",
  "E-Commerce",
  "Marketing",
  "Operations",
  "Research",
] as const;

export type StudentRegistrationDraft = {
  name: string;
  email: string;
  major: string;
  skillInput: string;
  skills: string[];
  cvLink: string;
  description: string;
  pipaConsent: boolean;
  wantsNewsletter: boolean;
  phone: string;
  nationality: string;
  schoolQuery: string;
  schoolCode: string;
  schoolName: string;
  schoolNameEn: string;
  studyLevel: string;
  studyYear: string;
  expectedGraduation: string;
  jobSeekingStatus: string;
  workAuthorization: string;
  preferredLocations: string[];
  preferredIndustries: string[];
  linkedinUrl: string;
  portfolioUrl: string;
  workExperiences: StudentWorkExperience[];
  certifications: StudentCertification[];
};

export const STUDENT_REGISTRATION_DRAFT_KEY = "student-registration-draft-v2";

export const EMPTY_STUDENT_REGISTRATION_DRAFT: StudentRegistrationDraft = {
  name: "",
  email: "",
  major: "",
  skillInput: "",
  skills: [],
  cvLink: "",
  description: "",
  pipaConsent: false,
  wantsNewsletter: false,
  phone: "",
  nationality: "",
  schoolQuery: "",
  schoolCode: "",
  schoolName: "",
  schoolNameEn: "",
  studyLevel: "",
  studyYear: "",
  expectedGraduation: "",
  jobSeekingStatus: "",
  workAuthorization: "",
  preferredLocations: [],
  preferredIndustries: [],
  linkedinUrl: "",
  portfolioUrl: "",
  workExperiences: [],
  certifications: [],
};

export function calculateProfileCompletion(draft: StudentRegistrationDraft): number {
  const fields = [
    { filled: !!draft.name.trim(), weight: 10 },
    { filled: !!draft.phone.trim(), weight: 5 },
    { filled: !!draft.nationality.trim(), weight: 5 },
    { filled: !!draft.schoolName.trim(), weight: 10 },
    { filled: !!draft.major.trim(), weight: 10 },
    { filled: !!draft.studyLevel, weight: 5 },
    { filled: !!draft.studyYear, weight: 5 },
    { filled: !!draft.expectedGraduation.trim(), weight: 5 },
    { filled: !!draft.jobSeekingStatus, weight: 5 },
    { filled: !!draft.workAuthorization, weight: 5 },
    { filled: draft.skills.length > 0, weight: 10 },
    { filled: draft.preferredLocations.length > 0, weight: 5 },
    { filled: draft.preferredIndustries.length > 0, weight: 5 },
    { filled: !!draft.cvLink.trim(), weight: 10 },
    { filled: !!draft.description.trim(), weight: 5 },
  ];

  const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);
  const filledWeight = fields.reduce((sum, f) => sum + (f.filled ? f.weight : 0), 0);

  return Math.round((filledWeight / totalWeight) * 100);
}
