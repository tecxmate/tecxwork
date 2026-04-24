"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeInfo,
  Briefcase,
  Building2,
  MapPin,
  Search,
  X,
} from "lucide-react";

import { RecruiterJobPostingCard, type RecruiterJobPosting } from "@/components/recruiter-job-posting-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { employmentTypeLabel, formatApplicationDeadline, formatSalaryRange, type JobPostingLocale } from "@/lib/job-posting";

type JobsBrowserLabels = {
  recruiterPosted: string;
  viewCompany: string;
  viewDetails: string;
  searchPlaceholder: string;
  resultsCount: string;
  noMatchTitle: string;
  noMatchSubtitle: string;
  close: string;
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
};

export type RecruiterBrowseJob = RecruiterJobPosting & {
  recruiterId: number;
  company: string;
};

function splitTextItems(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim());
}

function getPreviewText(job: RecruiterBrowseJob) {
  const firstLine =
    splitTextItems(job.description)[0] ||
    splitTextItems(job.responsibilities)[0] ||
    splitTextItems(job.requirements)[0] ||
    splitTextItems(job.benefits)[0] ||
    "";

  return firstLine;
}

function JobTeaserCard({
  job,
  locale,
  labels,
  onOpen,
}: {
  job: RecruiterBrowseJob;
  locale: JobPostingLocale;
  labels: JobsBrowserLabels;
  onOpen: () => void;
}) {
  const salary = formatSalaryRange({
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    salaryPeriod: job.salaryPeriod,
    locale,
  });
  const employment = employmentTypeLabel(job.employmentType, locale);
  const deadline = formatApplicationDeadline(job.applicationDeadline, locale);
  const preview = getPreviewText(job);

  return (
    <button
      onClick={onOpen}
      className="group relative flex w-full flex-col rounded-2xl border border-border/70 bg-card p-4 text-left transition-all duration-200 ease-out hover:border-primary/40 hover:shadow-[0_0_24px_rgba(140,82,255,0.12)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="line-clamp-2 text-base font-semibold leading-tight">
            {job.title}
          </h3>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{job.company}</span>
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {labels.recruiterPosted}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.location ? (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <MapPin className="h-3 w-3" />
            {job.location}
          </Badge>
        ) : null}
        {employment ? (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Briefcase className="h-3 w-3" />
            {employment}
          </Badge>
        ) : null}
        {salary ? <Badge className="text-[10px]">{salary}</Badge> : null}
        {deadline ? (
          <Badge variant="secondary" className="text-[10px]">
            {labels.card.applicationDeadline}: {deadline}
          </Badge>
        ) : null}
      </div>

      {preview ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{preview}</p>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
          {labels.viewDetails}
        </span>
      </div>
    </button>
  );
}

function JobDetailModal({
  job,
  locale,
  labels,
  onClose,
}: {
  job: RecruiterBrowseJob;
  locale: JobPostingLocale;
  labels: JobsBrowserLabels;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:items-center sm:pb-0"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-3xl max-h-[calc(100vh-6rem-env(safe-area-inset-bottom))] overflow-y-auto rounded-t-2xl bg-background shadow-xl animate-in slide-in-from-bottom-4 duration-200 sm:max-h-[90vh] sm:rounded-2xl sm:slide-in-from-bottom-0 sm:zoom-in-95"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6">
          <Badge variant="secondary" className="text-[10px]">
            {labels.recruiterPosted}
          </Badge>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 transition-colors hover:bg-muted"
            aria-label={labels.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <RecruiterJobPostingCard
            job={job}
            locale={locale}
            className="border-0 p-0 shadow-none hover:border-border/70 hover:shadow-none"
            labels={labels.card}
            action={
              <Link
                href={`/recruiter/${job.recruiterId}`}
                className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                {labels.viewCompany}
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
}

export function RecruiterJobsBrowser({
  jobs,
  locale,
  labels,
}: {
  jobs: RecruiterBrowseJob[];
  locale: JobPostingLocale;
  labels: JobsBrowserLabels;
}) {
  const [query, setQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const deferredQuery = useDeferredValue(query);

  const filteredJobs = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();

    if (!normalized) return jobs;

    return jobs.filter((job) =>
      [
        job.title,
        job.company,
        job.location,
        job.description,
        job.responsibilities,
        job.requirements,
        job.benefits,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized))
    );
  }, [deferredQuery, jobs]);

  const selectedJob =
    filteredJobs.find((job) => job.id === selectedJobId) ??
    jobs.find((job) => job.id === selectedJobId) ??
    null;

  return (
    <section className="space-y-4">
      <div className="mx-auto max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.searchPlaceholder}
            className="pl-9"
            aria-label={labels.searchPlaceholder}
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {filteredJobs.length} {labels.resultsCount}
        </p>
      </div>

      {filteredJobs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <BadgeInfo className="h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            {labels.noMatchTitle}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.noMatchSubtitle}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <JobTeaserCard
              key={job.id}
              job={job}
              locale={locale}
              labels={labels}
              onOpen={() => setSelectedJobId(job.id)}
            />
          ))}
        </div>
      )}

      {selectedJob ? (
        <JobDetailModal
          job={selectedJob}
          locale={locale}
          labels={labels}
          onClose={() => setSelectedJobId(null)}
        />
      ) : null}
    </section>
  );
}
