"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Briefcase,
  Trash2,
} from "lucide-react";

import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  description: string;
  moderationStatus: string;
  moderationNotes: string;
};

let cachedRecruiterJobs: JobOpening[] | null = null;

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
  const [newTitle, setNewTitle] = useState("");
  const [newJdLink, setNewJdLink] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editJdLink, setEditJdLink] = useState("");
  const [editDescription, setEditDescription] = useState("");
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
      .then((r) => r.json())
      .then((d) => {
        const nextJobs = d.jobs ?? [];
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
    if (!newTitle.trim()) return;
    setJobError("");
    const res = await fetch("/api/me/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        jdLink: newJdLink.trim() || null,
        description: newDescription.trim(),
      }),
    });
    if (res.ok) {
      const d = await res.json();
      setJobs((current) => {
        const nextJobs = [...current, d.job];
        cachedRecruiterJobs = nextJobs;
        return nextJobs;
      });
      setNewTitle("");
      setNewJdLink("");
      setNewDescription("");
    } else {
      const d = await res.json().catch(() => ({}));
      setJobError(d.error || "Failed to create job");
    }
  }

  async function handleUpdateJob(id: number) {
    setJobError("");
    const res = await fetch(`/api/me/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle.trim(),
        jdLink: editJdLink.trim() || null,
        description: editDescription.trim(),
      }),
    });
    if (res.ok) {
      const d = await res.json();
      setJobs((current) => {
        const nextJobs = current.map((j) => (j.id === id ? d.job : j));
        cachedRecruiterJobs = nextJobs;
        return nextJobs;
      });
      setEditingId(null);
    } else {
      const d = await res.json().catch(() => ({}));
      setJobError(d.error || "Failed to update job");
    }
  }

  async function handleDeleteJob(id: number) {
    if (!confirm(messages.dashboard.company.removePositionConfirm)) return;
    await fetch(`/api/me/jobs/${id}`, { method: "DELETE" });
    setJobs((current) => {
      const nextJobs = current.filter((j) => j.id !== id);
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
      const d = await res.json();
      setJobs((current) => {
        const nextJobs = current.map((j) => (j.id === id ? d.job : j));
        cachedRecruiterJobs = nextJobs;
        return nextJobs;
      });
    } else {
      const d = await res.json().catch(() => ({}));
      setJobError(d.error || "Failed to submit job");
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
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={messages.dashboard.company.positionTitle}
                  required
                />
                <Input
                  value={newJdLink}
                  onChange={(e) => setNewJdLink(e.target.value)}
                  placeholder={messages.dashboard.company.jdLinkOptional}
                  type="url"
                />
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder={messages.dashboard.company.descriptionPlaceholder}
                  rows={3}
                  className="sm:col-span-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <Button type="submit" size="sm" disabled={!newTitle.trim()}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {messages.dashboard.company.add}
                </Button>
              </div>
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
              <div className="space-y-2">
                {jobs.map((job) =>
                  editingId === job.id ? (
                    <div
                      key={job.id}
                      className="rounded-lg border border-primary/30 p-3"
                    >
                      <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder={messages.dashboard.company.title}
                        />
                        <Input
                          value={editJdLink}
                          onChange={(e) => setEditJdLink(e.target.value)}
                          placeholder={messages.dashboard.company.jdLinkShort}
                          type="url"
                        />
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder={messages.dashboard.company.descriptionPlaceholder}
                          rows={3}
                          className="sm:col-span-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateJob(job.id)}>
                          {messages.common.save}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          {messages.common.cancel}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={job.id}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{job.title}</p>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                              statusClassName[job.moderationStatus] ??
                                "bg-muted text-muted-foreground"
                            )}
                          >
                            {statusLabel[job.moderationStatus] ??
                              job.moderationStatus}
                          </span>
                        </div>
                        {job.description ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {job.description}
                          </p>
                        ) : null}
                        {job.jdLink ? (
                          <a
                            href={job.jdLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            {messages.dashboard.company.viewJd}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {messages.dashboard.company.noJdLink}
                          </p>
                        )}
                        {job.moderationNotes ? (
                          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                            {messages.dashboard.company.adminNotePrefix}{" "}
                            {job.moderationNotes}
                          </p>
                        ) : null}
                      </div>
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
                            setEditTitle(job.title);
                            setEditJdLink(job.jdLink ?? "");
                            setEditDescription(job.description ?? "");
                          }}
                          className="cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                          aria-label={messages.dashboard.company.edit}
                        >
                          <Briefcase className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label={messages.dashboard.company.delete}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
