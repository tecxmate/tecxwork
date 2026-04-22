"use client";

import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Check,
  CheckCircle2,
  GraduationCap,
  Loader2,
  LogOut,
  Plus,
  Search,
  User,
  X,
  AlertCircle,
  BriefcaseBusiness,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AppTopBar } from "@/components/app-topbar";
import { QRCard } from "@/components/qr-code";
import { SiteFooter } from "@/components/site-footer";
import {
  EMPTY_STUDENT_REGISTRATION_DRAFT,
  EMPTY_STUDENT_WORK_EXPERIENCE,
  JOB_SEEKING_STATUS_OPTIONS,
  MAX_STUDENT_WORK_EXPERIENCES,
  PREFERRED_INDUSTRY_OPTIONS,
  PREFERRED_LOCATION_OPTIONS,
  STUDY_LEVEL_OPTIONS,
  STUDY_YEAR_OPTIONS,
  WORK_AUTHORIZATION_OPTIONS,
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
    cvLink: profile.cvLink ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
    portfolioUrl: profile.portfolioUrl ?? "",
    description: profile.description ?? "",
  };
}

const WorkExperienceEditor = memo(function WorkExperienceEditor({
  experience,
  index,
  onRemove,
  onUpdate,
}: {
  experience: StudentWorkExperience;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: <K extends keyof StudentWorkExperience>(
    index: number,
    field: K,
    value: StudentWorkExperience[K]
  ) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Experience {index + 1}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
          Remove
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Company</label>
          <Input
            value={experience.company}
            onChange={(e) => onUpdate(index, "company", e.target.value)}
            placeholder="e.g. TSMC"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Job Title</label>
          <Input
            value={experience.title}
            onChange={(e) => onUpdate(index, "title", e.target.value)}
            placeholder="e.g. Data Analyst Intern"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Employment Type</label>
          <Input
            value={experience.employmentType}
            onChange={(e) => onUpdate(index, "employmentType", e.target.value)}
            placeholder="Internship, Part-time, Full-time"
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
            I currently work here
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Start Date</label>
          <Input
            type="month"
            value={experience.startDate}
            onChange={(e) => onUpdate(index, "startDate", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">End Date</label>
          <Input
            type="month"
            value={experience.endDate}
            onChange={(e) => onUpdate(index, "endDate", e.target.value)}
            disabled={experience.isCurrent}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Summary</label>
          <textarea
            value={experience.description}
            onChange={(e) => onUpdate(index, "description", e.target.value)}
            rows={3}
            placeholder="Briefly describe your responsibilities, projects, or impact."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
});

export default function ProfilePage() {
  const router = useRouter();
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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  useEffect(() => {
    fetch("/api/me/profile")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load profile");
        return r.json();
      })
      .then((data) => {
        const profile = data.profile as ProfileResponse;
        setProfileEmail(profile.email ?? "");
        setDraft(profileToDraft(profile));
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    fetch("/api/taiwan-schools")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load school list");
        }

        return response.json();
      })
      .then((data) => {
        const nextSchools = Array.isArray(data.schools) ? data.schools : [];
        setSchools(nextSchools);
        setSchoolsError(
          nextSchools.length === 0
            ? "School list is empty right now. You can still type your school manually."
            : ""
        );
      })
      .catch(() => {
        setSchools([]);
        setSchoolsError(
          "School list failed to load. You can still type your school manually."
        );
      })
      .finally(() => setSchoolsLoading(false));
  }, []);

  const schoolLabelToOption = useMemo(() => {
    return new Map(schools.map((school) => [school.label, school]));
  }, [schools]);

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
    const matched = schoolLabelToOption.get(trimmedValue);

    if (matched) {
      setDraft((current) => ({
        ...current,
        schoolQuery: trimmedValue,
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          cvLink: draft.cvLink.trim(),
          linkedinUrl: draft.linkedinUrl.trim(),
          portfolioUrl: draft.portfolioUrl.trim(),
          description: draft.description.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }

      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppTopBar />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl space-y-4">
          {draft.cvLink && (
            <QRCard
              value={draft.cvLink}
              title="My CV QR Code"
              subtitle="Show this to recruiters at the event — they scan to view your CV"
              size={160}
            />
          )}

          <Card>
            <CardHeader className="items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="font-heading text-xl font-bold">My Profile</h1>
              <p className="text-xs text-muted-foreground">{profileEmail}</p>
              <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Log out
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-sm font-medium">
                        Full Name
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
                        Phone / WhatsApp
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
                        Nationality
                      </label>
                      <Input
                        id="nationality"
                        value={draft.nationality}
                        onChange={(e) => setField("nationality", e.target.value)}
                        placeholder="e.g. Vietnamese"
                      />
                    </div>
                  </div>
                </section>

                <Separator />

                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label htmlFor="cv-link" className="text-sm font-medium">
                        CV Link (Google Drive) <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="cv-link"
                        type="url"
                        required
                        value={draft.cvLink}
                        onChange={(e) => setField("cvLink", e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Share a public or recruiter-accessible Google Drive CV link so companies can review it.
                      </p>
                    </div>
                  </div>
                </section>

                <Separator />

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <h2 className="font-heading text-lg font-semibold">Education</h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label htmlFor="school" className="text-sm font-medium">
                        School in Taiwan <span className="text-destructive">*</span>
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
                              ? "Loading Taiwan schools..."
                              : "Search by Chinese, English, city, or school code"
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
                                No matching school found. You can keep typing to use a custom school name.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Search and pick from the dropdown when available. If your school is missing, type it manually and continue.
                      </p>
                      {schoolsError && (
                        <p className="text-xs text-amber-600">{schoolsError}</p>
                      )}
                      {draft.schoolName && (
                        <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                          Saved school: <span className="font-medium text-foreground">{draft.schoolName}</span>
                          {draft.schoolNameEn ? ` / ${draft.schoolNameEn}` : " (custom entry)"}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="major" className="text-sm font-medium">
                        Major / Department <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="major"
                        required
                        value={draft.major}
                        onChange={(e) => setField("major", e.target.value)}
                        placeholder="e.g. Computer Science"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="study-level" className="text-sm font-medium">
                        Study Level <span className="text-destructive">*</span>
                      </label>
                      <select
                        id="study-level"
                        value={draft.studyLevel}
                        onChange={(e) => setField("studyLevel", e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        required
                      >
                        <option value="">Select study level</option>
                        {STUDY_LEVEL_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="study-year" className="text-sm font-medium">
                        Current Year / Status
                      </label>
                      <select
                        id="study-year"
                        value={draft.studyYear}
                        onChange={(e) => setField("studyYear", e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select current year</option>
                        {STUDY_YEAR_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="graduation-date" className="text-sm font-medium">
                        Expected Graduation Date <span className="text-destructive">*</span>
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
                    <h2 className="font-heading text-lg font-semibold">Career Preferences</h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="job-seeking" className="text-sm font-medium">
                        Job Search Status
                      </label>
                      <select
                        id="job-seeking"
                        value={draft.jobSeekingStatus}
                        onChange={(e) => setField("jobSeekingStatus", e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select status</option>
                        {JOB_SEEKING_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="work-auth" className="text-sm font-medium">
                        Work Authorization
                      </label>
                      <select
                        id="work-auth"
                        value={draft.workAuthorization}
                        onChange={(e) => setField("workAuthorization", e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select work authorization</option>
                        {WORK_AUTHORIZATION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preferred Work Locations</label>
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
                            {location}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preferred Industries</label>
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
                            {industry}
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
                      <h2 className="font-heading text-lg font-semibold">Work Experience</h2>
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
                      Add experience
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional. Add up to {MAX_STUDENT_WORK_EXPERIENCES} internships, part-time roles, or full-time experiences.
                  </p>

                  {draft.workExperiences.length > 0 ? (
                    <div className="space-y-4">
                      {draft.workExperiences.map((experience, index) => (
                        <WorkExperienceEditor
                          key={`${index}-${experience.company}-${experience.title}`}
                          index={index}
                          experience={experience}
                          onRemove={removeWorkExperience}
                          onUpdate={updateWorkExperience}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/80 px-4 py-6 text-sm text-muted-foreground">
                      No work experience added yet. This section is optional.
                    </div>
                  )}
                </section>

                <Separator />

                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Skills</label>
                      <div className="flex gap-2">
                        <Input
                          value={draft.skillInput}
                          onChange={(e) => setField("skillInput", e.target.value)}
                          placeholder="Add a skill and press Enter"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSkill();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={addSkill}>
                          Add
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
                        LinkedIn
                      </label>
                      <Input
                        id="linkedin"
                        type="url"
                        value={draft.linkedinUrl}
                        onChange={(e) => setField("linkedinUrl", e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="portfolio" className="text-sm font-medium">
                        Portfolio / GitHub
                      </label>
                      <Input
                        id="portfolio"
                        type="url"
                        value={draft.portfolioUrl}
                        onChange={(e) => setField("portfolioUrl", e.target.value)}
                        placeholder="https://github.com/... or portfolio site"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label htmlFor="desc" className="text-sm font-medium">
                        About You
                      </label>
                      <textarea
                        id="desc"
                        value={draft.description}
                        onChange={(e) => setField("description", e.target.value)}
                        placeholder="Share your career goals, project experience, and what kind of roles you want recruiters to consider you for."
                        rows={4}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </section>

                <Separator />

                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {saved && (
                  <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Profile updated!
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    saving ||
                    !draft.name.trim() ||
                    !draft.cvLink.trim() ||
                    !draft.schoolName.trim() ||
                    !draft.major.trim() ||
                    !draft.studyLevel ||
                    !draft.expectedGraduation
                  }
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
