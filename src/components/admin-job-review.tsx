"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import {
  RecruiterJobPostingCard,
  type RecruiterJobPosting,
} from "@/components/recruiter-job-posting-card";
import {
  getJobCategoryOptions,
  type JobPostingLocale,
} from "@/lib/job-posting";
import { cn } from "@/lib/utils";

type AdminJob = RecruiterJobPosting & {
  recruiterId: number;
  company: string;
  moderationStatus: string;
  moderationNotes: string;
};

type Labels = {
  card: {
    seniority: string;
    languageRequirement: string;
    visaSupport: string;
    applicationDeadline: string;
    description: string;
    responsibilities: string;
    requirements: string;
    benefits: string;
    viewJd: string;
    noJd: string;
  };
  approve: string;
  approved: string;
  reject: string;
  rejected: string;
  resetToDraft: string;
  jobCategory: string;
  uncategorized: string;
  saveCategory: string;
  adminNotes: string;
  notesPlaceholder: string;
  back: string;
};

export function AdminJobReview({
  job: initialJob,
  locale,
  labels,
}: {
  job: AdminJob;
  locale: string;
  labels: Labels;
}) {
  const router = useRouter();
  const [job, setJob] = useState<AdminJob>(initialJob);
  const [notes, setNotes] = useState(initialJob.moderationNotes ?? "");
  const [category, setCategory] = useState(initialJob.jobCategory ?? "");
  const [pending, setPending] = useState<"approve" | "reject" | "reset" | null>(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const jobCategoryOptions = getJobCategoryOptions(locale as JobPostingLocale);

  const isApproved = job.moderationStatus === "approved";
  const isRejected = job.moderationStatus === "rejected";
  const isPending = job.moderationStatus === "pending_review";

  async function moderate(action: "approve" | "reject" | "reset") {
    setPending(action);
    const res = await fetch(`/api/admin/jobs/${job.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, moderationNotes: notes, jobCategory: category }),
    });
    setPending(null);
    if (!res.ok) return;
    const data = await res.json();
    setJob((j) => ({ ...j, ...data.job }));
    router.refresh();
  }

  async function saveCategory() {
    setCategorySaving(true);
    const res = await fetch(`/api/admin/jobs/${job.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobCategory: category }),
    });
    setCategorySaving(false);
    if (!res.ok) return;
    const data = await res.json();
    setJob((j) => ({ ...j, ...data.job }));
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/admin/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {labels.back}
        </Link>

        <RecruiterJobPostingCard
          job={job}
          locale={locale as JobPostingLocale}
          labels={labels.card}
        />

        <Card>
          <CardContent className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {labels.jobCategory}
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{labels.uncategorized}</option>
                  {jobCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={saveCategory}
                  disabled={categorySaving}
                  className="h-9"
                >
                  {categorySaving ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  {labels.saveCategory}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {labels.adminNotes}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={labels.notesPlaceholder}
                className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm transition-colors focus:bg-background"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => moderate("approve")}
              disabled={pending !== null}
              aria-pressed={isApproved}
              className={cn(
                "h-9",
                isApproved
                  ? "border border-emerald-600 bg-background text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              )}
            >
              {pending === "approve" ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              )}
              {isApproved ? labels.approved : labels.approve}
            </Button>
            <Button
              size="sm"
              onClick={() => moderate("reject")}
              disabled={pending !== null}
              aria-pressed={isRejected}
              className={cn(
                "h-9",
                isRejected
                  ? "border border-red-500 bg-background text-red-500 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-500/10"
                  : "bg-red-400 text-white hover:bg-red-500 dark:bg-red-400 dark:hover:bg-red-500"
              )}
            >
              {pending === "reject" ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="mr-1 h-3.5 w-3.5" />
              )}
              {isRejected ? labels.rejected : labels.reject}
            </Button>
            {!isPending && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => moderate("reset")}
                disabled={pending !== null}
                className="h-9 text-muted-foreground"
              >
                {labels.resetToDraft}
              </Button>
            )}
          </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
