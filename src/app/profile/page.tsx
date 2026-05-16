"use client";

import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  CheckCircle2,
  Download,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  User,
  X,
  AlertCircle,
  BriefcaseBusiness,
  FileText,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AppTopBar } from "@/components/app-topbar";
import { LogoutButton } from "@/components/logout-button";
import { QRCard } from "@/components/qr-code";
import { SiteFooter } from "@/components/site-footer";
import { ImageUpload } from "@/components/image-upload";
import { useStudentI18n } from "@/components/student-locale-provider";
import { interpolate } from "@/lib/student-messages";
import {
  calculateProfileCompletion,
  CERTIFICATION_TYPE_OPTIONS,
  EMPTY_STUDENT_CERTIFICATION,
  EMPTY_STUDENT_REGISTRATION_DRAFT,
  EMPTY_STUDENT_WORK_EXPERIENCE,
  JOB_SEEKING_STATUS_OPTIONS,
  LANGUAGE_CERT_OPTIONS,
  MAX_STUDENT_CERTIFICATIONS,
  MAX_STUDENT_WORK_EXPERIENCES,
  PREFERRED_INDUSTRY_OPTIONS,
  PREFERRED_LOCATION_OPTIONS,
  STUDY_LEVEL_OPTIONS,
  STUDY_YEAR_OPTIONS,
  WORK_AUTHORIZATION_OPTIONS,
  type StudentCertification,
  type StudentRegistrationDraft,
  type StudentWorkExperience,
  type TaiwanSchoolOption,
} from "@/lib/student-profile";

type ProfileResponse = {
  name: string;
  email: string;
  phone: string;
  nationality: string;
  schoolCode: string;
  schoolName: string;
  schoolNameEn: string;
  major: string;
  studyLevel: string;
  studyYear: string;
  expectedGraduation: string;
  jobSeekingStatus: string;
  workAuthorization: string;
  skills: string[];
  preferredLocations: string[];
  preferredIndustries: string[];
  workExperiences: StudentWorkExperience[];
  certifications: StudentCertification[];
  cvLink: string;
  linkedinUrl: string;
  portfolioUrl: string;
  avatarUrl: string | null;
  description: string;
};

type ProfileSavePayload = {
  name: string;
  phone: string;
  nationality: string;
  schoolCode: string;
  schoolName: string;
  schoolNameEn: string;
  major: string;
  studyLevel: string;
  studyYear: string;
  expectedGraduation: string;
  jobSeekingStatus: string;
  workAuthorization: string;
  skills: string[];
  preferredLocations: string[];
  preferredIndustries: string[];
  workExperiences: StudentWorkExperience[];
  certifications: StudentCertification[];
  cvLink: string;
  linkedinUrl: string;
  portfolioUrl: string;
  description: string;
};

function profileToDraft(profile: ProfileResponse): StudentRegistrationDraft {
  const schoolQuery = profile.schoolName
    ? profile.schoolNameEn
      ? `${profile.schoolName} / ${profile.schoolNameEn}`
      : profile.schoolName
    : "";

  return {
    ...EMPTY_STUDENT_REGISTRATION_DRAFT,
    name: profile.name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    nationality: profile.nationality ?? "",
    schoolQuery,
    schoolCode: profile.schoolCode ?? "",
    schoolName: profile.schoolName ?? "",
    schoolNameEn: profile.schoolNameEn ?? "",
    major: profile.major ?? "",
    studyLevel: profile.studyLevel ?? "",
    studyYear: profile.studyYear ?? "",
    expectedGraduation: profile.expectedGraduation ?? "",
    jobSeekingStatus: profile.jobSeekingStatus ?? "",
    workAuthorization: profile.workAuthorization ?? "",
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    preferredLocations: Array.isArray(profile.preferredLocations)
      ? profile.preferredLocations
      : [],
    preferredIndustries: Array.isArray(profile.preferredIndustries)
      ? profile.preferredIndustries
      : [],
    workExperiences: Array.isArray(profile.workExperiences)
      ? profile.workExperiences
      : [],
    certifications: Array.isArray(profile.certifications)
      ? profile.certifications
      : [],
    cvLink: profile.cvLink ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
    portfolioUrl: profile.portfolioUrl ?? "",
    description: profile.description ?? "",
  };
}

function buildProfilePayload(
  draft: StudentRegistrationDraft
): ProfileSavePayload {
  return {
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    nationality: draft.nationality.trim(),
    schoolCode: draft.schoolCode,
    schoolName: draft.schoolName.trim(),
    schoolNameEn: draft.schoolNameEn.trim(),
    major: draft.major.trim(),
    studyLevel: draft.studyLevel,
    studyYear: draft.studyYear,
    expectedGraduation: draft.expectedGraduation,
    jobSeekingStatus: draft.jobSeekingStatus,
    workAuthorization: draft.workAuthorization,
    skills: draft.skills,
    preferredLocations: draft.preferredLocations,
    preferredIndustries: draft.preferredIndustries,
    workExperiences: draft.workExperiences,
    certifications: draft.certifications,
    cvLink: draft.cvLink.trim(),
    linkedinUrl: draft.linkedinUrl.trim(),
    portfolioUrl: draft.portfolioUrl.trim(),
    description: draft.description.trim(),
  };
}

function formatOptionLabel(
  value: string,
  labels: Readonly<Record<string, string>> | undefined
) {
  return labels?.[value] ?? value;
}

function formatMonth(value: string) {
  if (!value) return "";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  return `${year}.${month}`;
}

function formatDate(value: string) {
  if (!value) return "";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  return `${year}.${month}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char] ?? char;
  });
}

function CvExportTemplate({
  draft,
  email,
  labels,
}: {
  draft: StudentRegistrationDraft;
  email: string;
  labels: {
    summary: string;
    education: string;
    experience: string;
    skills: string;
    certifications: string;
    preferences: string;
    links: string;
    current: string;
    studyLevel: Readonly<Record<string, string>>;
    studyYear: Readonly<Record<string, string>>;
    jobSeekingStatus: Readonly<Record<string, string>>;
    workAuthorization: Readonly<Record<string, string>>;
    preferredLocations: Readonly<Record<string, string>>;
    preferredIndustries: Readonly<Record<string, string>>;
  };
}) {
  const contactItems = [
    email,
    draft.phone,
    draft.nationality,
  ].filter(Boolean);
  const schoolLine = [draft.schoolNameEn || draft.schoolName, draft.schoolName && draft.schoolNameEn ? draft.schoolName : ""]
    .filter(Boolean)
    .join(" / ");
  const educationMeta = [
    formatOptionLabel(draft.studyLevel, labels.studyLevel),
    formatOptionLabel(draft.studyYear, labels.studyYear),
    draft.expectedGraduation ? `Expected ${formatDate(draft.expectedGraduation)}` : "",
  ].filter(Boolean);
  const preferences = [
    formatOptionLabel(draft.jobSeekingStatus, labels.jobSeekingStatus),
    formatOptionLabel(draft.workAuthorization, labels.workAuthorization),
    ...draft.preferredLocations.map((item) =>
      formatOptionLabel(item, labels.preferredLocations)
    ),
    ...draft.preferredIndustries.map((item) =>
      formatOptionLabel(item, labels.preferredIndustries)
    ),
  ].filter(Boolean);
  const links = [
    draft.linkedinUrl ? { label: "LinkedIn", value: draft.linkedinUrl } : null,
    draft.portfolioUrl ? { label: "Portfolio", value: draft.portfolioUrl } : null,
    draft.cvLink ? { label: "Source CV", value: draft.cvLink } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <article className="student-cv-export-surface mx-auto max-w-[820px] overflow-hidden rounded-lg border border-zinc-200 bg-white text-zinc-950 shadow-sm">
      <div className="grid gap-8 border-b border-zinc-200 bg-[#fbfaf7] px-8 py-8 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <h2 className="font-heading text-4xl font-bold leading-tight text-zinc-950">
            {draft.name || "Student Name"}
          </h2>
          <div className="mt-2 space-y-1 text-base font-medium text-zinc-700">
            <p>{draft.major || "Student profile"}</p>
            {schoolLine && <p className="font-bold">{schoolLine}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-1 text-right text-sm text-zinc-600">
          {contactItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>

      <div className="grid gap-8 px-8 py-8 sm:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-7">
          {draft.description.trim() && (
            <section className="space-y-2">
              <h3 className="border-b border-zinc-200 pb-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                {labels.summary}
              </h3>
              <p className="whitespace-pre-line text-sm leading-6 text-zinc-700">
                {draft.description.trim()}
              </p>
            </section>
          )}

          <section className="space-y-2">
            <h3 className="border-b border-zinc-200 pb-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              {labels.education}
            </h3>
            <div>
              <p className="text-base font-semibold text-zinc-950">
                {schoolLine || "School"}
              </p>
              <p className="text-sm text-zinc-700">{draft.major || "Major"}</p>
              {educationMeta.length > 0 && (
                <p className="mt-1 text-xs text-zinc-500">{educationMeta.join(" · ")}</p>
              )}
            </div>
          </section>

          {draft.workExperiences.length > 0 && (
            <section className="space-y-3">
              <h3 className="border-b border-zinc-200 pb-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                {labels.experience}
              </h3>
              {draft.workExperiences.map((experience, index) => {
                const duration = [
                  formatMonth(experience.startDate),
                  experience.isCurrent
                    ? labels.current
                    : formatMonth(experience.endDate),
                ].filter(Boolean).join(" - ");

                return (
                  <div key={`${experience.company}-${index}`} className="break-inside-avoid space-y-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-zinc-950">
                          {experience.title || "Role"}
                        </p>
                        <p className="text-sm text-zinc-700">
                          {[experience.company, experience.employmentType]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      {duration && (
                        <p className="shrink-0 text-xs font-medium text-zinc-500">
                          {duration}
                        </p>
                      )}
                    </div>
                    {experience.description && (
                      <p className="whitespace-pre-line text-sm leading-6 text-zinc-700">
                        {experience.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {draft.skills.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                {labels.skills}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {draft.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-[#8C52FF]/25 bg-[#8C52FF]/10 px-2.5 py-1 text-xs font-medium text-zinc-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {draft.certifications.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                {labels.certifications}
              </h3>
              <div className="space-y-2">
                {draft.certifications.map((cert, index) => (
                  <div key={`${cert.name}-${index}`}>
                    <p className="text-sm font-semibold text-zinc-900">
                      {[cert.name, cert.score].filter(Boolean).join(" · ")}
                    </p>
                    {cert.issueDate && (
                      <p className="text-xs text-zinc-500">
                        {formatMonth(cert.issueDate)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {preferences.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                {labels.preferences}
              </h3>
              <div className="space-y-1 text-sm text-zinc-700">
                {preferences.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </section>
          )}

          {links.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                {labels.links}
              </h3>
              <div className="space-y-1 text-xs text-zinc-600">
                {links.map((link) => (
                  <p key={link.label} className="break-all">
                    <span className="font-semibold text-zinc-800">{link.label}: </span>
                    {link.value}
                  </p>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      <footer className="flex items-end justify-between border-t border-zinc-200 px-8 py-5">
        <span aria-hidden />
        <p
          className="font-wordmark text-3xl italic text-[#8C52FF]"
        >
          tecxwork
        </p>
      </footer>
    </article>
  );
}

const WorkExperienceEditor = memo(function WorkExperienceEditor({
  experience,
  index,
  onRemove,
  onUpdate,
  labels,
}: {
  experience: StudentWorkExperience;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: <K extends keyof StudentWorkExperience>(
    index: number,
    field: K,
    value: StudentWorkExperience[K]
  ) => void;
  labels: {
    workExperienceTitle: string;
    remove: string;
    company: string;
    companyPlaceholder: string;
    jobTitle: string;
    jobTitlePlaceholder: string;
    employmentType: string;
    employmentTypePlaceholder: string;
    currentlyWorking: string;
    startDate: string;
    endDate: string;
    summary: string;
    summaryPlaceholder: string;
  };
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">
          {interpolate(labels.workExperienceTitle, { index: index + 1 })}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
          {labels.remove}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{labels.company}</label>
          <Input
            value={experience.company}
            onChange={(e) => onUpdate(index, "company", e.target.value)}
            placeholder={labels.companyPlaceholder}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">{labels.jobTitle}</label>
          <Input
            value={experience.title}
            onChange={(e) => onUpdate(index, "title", e.target.value)}
            placeholder={labels.jobTitlePlaceholder}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">{labels.employmentType}</label>
          <Input
            value={experience.employmentType}
            onChange={(e) => onUpdate(index, "employmentType", e.target.value)}
            placeholder={labels.employmentTypePlaceholder}
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2.5">
          <input
            id={`current-role-${index}`}
            type="checkbox"
            checked={experience.isCurrent}
            onChange={(e) => onUpdate(index, "isCurrent", e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
          />
          <label
            htmlFor={`current-role-${index}`}
            className="cursor-pointer text-sm text-muted-foreground"
          >
            {labels.currentlyWorking}
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">{labels.startDate}</label>
          <Input
            type="month"
            value={experience.startDate}
            onChange={(e) => onUpdate(index, "startDate", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">{labels.endDate}</label>
          <Input
            type="month"
            value={experience.endDate}
            onChange={(e) => onUpdate(index, "endDate", e.target.value)}
            disabled={experience.isCurrent}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">{labels.summary}</label>
          <textarea
            value={experience.description}
            onChange={(e) => onUpdate(index, "description", e.target.value)}
            rows={3}
            placeholder={labels.summaryPlaceholder}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
});

const CertificationEditor = memo(function CertificationEditor({
  certification,
  index,
  onRemove,
  onUpdate,
  labels,
}: {
  certification: StudentCertification;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: <K extends keyof StudentCertification>(
    index: number,
    field: K,
    value: StudentCertification[K]
  ) => void;
  labels: {
    certificationTitle: string;
    remove: string;
    certType: string;
    certName: string;
    certNamePlaceholder: string;
    score: string;
    scorePlaceholder: string;
    issueDate: string;
  };
}) {
  const isLanguage = certification.type === "language";

  return (
    <div className="space-y-3 rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">
          {interpolate(labels.certificationTitle, { index: index + 1 })}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
          {labels.remove}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{labels.certType}</label>
          <select
            value={certification.type}
            onChange={(e) => onUpdate(index, "type", e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {CERTIFICATION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">{labels.certName}</label>
          {isLanguage ? (
            <select
              value={certification.name}
              onChange={(e) => onUpdate(index, "name", e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">{labels.certNamePlaceholder}</option>
              {LANGUAGE_CERT_OPTIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          ) : (
            <Input
              value={certification.name}
              onChange={(e) => onUpdate(index, "name", e.target.value)}
              placeholder={labels.certNamePlaceholder}
            />
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">{labels.score}</label>
          <Input
            value={certification.score}
            onChange={(e) => onUpdate(index, "score", e.target.value)}
            placeholder={labels.scorePlaceholder}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">{labels.issueDate}</label>
          <Input
            type="month"
            value={certification.issueDate}
            onChange={(e) => onUpdate(index, "issueDate", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
});

export default function ProfilePage() {
  const router = useRouter();
  const { messages } = useStudentI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [draft, setDraft] = useState<StudentRegistrationDraft>(
    EMPTY_STUDENT_REGISTRATION_DRAFT
  );
  const [schools, setSchools] = useState<TaiwanSchoolOption[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schoolsError, setSchoolsError] = useState("");
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const deferredSchoolQuery = useDeferredValue(draft.schoolQuery);
  const [lastSavedPayload, setLastSavedPayload] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const cvPrintRef = useRef<HTMLDivElement | null>(null);

  const profilePayload = useMemo(() => buildProfilePayload(draft), [draft]);
  const serializedPayload = useMemo(
    () => JSON.stringify(profilePayload),
    [profilePayload]
  );
  const canSaveProfile =
    !!profilePayload.name &&
    !!profilePayload.cvLink &&
    !!profilePayload.schoolName &&
    !!profilePayload.major &&
    !!profilePayload.studyLevel &&
    !!profilePayload.expectedGraduation;

  useEffect(() => {
    fetch("/api/me/profile")
      .then(async (r) => {
        if (!r.ok) throw new Error(messages.profile.failedToLoadProfile);
        return r.json();
      })
      .then((data) => {
        const profile = data.profile as ProfileResponse;
        setProfileEmail(profile.email ?? "");
        setAvatarUrl(profile.avatarUrl ?? null);
        const nextDraft = profileToDraft(profile);
        setDraft(nextDraft);
        setLastSavedPayload(JSON.stringify(buildProfilePayload(nextDraft)));
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [messages.profile.failedToLoadProfile, router]);

  useEffect(() => {
    fetch("/api/taiwan-schools")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(messages.register.failedSchoolList);
        }

        return response.json();
      })
      .then((data) => {
        const nextSchools = Array.isArray(data.schools) ? data.schools : [];
        setSchools(nextSchools);
        setSchoolsError(
          nextSchools.length === 0
            ? messages.register.schoolListEmpty
            : ""
        );
      })
      .catch(() => {
        setSchools([]);
        setSchoolsError(
          messages.register.schoolListFailed
        );
      })
      .finally(() => setSchoolsLoading(false));
  }, [
    messages.register.failedSchoolList,
    messages.register.schoolListEmpty,
    messages.register.schoolListFailed,
  ]);

  const schoolLabelToOption = useMemo(() => {
    return new Map(schools.map((school) => [school.label, school]));
  }, [schools]);

  const findBestSchoolMatch = useCallback(
    (rawValue: string) => {
      const query = rawValue.trim().toLowerCase();
      if (!query) return null;

      let bestMatch: TaiwanSchoolOption | null = null;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const school of schools) {
        const exactFields = [
          school.label,
          school.nameZh,
          school.nameEn,
          school.code,
          ...(school.aliases ?? []),
        ].map((value) => value.toLowerCase());

        if (exactFields.includes(query)) {
          return school;
        }

        const rankedFields = [
          school.code,
          ...(school.aliases ?? []),
          school.nameEn,
          school.nameZh,
          school.label,
          school.city,
        ];

        const fieldScore = rankedFields.findIndex((value) =>
          value.toLowerCase().startsWith(query)
        );
        if (fieldScore !== -1 && fieldScore < bestScore) {
          bestMatch = school;
          bestScore = fieldScore;
          continue;
        }

        const containsScore = rankedFields.findIndex((value) =>
          value.toLowerCase().includes(query)
        );
        if (containsScore !== -1 && containsScore + 10 < bestScore) {
          bestMatch = school;
          bestScore = containsScore + 10;
        }
      }

      return bestMatch;
    },
    [schools]
  );

  const filteredSchools = useMemo(() => {
    const query = deferredSchoolQuery.trim().toLowerCase();
    if (!query) {
      return schools.slice(0, 8);
    }

    return schools
      .filter((school) => {
        const haystack = [
          school.label,
          school.nameZh,
          school.nameEn,
          school.city,
          school.code,
          ...(school.aliases ?? []),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      })
      .slice(0, 8);
  }, [deferredSchoolQuery, schools]);

  function setField<K extends keyof StudentRegistrationDraft>(
    field: K,
    value: StudentRegistrationDraft[K]
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function toggleArrayField(
    field: "preferredLocations" | "preferredIndustries",
    value: string
  ) {
    setDraft((current) => {
      const list = current[field];
      const next = list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];

      return { ...current, [field]: next };
    });
  }

  function addSkill() {
    const skill = draft.skillInput.trim();
    if (!skill || draft.skills.includes(skill)) {
      setField("skillInput", "");
      return;
    }

    setDraft((current) => ({
      ...current,
      skillInput: "",
      skills: [...current.skills, skill],
    }));
  }

  function removeSkill(skill: string) {
    setField(
      "skills",
      draft.skills.filter((item) => item !== skill)
    );
  }

  function handleSchoolQueryChange(value: string) {
    const trimmedValue = value.trim();
    setSchoolDropdownOpen(true);
    if (!trimmedValue) {
      setDraft((current) => ({
        ...current,
        schoolQuery: value,
        schoolCode: "",
        schoolName: "",
        schoolNameEn: "",
      }));
      return;
    }

    const matched = schoolLabelToOption.get(trimmedValue) ?? findBestSchoolMatch(trimmedValue);

    if (matched) {
      setDraft((current) => ({
        ...current,
        schoolQuery: value,
        schoolCode: matched.code,
        schoolName: matched.nameZh,
        schoolNameEn: matched.nameEn,
      }));
      return;
    }

    setDraft((current) => ({
      ...current,
      schoolQuery: value,
      schoolCode: "",
      schoolName: trimmedValue,
      schoolNameEn: "",
    }));
  }

  function selectSchool(school: TaiwanSchoolOption) {
    setDraft((current) => ({
      ...current,
      schoolQuery: school.label,
      schoolCode: school.code,
      schoolName: school.nameZh,
      schoolNameEn: school.nameEn,
    }));
    setSchoolDropdownOpen(false);
  }

  function addWorkExperience() {
    if (draft.workExperiences.length >= MAX_STUDENT_WORK_EXPERIENCES) return;
    setField("workExperiences", [
      ...draft.workExperiences,
      { ...EMPTY_STUDENT_WORK_EXPERIENCE },
    ]);
  }

  const removeWorkExperience = useCallback((index: number) => {
    setDraft((current) => ({
      ...current,
      workExperiences: current.workExperiences.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  }, []);

  const updateWorkExperience = useCallback(<K extends keyof StudentWorkExperience>(
    index: number,
    field: K,
    value: StudentWorkExperience[K]
  ) => {
    setDraft((current) => ({
      ...current,
      workExperiences: current.workExperiences.map((experience, itemIndex) =>
        itemIndex === index ? { ...experience, [field]: value } : experience
      ),
    }));
  }, []);

  function addCertification() {
    if (draft.certifications.length >= MAX_STUDENT_CERTIFICATIONS) return;
    setField("certifications", [
      ...draft.certifications,
      { ...EMPTY_STUDENT_CERTIFICATION },
    ]);
  }

  const removeCertification = useCallback((index: number) => {
    setDraft((current) => ({
      ...current,
      certifications: current.certifications.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  }, []);

  const updateCertification = useCallback(<K extends keyof StudentCertification>(
    index: number,
    field: K,
    value: StudentCertification[K]
  ) => {
    setDraft((current) => ({
      ...current,
      certifications: current.certifications.map((cert, itemIndex) =>
        itemIndex === index ? { ...cert, [field]: value } : cert
      ),
    }));
  }, []);

  const profileCompletion = useMemo(() => calculateProfileCompletion(draft), [draft]);
  const cvExportLabels = useMemo(
    () => ({
      summary: messages.profile.cvExportSummary ?? "Summary",
      education: messages.profile.cvExportEducation ?? "Education",
      experience: messages.profile.cvExportExperience ?? "Experience",
      skills: messages.profile.cvExportSkills ?? "Skills",
      certifications: messages.profile.cvExportCertifications ?? "Certifications",
      preferences: messages.profile.cvExportPreferences ?? "Preferences",
      links: messages.profile.cvExportLinks ?? "Links",
      current: messages.profile.cvExportCurrent ?? "Present",
      studyLevel: messages.options.studyLevel,
      studyYear: messages.options.studyYear,
      jobSeekingStatus: messages.options.jobSeekingStatus,
      workAuthorization: messages.options.workAuthorization,
      preferredLocations: messages.options.preferredLocations,
      preferredIndustries: messages.options.preferredIndustries,
    }),
    [messages]
  );

  const saveProfile = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profilePayload, avatarUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || messages.profile.saveFailed);
      }

      setLastSavedPayload(serializedPayload);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : messages.register.somethingWentWrong
      );
    } finally {
      setSaving(false);
    }
  }, [
    messages.profile.saveFailed,
    messages.register.somethingWentWrong,
    avatarUrl,
    profilePayload,
    serializedPayload,
  ]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await saveProfile();
  }

  function handleExportCv() {
    const cvNode = cvPrintRef.current;
    const printWindow = window.open("", "_blank", "width=900,height=1200");

    if (!cvNode || !printWindow) {
      window.print();
      return;
    }

    const headAssets = Array.from(
      document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>(
        'link[rel="stylesheet"], style'
      )
    )
      .map((node) => node.outerHTML)
      .join("\n");

    const documentTitle = escapeHtml(draft.name ? `${draft.name} CV` : "TECXWORK CV");

    printWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base href="${escapeHtml(window.location.origin)}/" />
    <title>${documentTitle}</title>
    ${headAssets}
    <style>
      @page { size: A4; margin: 12mm; }
      html, body { margin: 0; background: #ffffff; }
      body { padding: 0; color: #18181b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .student-cv-export-surface {
        width: 100% !important;
        max-width: none !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
    </style>
  </head>
  <body>
    ${cvNode.innerHTML}
  </body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  useEffect(() => {
    if (loading || !canSaveProfile || saving) return;
    if (lastSavedPayload === null || serializedPayload === lastSavedPayload) return;

    const timeoutId = window.setTimeout(() => {
      void saveProfile();
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [
    canSaveProfile,
    lastSavedPayload,
    loading,
    saveProfile,
    saving,
    serializedPayload,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppTopBar
        href="/profile"
        navRole="applicant"
        currentPath="/profile"
        desktopActions={<LogoutButton />}
      />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl space-y-4">
          <QRCard
            value={draft.cvLink}
            title={messages.profile.cvQrTitle}
            subtitle={messages.profile.cvQrSubtitle}
            size={160}
            layout="horizontal"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="cv-link" className="text-sm font-medium">
                  {messages.register.cvLink}{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  id="cv-link"
                  type="text"
                  required
                  value={draft.cvLink}
                  onChange={(e) => setField("cvLink", e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p className="text-xs text-muted-foreground">
                  {messages.profile.cvHint}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {saved && (
                <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {messages.profile.profileUpdated}
                </div>
              )}
            </div>
          </QRCard>

          <div ref={cvPrintRef} className="student-cv-print-only">
            <CvExportTemplate
              draft={draft}
              email={profileEmail}
              labels={cvExportLabels}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-2 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="font-heading text-xl font-bold">
                  {messages.profile.title}
                </h1>
                <p className="text-xs text-muted-foreground">{profileEmail}</p>
                <div className="mt-1 w-full max-w-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {messages.profile.profileCompletion ?? "Profile completion"}
                    </span>
                    <span className={profileCompletion >= 80 ? "font-medium text-green-600" : "font-medium text-primary"}>
                      {profileCompletion}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all ${profileCompletion >= 80 ? "bg-green-500" : "bg-primary"}`}
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                form="profile-form"
                disabled={saving}
                className="shrink-0"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {messages.common.saving}
                  </>
                ) : (
                  messages.common.saveChanges
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <form id="profile-form" onSubmit={handleSave} className="space-y-6">

                <section className="space-y-4">
                  <div className="flex items-center gap-4">
                    <ImageUpload
                      value={avatarUrl ?? undefined}
                      onChange={setAvatarUrl}
                      type="avatar"
                    />
                    <div>
                      <p className="text-sm font-medium">Profile Photo</p>
                    </div>
                  </div>
                </section>

                <Separator />

                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-sm font-medium">
                        {messages.register.fullName}
                      </label>
                      <Input
                        id="name"
                        required
                        value={draft.name}
                        onChange={(e) => setField("name", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="text-sm font-medium">
                        {messages.register.phone}
                      </label>
                      <Input
                        id="phone"
                        value={draft.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                        placeholder="+886..."
                        autoComplete="tel"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label htmlFor="nationality" className="text-sm font-medium">
                        {messages.register.nationality}
                      </label>
                      <Input
                        id="nationality"
                        value={draft.nationality}
                        onChange={(e) => setField("nationality", e.target.value)}
                        placeholder={messages.register.nationality}
                      />
                    </div>
                  </div>
                </section>

                <Separator />

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <h2 className="font-heading text-lg font-semibold">
                      {messages.register.educationSection}
                    </h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label htmlFor="school" className="text-sm font-medium">
                        {messages.register.schoolInTaiwan}{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="school"
                          required
                          value={draft.schoolQuery}
                          onChange={(e) => handleSchoolQueryChange(e.target.value)}
                          onFocus={() => setSchoolDropdownOpen(true)}
                          onBlur={() => {
                            window.setTimeout(() => setSchoolDropdownOpen(false), 150);
                          }}
                          placeholder={
                            schoolsLoading
                              ? messages.profile.loadingSchoolPlaceholder
                              : messages.profile.searchSchoolPlaceholder
                          }
                          className="pl-11"
                        />
                        {schoolDropdownOpen && !schoolsLoading && (
                          <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border bg-background shadow-lg">
                            {schoolsError ? (
                              <div className="px-3 py-3 text-sm text-muted-foreground">
                                {schoolsError}
                              </div>
                            ) : filteredSchools.length > 0 ? (
                              <div className="py-1">
                                {filteredSchools.map((school) => {
                                  const isSelected = draft.schoolCode === school.code;

                                  return (
                                    <button
                                      key={school.code}
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => selectSchool(school)}
                                      className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left hover:bg-muted"
                                    >
                                      <div className="min-w-0">
                                        <div className="truncate text-sm font-medium">
                                          {school.nameZh}
                                        </div>
                                        <div className="truncate text-xs text-muted-foreground">
                                          {school.nameEn}
                                        </div>
                                        <div className="mt-1 text-[11px] text-muted-foreground">
                                          {school.city} · {school.schoolType} · {school.code}
                                        </div>
                                        {school.aliases && school.aliases.length > 0 && (
                                          <div className="mt-1 text-[11px] font-medium text-primary">
                                            {school.aliases.join(" · ")}
                                          </div>
                                        )}
                                      </div>
                                      {isSelected && (
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="px-3 py-3 text-sm text-muted-foreground">
                                {messages.profile.noSchoolMatch}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {messages.profile.schoolSearchHint}
                      </p>
                      {schoolsError && (
                        <p className="text-xs text-amber-600">{schoolsError}</p>
                      )}
                      {draft.schoolName && (
                        <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                          {messages.register.savedSchool}:{" "}
                          <span className="font-medium text-foreground">
                            {draft.schoolName}
                          </span>
                          {draft.schoolNameEn
                            ? ` / ${draft.schoolNameEn}`
                            : ` ${messages.register.customEntry}`}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="major" className="text-sm font-medium">
                        {messages.register.major}{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="major"
                        required
                        value={draft.major}
                        onChange={(e) => setField("major", e.target.value)}
                        placeholder={messages.register.major}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="study-level" className="text-sm font-medium">
                        {messages.register.studyLevel}{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <select
                        id="study-level"
                        value={draft.studyLevel}
                        onChange={(e) => setField("studyLevel", e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        required
                      >
                        <option value="">{messages.register.selectStudyLevel}</option>
                        {STUDY_LEVEL_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {messages.options.studyLevel[option.value]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="study-year" className="text-sm font-medium">
                        {messages.register.studyYear}
                      </label>
                      <select
                        id="study-year"
                        value={draft.studyYear}
                        onChange={(e) => setField("studyYear", e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">{messages.register.selectCurrentYear}</option>
                        {STUDY_YEAR_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {messages.options.studyYear[option.value]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="graduation-date" className="text-sm font-medium">
                        {messages.register.expectedGraduation}{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="graduation-date"
                        type="date"
                        required
                        value={draft.expectedGraduation}
                        onChange={(e) => setField("expectedGraduation", e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                <Separator />

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h2 className="font-heading text-lg font-semibold">
                      {messages.register.preferencesSection}
                    </h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="job-seeking" className="text-sm font-medium">
                        {messages.register.jobSearchStatus}
                      </label>
                      <select
                        id="job-seeking"
                        value={draft.jobSeekingStatus}
                        onChange={(e) => setField("jobSeekingStatus", e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">{messages.register.selectStatus}</option>
                        {JOB_SEEKING_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {messages.options.jobSeekingStatus[option.value]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="work-auth" className="text-sm font-medium">
                        {messages.register.workAuthorization}
                      </label>
                      <select
                        id="work-auth"
                        value={draft.workAuthorization}
                        onChange={(e) => setField("workAuthorization", e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">
                          {messages.register.selectWorkAuthorization}
                        </option>
                        {WORK_AUTHORIZATION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {messages.options.workAuthorization[option.value]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {messages.register.preferredLocations}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PREFERRED_LOCATION_OPTIONS.map((location) => {
                        const selected = draft.preferredLocations.includes(location);
                        return (
                          <Button
                            key={location}
                            type="button"
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            onClick={() => toggleArrayField("preferredLocations", location)}
                          >
                            {messages.options.preferredLocations[location]}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {messages.register.preferredIndustries}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PREFERRED_INDUSTRY_OPTIONS.map((industry) => {
                        const selected = draft.preferredIndustries.includes(industry);
                        return (
                          <Button
                            key={industry}
                            type="button"
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            onClick={() => toggleArrayField("preferredIndustries", industry)}
                          >
                            {messages.options.preferredIndustries[industry]}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <Separator />

                <section className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <BriefcaseBusiness className="h-4 w-4 text-primary" />
                      <h2 className="font-heading text-lg font-semibold">
                        {messages.register.workExperienceSection}
                      </h2>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addWorkExperience}
                      disabled={
                        draft.workExperiences.length >= MAX_STUDENT_WORK_EXPERIENCES
                      }
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      {messages.register.addExperience}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {interpolate(messages.register.addExperienceHint, {
                      max: MAX_STUDENT_WORK_EXPERIENCES,
                    })}
                  </p>

                  {draft.workExperiences.length > 0 ? (
                    <div className="space-y-4">
                      {draft.workExperiences.map((experience, index) => (
                        <WorkExperienceEditor
                          key={index}
                          index={index}
                          experience={experience}
                          onRemove={removeWorkExperience}
                          onUpdate={updateWorkExperience}
                          labels={{
                            workExperienceTitle: messages.register.workExperienceTitle,
                            remove: messages.common.remove,
                            company: messages.register.company,
                            companyPlaceholder: "e.g. TSMC",
                            jobTitle: messages.register.jobTitle,
                            jobTitlePlaceholder: "e.g. Data Analyst Intern",
                            employmentType: messages.register.employmentType,
                            employmentTypePlaceholder:
                              "Internship, Part-time, Full-time",
                            currentlyWorking: messages.register.currentlyWorking,
                            startDate: messages.register.startDate,
                            endDate: messages.register.endDate,
                            summary: messages.register.summary,
                            summaryPlaceholder: messages.register.summaryPlaceholder,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/80 px-4 py-6 text-sm text-muted-foreground">
                      {messages.register.noExperience}
                    </div>
                  )}
                </section>

                <Separator />

                {/* Certifications */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-heading text-lg font-semibold">
                      {messages.profile.certifications ?? "Certifications"}
                    </h2>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCertification}
                      disabled={draft.certifications.length >= MAX_STUDENT_CERTIFICATIONS}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      {messages.profile.addCertification ?? "Add"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {messages.profile.certificationsHint ?? "Add language certificates, professional certifications, or online courses."}
                  </p>

                  {draft.certifications.length > 0 ? (
                    <div className="space-y-4">
                      {draft.certifications.map((cert, index) => (
                        <CertificationEditor
                          key={index}
                          index={index}
                          certification={cert}
                          onRemove={removeCertification}
                          onUpdate={updateCertification}
                          labels={{
                            certificationTitle: messages.profile.certificationTitle ?? "Certificate #{index}",
                            remove: messages.common.remove,
                            certType: messages.profile.certType ?? "Type",
                            certName: messages.profile.certName ?? "Certificate Name",
                            certNamePlaceholder: messages.profile.certNamePlaceholder ?? "Select or enter name",
                            score: messages.profile.certScore ?? "Score / Level",
                            scorePlaceholder: messages.profile.certScorePlaceholder ?? "e.g. N2, Band 7, 850",
                            issueDate: messages.profile.certIssueDate ?? "Issue Date",
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/80 px-4 py-6 text-sm text-muted-foreground">
                      {messages.profile.noCertifications ?? "No certifications added yet."}
                    </div>
                  )}
                </section>

                <Separator />

                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        {messages.register.skills}
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={draft.skillInput}
                          onChange={(e) => setField("skillInput", e.target.value)}
                          placeholder={messages.register.addSkillPlaceholder}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSkill();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addSkill}>
                          {messages.common.add}
                        </Button>
                      </div>
                      {draft.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {draft.skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="cursor-pointer gap-1"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="linkedin" className="text-sm font-medium">
                        {messages.register.linkedin}
                      </label>
                      <Input
                        id="linkedin"
                        type="text"
                        value={draft.linkedinUrl}
                        onChange={(e) => setField("linkedinUrl", e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="portfolio" className="text-sm font-medium">
                        {messages.register.portfolio}
                      </label>
                      <Input
                        id="portfolio"
                        type="text"
                        value={draft.portfolioUrl}
                        onChange={(e) => setField("portfolioUrl", e.target.value)}
                        placeholder="https://github.com/... or portfolio site"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label htmlFor="desc" className="text-sm font-medium">
                        {messages.register.aboutYou}
                      </label>
                      <textarea
                        id="desc"
                        value={draft.description}
                        onChange={(e) => setField("description", e.target.value)}
                        placeholder={messages.register.summaryPlaceholder}
                        rows={4}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </section>

                <Separator />

              </form>
            </CardContent>
          </Card>

          <Card className="print:hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-heading text-xl font-bold">
                    {messages.profile.cvExportTitle ?? "Export CV"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {messages.profile.cvExportSubtitle ??
                      "Generate a polished CV from your TECXWORK profile data."}
                  </p>
                </div>
              </div>
              <Button type="button" onClick={handleExportCv} className="shrink-0">
                <Download className="mr-2 h-4 w-4" />
                {messages.profile.cvExportButton ?? "Export PDF"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-lg bg-zinc-100 p-3">
                <div className="student-cv-preview-scale mx-auto">
                  <CvExportTemplate
                    draft={draft}
                    email={profileEmail}
                    labels={cvExportLabels}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {messages.profile.cvExportHint ??
                  "Your browser will open the print dialog. Choose Save as PDF to export."}
              </p>
            </CardContent>
          </Card>

        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
