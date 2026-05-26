"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Search,
  Tags,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  employmentTypeLabel,
  formatApplicationDeadline,
  formatSalaryRange,
  getJobCategoryOptions,
  jobCategoryLabel,
  type JobPostingLocale,
} from "@/lib/job-posting";
import type { RecruiterJobPosting } from "@/components/recruiter-job-posting-card";

const ITEMS_PER_PAGE = 12;

type JobsBrowserLabels = {
  viewDetails: string;
  searchPlaceholder: string;
  resultsCount: string;
  noMatchTitle: string;
  noMatchSubtitle: string;
  card: {
    applicationDeadline: string;
  };
  filters?: {
    all: string;
    location: string;
    company: string;
    category: string;
    employmentType: string;
    clearFilters: string;
    page: string;
    of: string;
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
  const category = jobCategoryLabel(job.jobCategory, locale);
  const deadline = formatApplicationDeadline(job.applicationDeadline, locale);
  const preview = getPreviewText(job);

  return (
    <article className="group relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card p-4 text-left transition-all duration-200 ease-out hover:border-primary/40 hover:shadow-[0_0_24px_rgba(140,82,255,0.12)]">
      <div className="flex min-w-0 items-start gap-3">
        <Link
          href={`/recruiter/${job.recruiterId}`}
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`View ${job.company}`}
        >
          {job.logoUrl ? (
            <img
              src={job.logoUrl}
              alt={`${job.company} logo`}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-lg border border-border/60 bg-secondary">
              <Building2 className="h-7 w-7 text-primary" />
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1 space-y-1">
          <Link
            href={`/jobs/${job.id}`}
            className="line-clamp-2 text-base font-semibold leading-tight hover:text-primary"
          >
            {job.title}
          </Link>
          <Link
            href={`/recruiter/${job.recruiterId}`}
            className="line-clamp-1 text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            {job.company}
          </Link>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 max-w-full flex-wrap gap-1.5 overflow-hidden">
        {job.location ? (
          <Badge
            variant="secondary"
            className="min-w-0 max-w-full shrink justify-start gap-1 text-[10px]"
          >
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="min-w-0 truncate">{job.location}</span>
          </Badge>
        ) : null}
        {employment ? (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Briefcase className="h-3 w-3" />
            {employment}
          </Badge>
        ) : null}
        {category ? (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Tags className="h-3 w-3" />
            {category}
          </Badge>
        ) : null}
        {salary ? (
          <Badge className="min-w-0 max-w-full shrink justify-start text-[10px]">
            <span className="min-w-0 truncate">{salary}</span>
          </Badge>
        ) : null}
        {deadline ? (
          <Badge
            variant="secondary"
            className="min-w-0 max-w-full shrink justify-start text-[10px]"
          >
            <span className="min-w-0 truncate">
              {labels.card.applicationDeadline}: {deadline}
            </span>
          </Badge>
        ) : null}
      </div>

      {preview ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{preview}</p>
      ) : null}

      <div className="mt-auto flex items-end justify-end pt-4">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {labels.viewDetails}
        </Link>
      </div>
    </article>
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
  const [locationFilter, setLocationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [employmentFilter, setEmploymentFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const filterLabels = labels.filters ?? {
    all: "All",
    location: "Location",
    company: "Company",
    category: "Category",
    employmentType: "Type",
    clearFilters: "Clear filters",
    page: "Page",
    of: "of",
  };

  const uniqueLocations = useMemo(
    () => [...new Set(jobs.map((j) => j.location).filter(Boolean))].sort(),
    [jobs]
  );
  const uniqueCompanies = useMemo(
    () => [...new Set(jobs.map((j) => j.company).filter(Boolean))].sort(),
    [jobs]
  );
  const categoryOptions = useMemo(() => getJobCategoryOptions(locale), [locale]);
  const uniqueEmploymentTypes = useMemo(
    () => [...new Set(jobs.map((j) => j.employmentType).filter(Boolean))].sort(),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();

    return jobs.filter((job) => {
      if (locationFilter && job.location !== locationFilter) return false;
      if (categoryFilter && job.jobCategory !== categoryFilter) return false;
      if (companyFilter && job.company !== companyFilter) return false;
      if (employmentFilter && job.employmentType !== employmentFilter) return false;

      if (!normalized) return true;

      return [
        job.title,
        job.company,
        job.location,
        jobCategoryLabel(job.jobCategory, locale),
        job.description,
        job.responsibilities,
        job.requirements,
        job.benefits,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalized));
    });
  }, [
    deferredQuery,
    jobs,
    locale,
    locationFilter,
    categoryFilter,
    companyFilter,
    employmentFilter,
  ]);

  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredJobs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredJobs, currentPage]);

  const hasActiveFilters =
    locationFilter || categoryFilter || companyFilter || employmentFilter;

  const clearFilters = () => {
    setLocationFilter("");
    setCategoryFilter("");
    setCompanyFilter("");
    setEmploymentFilter("");
    setCurrentPage(1);
  };

  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  return (
    <section className="space-y-4">
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder={labels.searchPlaceholder}
            className="pl-9"
            aria-label={labels.searchPlaceholder}
          />
        </div>

        <div className="flex w-full max-w-full flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
          <select
            value={locationFilter}
            onChange={(e) => handleFilterChange(setLocationFilter)(e.target.value)}
            className="h-8 min-w-0 max-w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{filterLabels.location}: {filterLabels.all}</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <select
            value={companyFilter}
            onChange={(e) => handleFilterChange(setCompanyFilter)(e.target.value)}
            className="h-8 min-w-0 max-w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{filterLabels.company}: {filterLabels.all}</option>
            {uniqueCompanies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => handleFilterChange(setCategoryFilter)(e.target.value)}
            className="h-8 min-w-0 max-w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{filterLabels.category}: {filterLabels.all}</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={employmentFilter}
            onChange={(e) => handleFilterChange(setEmploymentFilter)(e.target.value)}
            className="h-8 min-w-0 max-w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{filterLabels.employmentType}: {filterLabels.all}</option>
            {uniqueEmploymentTypes.map((t) => (
              <option key={t} value={t}>{employmentTypeLabel(t, locale) || t}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 gap-1 px-2 text-xs"
            >
              <X className="h-3 w-3" />
              {filterLabels.clearFilters}
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
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
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedJobs.map((job) => (
              <JobTeaserCard
                key={job.id}
                job={job}
                locale={locale}
                labels={labels}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {filterLabels.page} {currentPage} {filterLabels.of} {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
