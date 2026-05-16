"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";

import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { ImageUpload, MultiImageUpload } from "@/components/image-upload";
import { BulletTextarea } from "@/components/bullet-textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getEmploymentTypeOptions,
  getLanguageRequirementOptions,
  getSalaryCurrencyOptions,
  getSalaryPeriodOptions,
  getSeniorityOptions,
  LANGUAGE_REQUIREMENT_VALUES,
  normalizeSalaryCurrency,
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

type SaveStatus = "idle" | "saving" | "saved" | "error";
type StatusStripAction = {
  label: string;
  form?: string;
  onClick?: () => void;
  disabled: boolean;
  loading: boolean;
  saved: boolean;
  tone: "saved" | "unsaved" | "saving" | "error";
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

function toDraft(job: JobOpening, salaryCurrencyOptions?: string[]): JobDraft {
  return {
    title: job.title ?? "",
    jdLink: job.jdLink ?? "",
    location: job.location ?? "",
    employmentType: job.employmentType ?? "",
    workplaceType: job.workplaceType ?? "",
    salaryMin: job.salaryMin !== null ? String(job.salaryMin) : "",
    salaryMax: job.salaryMax !== null ? String(job.salaryMax) : "",
    salaryCurrency: normalizeSalaryCurrency(
      job.salaryCurrency,
      salaryCurrencyOptions
    ),
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

function buildJobPayload(draft: JobDraft, salaryCurrencyOptions?: string[]) {
  return {
    title: draft.title.trim(),
    jdLink: draft.jdLink.trim() || null,
    location: draft.location.trim(),
    employmentType: draft.employmentType,
    workplaceType: draft.workplaceType,
    salaryMin: toNullableInt(draft.salaryMin),
    salaryMax: toNullableInt(draft.salaryMax),
    salaryCurrency: normalizeSalaryCurrency(
      draft.salaryCurrency,
      salaryCurrencyOptions
    ),
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

function serializeJobDraft(draft: JobDraft, salaryCurrencyOptions?: string[]) {
  return JSON.stringify(buildJobPayload(draft, salaryCurrencyOptions));
}

function serializeCompanyDraft({
  description,
  websiteUrl,
  interviewerCount,
  logoUrl,
  galleryUrls,
}: {
  description: string;
  websiteUrl: string;
  interviewerCount: number;
  logoUrl: string | null;
  galleryUrls: string[];
}) {
  return JSON.stringify({
    description: description.trim(),
    websiteUrl: websiteUrl.trim() || null,
    interviewerCount,
    logoUrl,
    galleryUrls,
  });
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
  salaryCurrencyOptions,
}: {
  recruiter: Recruiter;
  section?: "company" | "jobs";
  jobModerationEnabled?: boolean;
  salaryCurrencyOptions?: string[];
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
  const [error, setError] = useState("");
  const [lastSavedCompanyDraft, setLastSavedCompanyDraft] = useState(() =>
    serializeCompanyDraft({
      description: recruiter.description,
      websiteUrl: recruiter.websiteUrl ?? "",
      interviewerCount: recruiter.interviewerCount,
      logoUrl: recruiter.logoUrl,
      galleryUrls: recruiter.galleryUrls ?? [],
    })
  );
  const [companyStatus, setCompanyStatus] = useState<SaveStatus>("idle");
  const [companyStatusMessage, setCompanyStatusMessage] = useState("");
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [newJobDraft, setNewJobDraft] = useState<JobDraft>(EMPTY_JOB_DRAFT);
  const [addingJob, setAddingJob] = useState(false);
  const [newJobSaved, setNewJobSaved] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | "new" | null>("new");
  const [editJobDraft, setEditJobDraft] = useState<JobDraft>(EMPTY_JOB_DRAFT);
  const [updatingJobId, setUpdatingJobId] = useState<number | null>(null);
  const [submittingJobId, setSubmittingJobId] = useState<number | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);
  const [jobStatus, setJobStatus] = useState<SaveStatus>("idle");
  const [jobStatusMessage, setJobStatusMessage] = useState("");
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
          setEditJobDraft(toDraft(nextJobs[0], salaryCurrencyOptions));
        }
      })
      .finally(() => setLoadingJobs(false));
  }, [salaryCurrencyOptions, section]);

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setCompanyStatus("saving");
    setCompanyStatusMessage(messages.dashboard.company.saving);
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
      setLastSavedCompanyDraft(
        serializeCompanyDraft({
          description,
          websiteUrl,
          interviewerCount,
          logoUrl,
          galleryUrls,
        })
      );
      setCompanyStatus("saved");
      setCompanyStatusMessage(messages.dashboard.company.saved);
      router.refresh();
      setTimeout(() => {
        setCompanyStatus("idle");
      }, 3000);
    } catch (err) {
      const nextError =
        err instanceof Error
          ? err.message
          : messages.dashboard.company.errorFallback;
      setError(nextError);
      setCompanyStatus("error");
      setCompanyStatusMessage(nextError);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddJob(e: React.FormEvent) {
    e.preventDefault();
    if (addingJob) return;

    const payload = buildJobPayload(newJobDraft, salaryCurrencyOptions);
    if (!payload.title || !payload.location || !payload.employmentType) {
      setJobError("Please fill in title, location, and employment type.");
      setJobStatus("error");
      setJobStatusMessage("Please fill in title, location, and employment type.");
      return;
    }

    setJobError("");
    setNewJobSaved(false);
    setAddingJob(true);
    setJobStatus("saving");
    setJobStatusMessage("Adding job...");
    try {
      const res = await fetch("/api/me/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const nextError = data.error || "Failed to create job";
        setJobError(nextError);
        setJobStatus("error");
        setJobStatusMessage(nextError);
        return;
      }

      const data = await res.json();
      setJobs((current) => {
        const nextJobs = [...current, data.job];
        cachedRecruiterJobs = nextJobs;
        return nextJobs;
      });
      setNewJobDraft(EMPTY_JOB_DRAFT);
      setNewJobSaved(true);
      setJobStatus("saved");
      setJobStatusMessage("Job added.");
      setTimeout(() => setJobStatus("idle"), 3000);
    } finally {
      setAddingJob(false);
    }
  }

  async function handleUpdateJob(id: number) {
    const payload = buildJobPayload(editJobDraft, salaryCurrencyOptions);
    if (!payload.title || !payload.location || !payload.employmentType) {
      setJobError("Please fill in title, location, and employment type.");
      setJobStatus("error");
      setJobStatusMessage("Please fill in title, location, and employment type.");
      return;
    }

    setJobError("");
    setUpdatingJobId(id);
    setJobStatus("saving");
    setJobStatusMessage("Saving job...");
    try {
      const res = await fetch(`/api/me/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const nextError = data.error || "Failed to update job";
        setJobError(nextError);
        setJobStatus("error");
        setJobStatusMessage(nextError);
        return;
      }

      const data = await res.json();
      setJobs((current) => {
        const nextJobs = current.map((job) => (job.id === id ? data.job : job));
        cachedRecruiterJobs = nextJobs;
        return nextJobs;
      });
      setEditJobDraft(toDraft(data.job, salaryCurrencyOptions));
      setJobStatus("saved");
      setJobStatusMessage("Job saved.");
      setTimeout(() => setJobStatus("idle"), 3000);
    } finally {
      setUpdatingJobId(null);
    }
  }

  async function handleDeleteJob(id: number) {
    if (!confirm(messages.dashboard.company.removePositionConfirm)) return;
    setJobError("");
    setDeletingJobId(id);
    setJobStatus("saving");
    setJobStatusMessage("Deleting job...");
    const res = await fetch(`/api/me/jobs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const nextError = data.error || "Failed to delete job";
      setJobError(nextError);
      setJobStatus("error");
      setJobStatusMessage(nextError);
      setDeletingJobId(null);
      return;
    }
    setJobs((current) => {
      const nextJobs = current.filter((job) => job.id !== id);
      cachedRecruiterJobs = nextJobs;
      return nextJobs;
    });
    if (selectedJobId === id) {
      setSelectedJobId("new");
      setNewJobDraft(EMPTY_JOB_DRAFT);
    }
    setDeletingJobId(null);
    setJobStatus("saved");
    setJobStatusMessage("Job deleted.");
    setTimeout(() => setJobStatus("idle"), 3000);
  }

  async function handleSubmitJob(id: number) {
    setJobError("");
    setSubmittingJobId(id);
    setJobStatus("saving");
    setJobStatusMessage("Submitting job for review...");
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
      setJobStatus("saved");
      setJobStatusMessage(
        jobModerationEnabled ? "Job submitted for review." : "Job published."
      );
      setTimeout(() => setJobStatus("idle"), 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      const nextError = data.error || "Failed to submit job";
      setJobError(nextError);
      setJobStatus("error");
      setJobStatusMessage(nextError);
    }
    setSubmittingJobId(null);
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
  const selectedJob =
    typeof selectedJobId === "number"
      ? jobs.find((job) => job.id === selectedJobId)
      : null;
  const isCurrentEditJobSaved = selectedJob
    ? serializeJobDraft(editJobDraft, salaryCurrencyOptions) ===
      serializeJobDraft(toDraft(selectedJob, salaryCurrencyOptions), salaryCurrencyOptions)
    : false;
  const hasNewJobDraftChanges =
    serializeJobDraft(newJobDraft, salaryCurrencyOptions) !==
    serializeJobDraft(EMPTY_JOB_DRAFT, salaryCurrencyOptions);
  const hasUnsavedJobChanges =
    selectedJobId === "new"
      ? hasNewJobDraftChanges && !newJobSaved
      : typeof selectedJobId === "number"
        ? !isCurrentEditJobSaved
        : false;
  const currentCompanyDraft = serializeCompanyDraft({
    description,
    websiteUrl,
    interviewerCount,
    logoUrl,
    galleryUrls,
  });
  const hasUnsavedCompanyChanges = currentCompanyDraft !== lastSavedCompanyDraft;
  const companyFormId = "recruiter-company-form";
  const newJobFormId = "recruiter-new-job-form";

  const statusStrip =
    section === "jobs"
      ? {
          status: jobError ? "error" : jobStatus,
          label: jobError
            ? "Some changes failed"
            : jobStatus === "saving"
              ? "Saving changes..."
              : jobStatus === "saved"
                ? "Changes saved"
                : hasUnsavedJobChanges
                  ? "Unsaved changes"
                  : "All changes saved",
          detail: jobError || jobStatusMessage,
        }
      : {
          status: error ? "error" : companyStatus,
          label: error
            ? "Some changes failed"
            : companyStatus === "saving"
              ? "Saving changes..."
              : companyStatus === "saved"
                ? "Changes saved"
                : hasUnsavedCompanyChanges
                  ? "Unsaved changes"
                  : "All changes saved",
          detail: error || companyStatusMessage,
        };

  function renderStatusStrip() {
    const statusTone: StatusStripAction["tone"] =
      statusStrip.status === "error"
        ? "error"
        : statusStrip.status === "saving"
          ? "saving"
          : statusStrip.label === "Unsaved changes"
            ? "unsaved"
            : "saved";
    const statusAction: StatusStripAction | null =
      section === "company"
        ? {
            label:
              saving
                ? messages.dashboard.company.saving
                : hasUnsavedCompanyChanges
                  ? messages.dashboard.company.saveCompanyInfo
                  : statusStrip.label,
            form: companyFormId,
            disabled: saving || !hasUnsavedCompanyChanges,
            loading: saving,
            saved: !hasUnsavedCompanyChanges && !saving,
            tone: statusTone,
          }
        : selectedJobId === "new"
          ? {
              label:
                addingJob
                  ? messages.dashboard.company.saving
                  : newJobSaved
                    ? statusStrip.label
                    : messages.dashboard.company.add,
              form: newJobFormId,
              disabled:
                addingJob ||
                newJobSaved ||
                !hasNewJobDraftChanges ||
                !newJobDraft.title.trim() ||
                !newJobDraft.location.trim() ||
                !newJobDraft.employmentType,
              loading: addingJob,
              saved: newJobSaved,
              tone: statusTone,
            }
          : typeof selectedJobId === "number"
            ? {
                label:
                  updatingJobId === selectedJobId
                    ? messages.dashboard.company.saving
                    : isCurrentEditJobSaved
                      ? statusStrip.label
                      : messages.common.save,
                onClick: () => void handleUpdateJob(selectedJobId),
                disabled:
                  updatingJobId === selectedJobId ||
                  isCurrentEditJobSaved ||
                  !editJobDraft.title.trim() ||
                  !editJobDraft.location.trim() ||
                  !editJobDraft.employmentType,
                loading: updatingJobId === selectedJobId,
                saved: isCurrentEditJobSaved,
                tone: statusTone,
              }
            : null;
    if (!statusAction) return null;

    return (
      <div
        className={cn(
          "fixed inset-x-0 bottom-[calc(max(0.5rem,env(safe-area-inset-bottom))+4.25rem)] z-40 flex justify-center px-4 md:sticky md:top-3 md:bottom-auto md:justify-end md:px-0"
        )}
        role="status"
        aria-live="polite"
      >
        <Button
          type={statusAction.form ? "submit" : "button"}
          form={statusAction.form}
          size="sm"
          variant={statusAction.tone === "saved" ? "outline" : "default"}
          className={cn(
            "h-11 min-w-[12rem] max-w-[calc(100vw-2rem)] gap-2 rounded-full px-5 text-sm font-semibold shadow-[0_12px_28px_-10px_rgba(0,0,0,0.35),0_4px_12px_-6px_rgba(0,0,0,0.25)] backdrop-blur-xl disabled:cursor-default disabled:opacity-100 md:min-w-[11rem] md:rounded-lg",
            statusAction.tone === "saved" &&
              "border-[#30D158]/35 bg-background/90 text-[#1f8f3a] supports-[backdrop-filter]:bg-background/75",
            statusAction.tone === "unsaved" &&
              "border-[#FF9500] bg-[#FF9500] text-white hover:bg-[#e68600]",
            statusAction.tone === "saving" &&
              "border-primary bg-primary text-primary-foreground",
            statusAction.tone === "error" &&
              "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
          )}
          disabled={statusAction.disabled}
          onClick={statusAction.onClick}
          title={statusStrip.detail || statusStrip.label}
        >
          {statusAction.loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : statusAction.tone === "saved" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : statusAction.tone === "error" ? (
            <span className="h-2.5 w-2.5 rounded-full bg-current" />
          ) : section === "jobs" && selectedJobId === "new" ? (
            <Plus className="h-4 w-4" />
          ) : null}
          {statusAction.label}
        </Button>
      </div>
    );
  }

  function renderJobForm({
    draft,
    onChange,
  }: {
    draft: JobDraft;
    onChange: (field: keyof JobDraft, value: string) => void;
  }) {
    const companyMessages = messages.dashboard.company;
    const languageOptions = getLanguageRequirementOptions(locale);
    const salaryCurrencySelectOptions = getSalaryCurrencyOptions(
      locale,
      salaryCurrencyOptions
    );
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
          <select
            value={draft.salaryCurrency}
            onChange={(e) => onChange("salaryCurrency", e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            {salaryCurrencySelectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
          <BulletTextarea
            value={draft.description}
            onChange={(next) => onChange("description", next)}
            placeholder={companyMessages.descriptionPlaceholder}
            ariaLabel={companyMessages.summary}
            toggleLabel={companyMessages.bulletedList}
            rows={4}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.responsibilities}
          </label>
          <BulletTextarea
            value={draft.responsibilities}
            onChange={(next) => onChange("responsibilities", next)}
            placeholder={companyMessages.responsibilitiesPlaceholder}
            ariaLabel={companyMessages.responsibilities}
            toggleLabel={companyMessages.bulletedList}
            rows={4}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.requirements}
          </label>
          <BulletTextarea
            value={draft.requirements}
            onChange={(next) => onChange("requirements", next)}
            placeholder={companyMessages.requirementsPlaceholder}
            ariaLabel={companyMessages.requirements}
            toggleLabel={companyMessages.bulletedList}
            rows={4}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.benefits}
          </label>
          <BulletTextarea
            value={draft.benefits}
            onChange={(next) => onChange("benefits", next)}
            placeholder={companyMessages.benefitsPlaceholder}
            ariaLabel={companyMessages.benefits}
            toggleLabel={companyMessages.bulletedList}
            rows={4}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 md:pb-0">
      {renderStatusStrip()}
      {section === "company" ? (
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              {recruiter.company}
            </h2>
            <p className="text-sm text-muted-foreground">
              {recruiter.industry} · {recruiter.contactEmail}
            </p>
          </div>
          <form id={companyFormId} onSubmit={handleSaveCompany} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="desc" className="text-sm font-medium">
                    {messages.dashboard.company.companyDescription}
                  </label>
                  <textarea
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={messages.dashboard.company.whatDoesCompanyDo}
                    rows={10}
                    className="min-h-72 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
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
                </div>
              </div>
              <div className="space-y-5">
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
                  <MultiImageUpload
                    values={galleryUrls}
                    onChange={setGalleryUrls}
                    type="gallery"
                    max={4}
                    hint="Photos showcasing your company. Landscape (3:2). Recommended 1200×800px. JPG, PNG, WebP, or GIF. Max 4MB each."
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
              </div>
            </div>
          </form>
        </section>
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
                setNewJobSaved(false);
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
                      setEditJobDraft(toDraft(job, salaryCurrencyOptions));
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
                <form id={newJobFormId} onSubmit={handleAddJob}>
                  {renderJobForm({
                    draft: newJobDraft,
                    onChange: (field, value) => {
                      setNewJobSaved(false);
                      setNewJobDraft((current) => ({ ...current, [field]: value }));
                    },
                  })}
                </form>
                {jobError ? <p className="mt-2 text-xs text-destructive">{jobError}</p> : null}
              </div>
            ) : typeof selectedJobId === "number" ? (
              (() => {
                return (
              <div className="space-y-4">
                <div className="mb-4 flex items-center justify-between gap-4 border-b pb-4">
                  <h2 className="truncate text-lg font-semibold">
                    Edit {selectedJob?.title}
                  </h2>
                  <div className="flex shrink-0 items-center gap-2">
                    {jobModerationEnabled &&
                    selectedJob?.moderationStatus !== "pending_review" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={submittingJobId === selectedJobId}
                        onClick={() => handleSubmitJob(selectedJobId)}
                      >
                        {submittingJobId === selectedJobId ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        {messages.dashboard.company.submitForReview}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      disabled={deletingJobId === selectedJobId}
                      onClick={() => handleDeleteJob(selectedJobId)}
                    >
                      {deletingJobId === selectedJobId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {selectedJob?.moderationNotes ? (
                  <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                    <span className="font-semibold">
                      {messages.dashboard.company.adminNotePrefix}
                    </span>{" "}
                    {selectedJob.moderationNotes}
                  </div>
                ) : null}

                {renderJobForm({
                  draft: editJobDraft,
                  onChange: (field, value) =>
                    setEditJobDraft((current) => ({ ...current, [field]: value })),
                })}
                {jobError ? <p className="mt-2 text-xs text-destructive">{jobError}</p> : null}
              </div>
                );
              })()
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
