"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { RecruiterJobPostingCard } from "@/components/recruiter-job-posting-card";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  SALARY_PERIOD_OPTIONS,
  SENIORITY_OPTIONS,
  VISA_SUPPORT_OPTIONS,
  WORKPLACE_TYPE_OPTIONS,
} from "@/lib/job-posting";
import { cn } from "@/lib/utils";

type Recruiter = {
  id: number;
  company: string;
  industry: string;
  description: string;
  contactEmail: string;
  interviewerCount: number;
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
  };
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
  const { messages } = useRecruiterI18n();
  const router = useRouter();
  const [description, setDescription] = useState(recruiter.description);
  const [interviewerCount, setInterviewerCount] = useState(
    recruiter.interviewerCount
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [newJobDraft, setNewJobDraft] = useState<JobDraft>(EMPTY_JOB_DRAFT);
  const [editingId, setEditingId] = useState<number | null>(null);
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
      })
      .finally(() => setLoadingJobs(false));
  }, [section]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

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
          interviewerCount,
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
    if (!payload.title || !payload.location || !payload.employmentType || !payload.description) {
      setJobError("Please fill in title, location, employment type, and description.");
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
    if (!payload.title || !payload.location || !payload.employmentType || !payload.description) {
      setJobError("Please fill in title, location, employment type, and description.");
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
      setEditingId(null);
      setEditJobDraft(EMPTY_JOB_DRAFT);
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

  const statusClassName: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    pending_review: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
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
            {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
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
            {WORKPLACE_TYPE_OPTIONS.map((option) => (
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
            {SALARY_PERIOD_OPTIONS.map((option) => (
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
            {SENIORITY_OPTIONS.map((option) => (
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
            {VISA_SUPPORT_OPTIONS.map((option) => (
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
          <Input
            value={draft.languageRequirement}
            onChange={(e) => onChange("languageRequirement", e.target.value)}
            placeholder={companyMessages.languageRequirementPlaceholder}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            {companyMessages.jdLinkOptional}
          </label>
          <Input
            value={draft.jdLink}
            onChange={(e) => onChange("jdLink", e.target.value)}
            placeholder={companyMessages.jdLinkOptional}
            type="url"
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
        <Button
          type={submitButtonType}
          size="sm"
          disabled={
            !draft.title.trim() ||
            !draft.location.trim() ||
            !draft.employmentType ||
            !draft.description.trim()
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
          <Card className="md:hidden">
            <CardContent className="space-y-3 p-4">
              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={handleLogout}
              >
                {messages.common.logout}
              </Button>
            </CardContent>
          </Card>

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
        <Card>
          <CardHeader>
            <h2 className="font-heading text-lg font-semibold">
              {messages.dashboard.company.jobOpenings}
            </h2>
            <p className="text-xs text-muted-foreground">
              {messages.dashboard.company.jobOpeningsHint}
            </p>
            <p className="text-xs text-muted-foreground">
              {jobModerationEnabled
                ? messages.dashboard.company.moderationHint
                : messages.dashboard.company.instantPublishHint}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={handleAddJob}
              className="space-y-2 rounded-lg border bg-muted/20 p-3"
            >
              {renderJobForm({
                draft: newJobDraft,
                onChange: (field, value) =>
                  setNewJobDraft((current) => ({ ...current, [field]: value })),
                submitLabel: messages.dashboard.company.add,
                submitButtonType: "submit",
                showPlusIcon: true,
              })}
            </form>

            {jobError ? <p className="text-xs text-destructive">{jobError}</p> : null}

            {loadingJobs ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : jobs.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {messages.dashboard.company.noPositions}
              </p>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) =>
                  editingId === job.id ? (
                    <div
                      key={job.id}
                      className="space-y-2 rounded-lg border border-primary/30 p-3"
                    >
                      {renderJobForm({
                        draft: editJobDraft,
                        onChange: (field, value) =>
                          setEditJobDraft((current) => ({ ...current, [field]: value })),
                        submitLabel: messages.common.save,
                        onSubmit: () => {
                          void handleUpdateJob(job.id);
                        },
                        submitButtonType: "button",
                        showPlusIcon: false,
                      })}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditJobDraft(EMPTY_JOB_DRAFT);
                        }}
                      >
                        {messages.common.cancel}
                      </Button>
                    </div>
                  ) : (
                    <div key={job.id} className="space-y-2">
                      <RecruiterJobPostingCard
                        job={job}
                        compact
                        labels={{
                          seniority: messages.dashboard.company.seniority,
                          languageRequirement:
                            messages.dashboard.company.languageRequirement,
                          visaSupport: messages.dashboard.company.visaSupport,
                          applicationDeadline:
                            messages.dashboard.company.applicationDeadline,
                          description: messages.dashboard.company.summary,
                          responsibilities: messages.dashboard.company.responsibilities,
                          requirements: messages.dashboard.company.requirements,
                          viewJd: messages.dashboard.company.viewJd,
                          noJd: messages.dashboard.company.noJdLink,
                        }}
                        status={
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                              statusClassName[job.moderationStatus] ??
                                "bg-muted text-muted-foreground"
                            )}
                          >
                            {statusLabel[job.moderationStatus] ?? job.moderationStatus}
                          </span>
                        }
                        action={
                          <div className="flex shrink-0 flex-wrap gap-1">
                            {jobModerationEnabled &&
                            job.moderationStatus !== "pending_review" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSubmitJob(job.id)}
                              >
                                {messages.dashboard.company.submitForReview}
                              </Button>
                            ) : null}
                            <button
                              onClick={() => {
                                setEditingId(job.id);
                                setEditJobDraft(toDraft(job));
                              }}
                              className="cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                              aria-label={messages.dashboard.company.edit}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              aria-label={messages.dashboard.company.delete}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        }
                      />
                      {job.moderationNotes ? (
                        <p className="px-1 text-xs text-amber-700 dark:text-amber-300">
                          {messages.dashboard.company.adminNotePrefix}{" "}
                          {job.moderationNotes}
                        </p>
                      ) : null}
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
