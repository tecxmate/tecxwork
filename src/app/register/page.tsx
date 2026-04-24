"use client";

import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  AlertCircle,
  UserPlus,
  X,
  Mail,
  Save,
  GraduationCap,
  Building2,
  Search,
  Check,
  BriefcaseBusiness,
  Plus,
} from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EVENT_CONFIG } from "@/lib/data";
import {
  EMPTY_STUDENT_REGISTRATION_DRAFT,
  EMPTY_STUDENT_WORK_EXPERIENCE,
  JOB_SEEKING_STATUS_OPTIONS,
  MAX_STUDENT_WORK_EXPERIENCES,
  PREFERRED_INDUSTRY_OPTIONS,
  PREFERRED_LOCATION_OPTIONS,
  STUDENT_REGISTRATION_DRAFT_KEY,
  STUDY_LEVEL_OPTIONS,
  STUDY_YEAR_OPTIONS,
  WORK_AUTHORIZATION_OPTIONS,
  type StudentRegistrationDraft,
  type StudentWorkExperience,
  type TaiwanSchoolOption,
} from "@/lib/student-profile";
import { SiteFooter } from "@/components/site-footer";
import { useStudentI18n } from "@/components/student-locale-provider";
import { StudentLanguageSwitcher } from "@/components/student-language-switcher";
import { interpolate } from "@/lib/student-messages";

type Step = "form" | "availability" | "done";

const RegisterWorkExperienceEditor = memo(function RegisterWorkExperienceEditor({
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

export default function RegisterPage() {
  const router = useRouter();
  const { messages } = useStudentI18n();
  const [step, setStep] = useState<Step>("form");
  const [onboardingMode, setOnboardingMode] = useState<"minimal" | "full">("full");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [profileId, setProfileId] = useState<number | null>(null);
  const [schools, setSchools] = useState<TaiwanSchoolOption[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schoolsError, setSchoolsError] = useState("");
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const [draft, setDraft] = useState<StudentRegistrationDraft>(
    EMPTY_STUDENT_REGISTRATION_DRAFT
  );
  const [draftRestored, setDraftRestored] = useState(false);
  const deferredSchoolQuery = useDeferredValue(draft.schoolQuery);

  useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(STUDENT_REGISTRATION_DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft) as Partial<StudentRegistrationDraft>;
        setDraft({
          ...EMPTY_STUDENT_REGISTRATION_DRAFT,
          ...parsed,
        });
        setDraftRestored(true);
      }
    } catch {
      // ignore corrupted drafts
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(
        STUDENT_REGISTRATION_DRAFT_KEY,
        JSON.stringify(draft)
      );
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [draft]);

  useEffect(() => {
    fetch("/api/admin/mode")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(messages.register.failedOnboardingMode);
        }

        return response.json();
      })
      .then((data) => {
        setOnboardingMode(data.onboardingMode === "minimal" ? "minimal" : "full");
      })
      .catch(() => {
        setOnboardingMode("full");
      });
  }, [messages.register.failedOnboardingMode]);

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
        const haystacks = [
          school.label,
          school.nameZh,
          school.nameEn,
          school.city,
          school.code,
          ...(school.aliases ?? []),
        ];

        return haystacks.some((value) => value.toLowerCase().includes(query));
      })
      .slice(0, 8);
  }, [deferredSchoolQuery, schools]);

  const isMinimalOnboarding = onboardingMode === "minimal";

  const canSubmit =
    draft.name.trim() &&
    draft.email.trim() &&
    password.length >= 6 &&
    draft.cvLink.trim() &&
    (isMinimalOnboarding ||
      (draft.schoolName.trim() &&
        draft.major.trim() &&
        draft.studyLevel &&
        draft.expectedGraduation)) &&
    draft.pipaConsent;

  function setField<K extends keyof StudentRegistrationDraft>(
    field: K,
    value: StudentRegistrationDraft[K]
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function clearDraft() {
    setDraft(EMPTY_STUDENT_REGISTRATION_DRAFT);
    window.localStorage.removeItem(STUDENT_REGISTRATION_DRAFT_KEY);
    setDraftRestored(false);
  }

  function addSkill() {
    const skill = draft.skillInput.trim();
    if (skill && !draft.skills.includes(skill)) {
      setField("skills", [...draft.skills, skill]);
    }
    setField("skillInput", "");
  }

  function removeSkill(skill: string) {
    setField(
      "skills",
      draft.skills.filter((item) => item !== skill)
    );
  }

  function toggleArrayField(
    field: "preferredLocations" | "preferredIndustries",
    value: string
  ) {
    const current = draft[field];
    setField(
      field,
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  function handleSchoolQueryChange(value: string) {
    const trimmedValue = value.trim();
    setSchoolDropdownOpen(true);
    setField("schoolQuery", value);
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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          email: draft.email.trim(),
          password,
          phone: draft.phone.trim(),
          nationality: draft.nationality.trim(),
          schoolCode: draft.schoolCode,
          schoolName: draft.schoolName,
          schoolNameEn: draft.schoolNameEn,
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
          pipaConsent: true,
          wantsNewsletter: draft.wantsNewsletter,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || messages.register.registrationFailed);

      clearDraft();
      setPassword("");
      setProfileId(data.profile.id);
      setStep("availability");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : messages.register.somethingWentWrong
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSlots() {
    if (!profileId) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/applicant-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: "2026-06-06",
          startHour: 10,
          endHour: 17,
          durationMinutes: 15,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || messages.register.somethingWentWrong);

      setStep("done");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : messages.register.somethingWentWrong
      );
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="font-heading text-xl font-semibold">
              {messages.register.registrationComplete}
            </h2>
            <p className="text-sm text-muted-foreground">
              {messages.register.registrationDoneBody}
            </p>
            <Separator />
            <p className="text-xs text-muted-foreground">
              {messages.register.registrationDoneHint}
            </p>
            <Button onClick={() => router.push("/browse")} className="mt-2">
              {messages.common.browseCompanies}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "availability") {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center gap-2">
            <h2 className="font-heading text-xl font-semibold">
              {messages.register.setAvailabilityTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {interpolate(messages.register.setAvailabilityBody, {
                date: EVENT_CONFIG.displayDate,
              })}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <Button
              onClick={handleCreateSlots}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {messages.register.creatingSlots}
                </>
              ) : (
                messages.register.createAvailability
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep("done")}
              className="w-full"
            >
              {messages.register.skipForNow}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-card/80">
        <div className="h-[env(safe-area-inset-top)] bg-primary md:hidden" />
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {messages.common.back}
          </Link>
          <div className="ml-auto">
            <StudentLanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader className="items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <UserPlus className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="font-heading text-xl font-bold">
                {messages.register.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isMinimalOnboarding
                  ? messages.register.minimalSubtitle
                  : messages.register.fullSubtitle}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-6">
                {draftRestored && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
                    <Save className="h-4 w-4 shrink-0" />
                    {messages.register.draftRestored}
                  </div>
                )}

                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <h2 className="font-heading text-lg font-semibold">
                      {messages.register.accountSection}
                    </h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-sm font-medium">
                        {messages.register.fullName}{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="name"
                        required
                        value={draft.name}
                        onChange={(e) => setField("name", e.target.value)}
                        placeholder={messages.register.fullName}
                        autoComplete="name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="reg-email" className="text-sm font-medium">
                        {messages.login.email}{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="reg-email"
                        type="email"
                        required
                        value={draft.email}
                        onChange={(e) => setField("email", e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="reg-password" className="text-sm font-medium">
                        {messages.login.password}{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <PasswordInput
                        id="reg-password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                      />
                    </div>

                    {!isMinimalOnboarding && (
                      <>
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
                      </>
                    )}
                  </div>
                </section>

                <Separator />

                <section className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label htmlFor="cv-link" className="text-sm font-medium">
                        {messages.register.cvLink}{" "}
                        <span className="text-destructive">*</span>
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
                        {messages.register.cvHint}
                      </p>
                    </div>
                  </div>
                </section>

                {!isMinimalOnboarding && (
                  <>
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
                              ? messages.register.loadingSchoolPlaceholder
                              : messages.register.searchSchoolPlaceholder
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
                                {messages.register.noSchoolMatch}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {messages.register.schoolSearchHint}
                      </p>
                      {schoolsError && (
                        <p className="text-xs text-amber-600">
                          {schoolsError}
                        </p>
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
                        <RegisterWorkExperienceEditor
                          key={`${index}-${experience.company}-${experience.title}`}
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
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addSkill}
                        >
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
                        type="url"
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
                        type="url"
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
                  </>
                )}

                <Separator />

                <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <input
                    id="pipa"
                    type="checkbox"
                    checked={draft.pipaConsent}
                    onChange={(e) => setField("pipaConsent", e.target.checked)}
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border accent-primary"
                    required
                  />
                  <label
                    htmlFor="pipa"
                    className="cursor-pointer text-xs leading-relaxed text-muted-foreground"
                  >
                    <ShieldCheck className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-primary" />
                    {messages.register.consentText}
                  </label>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                  {messages.register.legalNotice}
                </div>

                {EVENT_CONFIG.enableNewsletterOptIn && (
                  <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <input
                      id="newsletter"
                      type="checkbox"
                      checked={draft.wantsNewsletter}
                      onChange={(e) => setField("wantsNewsletter", e.target.checked)}
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border accent-primary"
                    />
                    <label
                      htmlFor="newsletter"
                      className="cursor-pointer text-xs leading-relaxed text-muted-foreground"
                    >
                      <Mail className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-muted-foreground" />
                      {messages.register.newsletter}
                    </label>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={!canSubmit || loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {messages.register.registering}
                      </>
                    ) : (
                      messages.common.signUp
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearDraft}
                  >
                    {messages.common.clearDraft}
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  {messages.register.alreadyHaveAccount}{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    {messages.common.logIn}
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
