"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { RecruiterJobPostingCard } from "@/components/recruiter-job-posting-card";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { ImageUpload, MultiImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getEmploymentTypeOptions,
  getLanguageRequirementOptions,
  getSalaryPeriodOptions,
  getSeniorityOptions,
  LANGUAGE_REQUIREMENT_VALUES,
  parseLanguageRequirementTokens,
  serializeLanguageRequirements,
  getVisaSupportOptions,
  getWorkplaceTypeOptions,
} from "@/lib/job-posting";
import { cn } from "@/lib/utils";

type Recruiter = {
  id: number;
  company: string;
  industry: string;
  description: string;
  contactEmail: string;
  interviewerCount: number;
  logoUrl: string | null;
  websiteUrl: string | null;
  galleryUrls: string[];
};

type JobOpening = {
  id: number;
  title: string;
  jdLink: string | null;
  location: string;
  employmentType: string;
  workplaceType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: string;
  seniority: string;
  languageRequirement: string;
  visaSupport: string;
  applicationDeadline: string | null;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  moderationStatus: string;
  moderationNotes: string;
};

type JobDraft = {
  title: string;
  jdLink: string;
  location: string;
  employmentType: string;
  workplaceType: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  salaryPeriod: string;
  seniority: string;
  languageRequirement: string;
  visaSupport: string;
  applicationDeadline: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
};

const EMPTY_JOB_DRAFT: JobDraft = {
  title: "",
  jdLink: "",
  location: "",
  employmentType: "",
  workplaceType: "",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "TWD",
  salaryPeriod: "month",
  seniority: "",
  languageRequirement: "",
  visaSupport: "",
  applicationDeadline: "",
  description: "",
  responsibilities: "",
  requirements: "",
  benefits: "",
};

let cachedRecruiterJobs: JobOpening[] | null = null;

function toNullableInt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  const rounded = Math.round(parsed);
  return rounded >= 0 ? rounded : null;
}

function toDraft(job: JobOpening): JobDraft {
  return {
    title: job.title ?? "",
    jdLink: job.jdLink ?? "",
    location: job.location ?? "",
    employmentType: job.employmentType ?? "",
    workplaceType: job.workplaceType ?? "",
    salaryMin: job.salaryMin !== null ? String(job.salaryMin) : "",
    salaryMax: job.salaryMax !== null ? String(job.salaryMax) : "",
    salaryCurrency: job.salaryCurrency || "TWD",
    salaryPeriod: job.salaryPeriod || "month",
    seniority: job.seniority ?? "",
    languageRequirement: job.languageRequirement ?? "",
    visaSupport: job.visaSupport ?? "",
    applicationDeadline: job.applicationDeadline ?? "",
    description: job.description ?? "",
    responsibilities: job.responsibilities ?? "",
    requirements: job.requirements ?? "",
    benefits: job.benefits ?? "",
  };
}

function buildJobPayload(draft: JobDraft) {
  return {
    title: draft.title.trim(),
    jdLink: draft.jdLink.trim() || null,
    location: draft.location.trim(),
    employmentType: draft.employmentType,
    workplaceType: draft.workplaceType,
    salaryMin: toNullableInt(draft.salaryMin),
    salaryMax: toNullableInt(draft.salaryMax),
    salaryCurrency: draft.salaryCurrency.trim().toUpperCase() || "TWD",
    salaryPeriod: draft.salaryPeriod,
    seniority: draft.seniority,
    languageRequirement: draft.languageRequirement.trim(),
    visaSupport: draft.visaSupport,
    applicationDeadline: draft.applicationDeadline.trim() || null,
    description: draft.description.trim(),
    responsibilities: draft.responsibilities.trim(),
    requirements: draft.requirements.trim(),
    benefits: draft.benefits.trim(),
  };
}

function getSelectedLanguageValues(value: string, locale: "en" | "zh-TW") {
  return parseLanguageRequirementTokens(value, locale)
    .filter((item) => item.preset && LANGUAGE_REQUIREMENT_VALUES.has(item.key))
    .map((item) => item.key);
}

function getCustomLanguageText(value: string, locale: "en" | "zh-TW") {
  return parseLanguageRequirementTokens(value, locale)
    .filter((item) => !item.preset)
    .map((item) => item.label)
    .join(", ");
}

export function RecruiterCompanyTab({
  recruiter,
  section = "company",
  jobModerationEnabled = true,
}: {
  recruiter: Recruiter;
  section?: "company" | "jobs";
  jobModerationEnabled?: boolean;
}) {
  const { messages, locale } = useRecruiterI18n();
  const router = useRouter();
  const [description, setDescription] = useState(recruiter.description);
  const [websiteUrl, setWebsiteUrl] = useState(recruiter.websiteUrl ?? "");
  const [interviewerCount, setInterviewerCount] = useState(
    recruiter.interviewerCount
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(recruiter.logoUrl);
  const [galleryUrls, setGalleryUrls] = useState<string[]>(recruiter.galleryUrls ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [newJobDraft, setNewJobDraft] = useState<JobDraft>(EMPTY_JOB_DRAFT);
  const [selectedJobId, setSelectedJobId] = useState<number | "new" | null>("new");
  const [editJobDraft, setEditJobDraft] = useState<JobDraft>(EMPTY_JOB_DRAFT);
  const [jobError, setJobError] = useState("");

  useEffect(() => {
    if (section !== "jobs") {
      setLoadingJobs(false);
      return;
    }

    if (cachedRecruiterJobs) {
      setJobs(cachedRecruiterJobs);
      setLoadingJobs(false);
      return;
    }

    fetch("/api/me/jobs")
      .then((response) => response.json())
      .then((data) => {
        const nextJobs = data.jobs ?? [];
        cachedRecruiterJobs = nextJobs;
        setJobs(nextJobs);
        if (nextJobs.length > 0) {
          setSelectedJobId(nextJobs[0].id);
          setEditJobDraft(toDraft(nextJobs[0]));
        }
      })
      .finally(() => setLoadingJobs(false));
  }, [section]);

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/me/recruiter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          websiteUrl: websiteUrl.trim() || null,
          interviewerCount,
          logoUrl,
          galleryUrls,
        }),
      });
      if (!res.ok) throw new Error(messages.dashboard.company.saveFailed);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : messages.dashboard.company.errorFallback
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddJob(e: React.FormEvent) {
    e.preventDefault();
    const payload = buildJobPayload(newJobDraft);
    if (!payload.title || !payload.location || !payload.employmentType) {
      setJobError("Please fill in title, location, and employment type.");
      return;
    }

    setJobError("");
    const res = await fetch("/api/me/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setJobs((current) => {
        const nextJobs = [...current, data.job];
        cachedRecruiterJobs = nextJobs;
        return nextJobs;
      });
      setNewJobDraft(EMPTY_JOB_DRAFT);
    } else {
      const data = await res.json().catch(() => ({}));
      setJobError(data.error || "Failed to create job");
    }
  }

  async function handleUpdateJob(id: number) {
    const payload = buildJobPayload(editJobDraft);
    if (!payload.title || !payload.location || !payload.employmentType) {
      setJobError("Please fill in title, location, and employment type.");
      return;
    }

    setJobError("");
    const res = await fetch(`/api/me/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setJobs((current) => {
        const nextJobs = current.map((job) => (job.id === id ? data.job : job));
        cachedRecruiterJobs = nextJobs;
        return nextJobs;
      });
    } else {
      const data = await res.json().catch(() => ({}));
      setJobError(data.error || "Failed to update job");
    }
  }

  async function handleDeleteJob(id: number) {
    if (!confirm(messages.dashboard.company.removePositionConfirm)) return;
    await fetch(`/api/me/jobs/${id}`, { method: "DELETE" });
    setJobs((current) => {
      const nextJobs = current.filter((job) => job.id !== id);
      cachedRecruiterJobs = nextJobs;
      return nextJobs;
    });
    if (selectedJobId === id) {
      setSelectedJobId("new");
      setNewJobDraft(EMPTY_JOB_DRAFT);
    }
  }

  async function handleSubmitJob(id: number) {
    setJobError("");
    const res = await fetch(`/api/me/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit" }),
    });
    if (res.ok) {
      const data = await res.json();
      setJobs((current) => {
        const nextJobs = current.map((job) => (job.id === id ? data.job : job));
        cachedRecruiterJobs = nextJobs;
        return nextJobs;
      });
    } else {
      const data = await res.json().catch(() => ({}));
      setJobError(data.error || "Failed to submit job");
    }
  }

  const statusLabel: Record<string, string> = {
    draft: messages.dashboard.company.moderationStatus.draft,
    pending_review: messages.dashboard.company.moderationStatus.pendingReview,
    approved: messages.dashboard.company.moderationStatus.approved,
    rejected: messages.dashboard.company.moderationStatus.rejected,
  };

  // Design system status colors
  const statusClassName: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    pending_review: "bg-[#FF9500]/15 text-[#FF9500]", // WARNING orange
    approved: "bg-[#30D158]/15 text-[#30D158]", // SUCCESS green
    rejected: "bg-[#D70015]/15 text-[#D70015]", // DESTRUCTIVE red
  };

  function renderJobForm({
    draft,
    onChange,
    submitLabel,
    onSubmit,
    submitButtonType = "button",
    showPlusIcon = true,
  }: {
    draft: JobDraft;
    onChange: (field: keyof JobDraft, value: string) => void;
    submitLabel: string;
    onSubmit?: () => void;
    submitButtonType?: "button" | "submit";
    showPlusIcon?: boolean;
  }) {
    const companyMessages = messages.dashboard.company;
    const languageOptions = getLanguageRequirementOptions(locale);
    const selectedLanguageValues = new Set(
      getSelectedLanguageValues(draft.languageRequirement, locale)
    );
    const customLanguageText = getCustomLanguageText(draft.languageRequirement, locale);

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.positionTitle}
          </label>
          <Input
            value={draft.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder={companyMessages.positionTitle}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.location}
          </label>
          <Input
            value={draft.location}
            onChange={(e) => onChange("location", e.target.value)}
            placeholder={companyMessages.locationPlaceholder}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.employmentType}
          </label>
          <select
            value={draft.employmentType}
            onChange={(e) => onChange("employmentType", e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            required
          >
            <option value="">{companyMessages.employmentType}</option>
            {getEmploymentTypeOptions(locale).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.workplaceType}
          </label>
          <select
            value={draft.workplaceType}
            onChange={(e) => onChange("workplaceType", e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">{companyMessages.workplaceType}</option>
            {getWorkplaceTypeOptions(locale).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.salaryMin}
          </label>
          <Input
            value={draft.salaryMin}
            onChange={(e) => onChange("salaryMin", e.target.value)}
            placeholder={companyMessages.salaryMin}
            inputMode="numeric"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.salaryMax}
          </label>
          <Input
            value={draft.salaryMax}
            onChange={(e) => onChange("salaryMax", e.target.value)}
            placeholder={companyMessages.salaryMax}
            inputMode="numeric"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.salaryCurrency}
          </label>
          <Input
            value={draft.salaryCurrency}
            onChange={(e) => onChange("salaryCurrency", e.target.value)}
            placeholder={companyMessages.salaryCurrencyPlaceholder}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.salaryPeriod}
          </label>
          <select
            value={draft.salaryPeriod}
            onChange={(e) => onChange("salaryPeriod", e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            {getSalaryPeriodOptions(locale).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.seniority}
          </label>
          <select
            value={draft.seniority}
            onChange={(e) => onChange("seniority", e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">{companyMessages.seniority}</option>
            {getSeniorityOptions(locale).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.applicationDeadline}
          </label>
          <Input
            value={draft.applicationDeadline}
            onChange={(e) => onChange("applicationDeadline", e.target.value)}
            type="date"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.visaSupport}
          </label>
          <select
            value={draft.visaSupport}
            onChange={(e) => onChange("visaSupport", e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">{companyMessages.visaSupport}</option>
            {getVisaSupportOptions(locale).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.languageRequirement}
          </label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {languageOptions.map((option) => {
                const selected = selectedLanguageValues.has(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      const nextSelected = new Set(selectedLanguageValues);
                      if (selected) {
                        nextSelected.delete(option.value);
                      } else {
                        nextSelected.add(option.value);
                      }
                      onChange(
                        "languageRequirement",
                        serializeLanguageRequirements(
                          Array.from(nextSelected),
                          customLanguageText
                        )
                      );
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <Input
              value={customLanguageText}
              onChange={(e) =>
                onChange(
                  "languageRequirement",
                  serializeLanguageRequirements(
                    Array.from(selectedLanguageValues),
                    e.target.value
                  )
                )
              }
              placeholder={companyMessages.languageRequirementPlaceholder}
            />
          </div>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.jdLinkOptional}
          </label>
          <Input
            value={draft.jdLink}
            onChange={(e) => onChange("jdLink", e.target.value)}
            placeholder={companyMessages.jdLinkOptional}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.summary}
          </label>
          <textarea
            value={draft.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder={companyMessages.descriptionPlaceholder}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.responsibilities}
          </label>
          <textarea
            value={draft.responsibilities}
            onChange={(e) => onChange("responsibilities", e.target.value)}
            placeholder={companyMessages.responsibilitiesPlaceholder}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.requirements}
          </label>
          <textarea
            value={draft.requirements}
            onChange={(e) => onChange("requirements", e.target.value)}
            placeholder={companyMessages.requirementsPlaceholder}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.benefits}
          </label>
          <textarea
            value={draft.benefits}
            onChange={(e) => onChange("benefits", e.target.value)}
            placeholder={companyMessages.benefitsPlaceholder}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <Button
          type={submitButtonType}
          size="sm"
          className="mt-4 sm:col-span-2"
          disabled={
            !draft.title.trim() ||
            !draft.location.trim() ||
            !draft.employmentType
          }
          onClick={onSubmit}
        >
          {showPlusIcon ? <Plus className="mr-1 h-3.5 w-3.5" /> : null}
          {submitLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {section === "company" ? (
        <>
          <Card>
            <CardHeader>
              <h2 className="font-heading text-lg font-semibold">
                {recruiter.company}
              </h2>
              <p className="text-xs text-muted-foreground">
                {recruiter.industry} · {recruiter.contactEmail}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Company Logo</label>
                  <ImageUpload
                    value={logoUrl ?? undefined}
                    onChange={setLogoUrl}
                    type="logo"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Gallery Photos</label>
                  <p className="text-xs text-muted-foreground">Upload up to 4 photos to showcase your company</p>
                  <MultiImageUpload
                    values={galleryUrls}
                    onChange={setGalleryUrls}
                    type="gallery"
                    max={4}
                  />
                </div>

                {/* Preview: How students will see your company */}
                {(logoUrl || galleryUrls.length > 0) && (
                  <div className="space-y-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                    <p className="text-xs font-medium text-primary">Preview: How students see your company</p>
                    <div className="flex items-start gap-3">
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
                        {logoUrl ? (
                          <Image
                            src={logoUrl}
                            alt={recruiter.company}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-heading text-base font-semibold">{recruiter.company}</p>
                        <p className="text-xs text-muted-foreground">{recruiter.industry}</p>
                      </div>
                    </div>
                    {galleryUrls.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {galleryUrls.slice(0, 4).map((url, index) => (
                          <div
                            key={index}
                            className="relative aspect-[4/3] overflow-hidden rounded-lg bg-secondary"
                          >
                            <Image
                              src={url}
                              alt={`${recruiter.company} photo ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, 25vw"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="desc" className="text-sm font-medium">
                    {messages.dashboard.company.companyDescription}
                  </label>
                  <textarea
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={messages.dashboard.company.whatDoesCompanyDo}
                    rows={3}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="website" className="text-sm font-medium">
                    {messages.dashboard.company.websiteUrl}
                  </label>
                  <Input
                    id="website"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://company.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ic" className="text-sm font-medium">
                    {messages.dashboard.company.interviewerCount}
                  </label>
                  <Input
                    id="ic"
                    type="number"
                    min={1}
                    max={10}
                    value={interviewerCount}
                    onChange={(e) =>
                      setInterviewerCount(
                        Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {messages.dashboard.company.interviewerHintPrefix}
                    {interviewerCount}
                    {messages.dashboard.company.interviewerHintMiddle}
                    {interviewerCount > 1
                      ? messages.dashboard.company.interviewerHintPlural
                      : ""}
                    {messages.dashboard.company.interviewerHintSuffix}
                    {interviewerCount}
                    {messages.dashboard.company.interviewerHintTail}
                  </p>
                </div>
                {error ? <p className="text-xs text-destructive">{error}</p> : null}
                {saved ? (
                  <p className="text-xs text-green-600">
                    {messages.dashboard.company.saved}
                  </p>
                ) : null}
                <Button type="submit" disabled={saving} size="sm">
                  {saving ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      {messages.dashboard.company.saving}
                    </>
                  ) : (
                    messages.dashboard.company.saveCompanyInfo
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      ) : null}

      {section === "jobs" ? (
        <div className="flex flex-col items-start gap-6 md:flex-row">
          {/* LEFT COLUMN: List */}
          <div className="w-full shrink-0 space-y-4 md:w-1/3">
            <div className="space-y-1.5">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                {messages.dashboard.company.jobOpenings}
              </h1>
              <p className="text-sm text-muted-foreground">
                {messages.dashboard.company.jobOpeningsHint}
              </p>
            </div>

            <Button
              className="w-full justify-start"
              variant={selectedJobId === "new" ? "default" : "outline"}
              onClick={() => {
                setSelectedJobId("new");
                setNewJobDraft(EMPTY_JOB_DRAFT);
                setJobError("");
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {messages.dashboard.company.add}
            </Button>

            {loadingJobs ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : jobs.length > 0 ? (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setEditJobDraft(toDraft(job));
                      setJobError("");
                    }}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors",
                      selectedJobId === job.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{job.title || "Untitled Position"}</p>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {job.location} • {getEmploymentTypeOptions(locale).find(o => o.value === job.employmentType)?.label || job.employmentType}
                    </p>
                    <div className="mt-2">
                      <span
                        className={cn(
                          "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          statusClassName[job.moderationStatus] ?? "bg-muted text-muted-foreground"
                        )}
                      >
                        {statusLabel[job.moderationStatus] ?? job.moderationStatus}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {messages.dashboard.company.noPositions}
              </p>
            )}
          </div>

          {/* RIGHT COLUMN: Editor */}
          <div className="w-full overflow-hidden rounded-xl border bg-card p-4 shadow-sm sm:p-6 md:flex-1">
            {selectedJobId === "new" ? (
              <div className="space-y-4">
                <div className="mb-4 border-b pb-4">
                  <h2 className="text-lg font-semibold">{messages.dashboard.company.add}</h2>
                </div>
                <form onSubmit={handleAddJob}>
                  {renderJobForm({
                    draft: newJobDraft,
                    onChange: (field, value) =>
                      setNewJobDraft((current) => ({ ...current, [field]: value })),
                    submitLabel: messages.dashboard.company.add,
                    submitButtonType: "submit",
                    showPlusIcon: true,
                  })}
                </form>
                {jobError ? <p className="mt-2 text-xs text-destructive">{jobError}</p> : null}
              </div>
            ) : typeof selectedJobId === "number" ? (
              <div className="space-y-4">
                <div className="mb-4 flex items-center justify-between gap-4 border-b pb-4">
                  <h2 className="truncate text-lg font-semibold">
                    Edit {jobs.find((j) => j.id === selectedJobId)?.title}
                  </h2>
                  <div className="flex shrink-0 items-center gap-2">
                    {jobModerationEnabled &&
                    jobs.find((j) => j.id === selectedJobId)?.moderationStatus !==
                      "pending_review" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSubmitJob(selectedJobId)}
                      >
                        {messages.dashboard.company.submitForReview}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteJob(selectedJobId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {jobs.find((j) => j.id === selectedJobId)?.moderationNotes ? (
                  <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                    <span className="font-semibold">
                      {messages.dashboard.company.adminNotePrefix}
                    </span>{" "}
                    {jobs.find((j) => j.id === selectedJobId)?.moderationNotes}
                  </div>
                ) : null}

                {renderJobForm({
                  draft: editJobDraft,
                  onChange: (field, value) =>
                    setEditJobDraft((current) => ({ ...current, [field]: value })),
                  submitLabel: messages.common.save,
                  onSubmit: () => void handleUpdateJob(selectedJobId),
                  submitButtonType: "button",
                  showPlusIcon: false,
                })}
                {jobError ? <p className="mt-2 text-xs text-destructive">{jobError}</p> : null}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                Select a job to edit, or create a new one.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
