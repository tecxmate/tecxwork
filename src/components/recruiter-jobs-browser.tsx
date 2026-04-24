"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  MapPin,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { employmentTypeLabel, formatApplicationDeadline, formatSalaryRange, type JobPostingLocale } from "@/lib/job-posting";
import type { RecruiterJobPosting } from "@/components/recruiter-job-posting-card";

type JobsBrowserLabels = {
  viewDetails: string;
  searchPlaceholder: string;
  resultsCount: string;
  noMatchTitle: string;
  noMatchSubtitle: string;
  card: {
    applicationDeadline: string;
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
}: {
  job: RecruiterBrowseJob;
  locale: JobPostingLocale;
  labels: JobsBrowserLabels;
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
    <Link
      href={`/jobs/${job.id}`}
      className="group relative flex h-full w-full flex-col rounded-2xl border border-border/70 bg-card p-4 text-left transition-all duration-200 ease-out hover:border-primary/40 hover:shadow-[0_0_24px_rgba(140,82,255,0.12)]"
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

      <div className="mt-auto flex items-end justify-end pt-4">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
          {labels.viewDetails}
        </span>
      </div>
    </Link>
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
          <Briefcase className="h-10 w-10 text-muted-foreground/50" />
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
            />
          ))}
        </div>
      )}
    </section>
  );
}
