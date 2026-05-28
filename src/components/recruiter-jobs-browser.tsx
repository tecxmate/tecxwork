"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { jobCategorySlugFromValue } from "@/lib/job-category-routes";
import type { JobCategoryValue } from "@/lib/job-posting";
import {
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  Tags,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JobDetailApply } from "@/components/job-detail-apply";
import { cn } from "@/lib/utils";
import {
  employmentTypeLabel,
  formatApplicationDeadline,
  getJobCategoryOptions,
  jobCategoryLabel,
  type JobPostingLocale,
} from "@/lib/job-posting";
import type { StudentMessages } from "@/lib/student-messages";
import type { RecruiterJobPosting } from "@/components/recruiter-job-posting-card";

const ITEMS_PER_PAGE = 12;

const FILTER_SELECT_CLASS =
  "h-9 w-full min-w-0 cursor-pointer truncate rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors hover:border-input/80 focus:outline-none focus:ring-2 focus:ring-ring";

type JobsBrowserLabels = {
  viewDetails: string;
  searchPlaceholder: string;
  resultsCount: string;
  noMatchTitle: string;
  noMatchSubtitle: string;
  selectPrompt: string;
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

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

function JobListRow({
  job,
  locale,
  labels,
  selected,
  onSelect,
}: {
  job: RecruiterBrowseJob;
  locale: JobPostingLocale;
  labels: JobsBrowserLabels;
  selected: boolean;
  onSelect: () => void;
}) {
  const employment = employmentTypeLabel(job.employmentType, locale);
  const category = jobCategoryLabel(job.jobCategory, locale);
  const deadline = formatApplicationDeadline(job.applicationDeadline, locale);
  const preview = getPreviewText(job);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected}
      className={cn(
        "group relative flex w-full min-w-0 flex-col gap-2 rounded-2xl border bg-card p-4 text-left transition-all duration-200 ease-out hover:border-primary/40 hover:shadow-[0_0_24px_rgba(140,82,255,0.12)]",
        selected
          ? "border-primary/60 shadow-[0_0_0_1px_rgba(140,82,255,0.35)] lg:bg-primary/[0.03]"
          : "border-border/70"
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          {job.logoUrl ? (
            <img
              src={job.logoUrl}
              alt={`${job.company} logo`}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-lg border border-border/60 bg-secondary">
              <Building2 className="h-6 w-6 text-primary" />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p
            className={cn(
              "line-clamp-2 text-base font-semibold leading-tight",
              selected ? "text-primary" : "group-hover:text-primary"
            )}
          >
            {job.title}
          </p>
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {job.company}
          </p>
          {job.location ? (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{job.location}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 max-w-full flex-wrap gap-1.5 overflow-hidden">
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
        <p className="line-clamp-2 text-sm text-muted-foreground lg:hidden">
          {preview}
        </p>
      ) : null}
    </button>
  );
}

export function RecruiterJobsBrowser({
  jobs,
  locale,
  messages,
  isApplicant,
  labels,
  lockedCategory,
}: {
  jobs: RecruiterBrowseJob[];
  locale: JobPostingLocale;
  messages: StudentMessages;
  isApplicant: boolean;
  labels: JobsBrowserLabels;
  lockedCategory?: string;
}) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [employmentFilter, setEmploymentFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const deferredQuery = useDeferredValue(query);

  function handleCategorySelect(value: string) {
    if (!value) {
      router.push("/jobs");
      return;
    }
    const slug = jobCategorySlugFromValue(value as JobCategoryValue);
    router.push(`/jobs/cat/${slug}`);
  }

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
      if (!lockedCategory && categoryFilter && job.jobCategory !== categoryFilter) {
        return false;
      }
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
    lockedCategory,
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
    locationFilter ||
    (!lockedCategory && categoryFilter) ||
    companyFilter ||
    employmentFilter;

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

  const sectionRef = useRef<HTMLElement>(null);
  const isFirstPageEffect = useRef(true);
  useEffect(() => {
    if (isFirstPageEffect.current) {
      isFirstPageEffect.current = false;
      return;
    }
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  // On desktop, keep a valid job selected for the detail pane.
  useEffect(() => {
    if (!isDesktop) return;
    const stillVisible = paginatedJobs.some((j) => j.id === selectedJobId);
    if (!stillVisible) {
      setSelectedJobId(paginatedJobs[0]?.id ?? null);
    }
  }, [isDesktop, paginatedJobs, selectedJobId]);

  const selectedJob = useMemo(
    () => filteredJobs.find((j) => j.id === selectedJobId) ?? null,
    [filteredJobs, selectedJobId]
  );

  const handleRowSelect = (id: number) => {
    if (isDesktop) {
      setSelectedJobId(id);
    } else {
      router.push(`/jobs/${id}`);
    }
  };

  return (
    <section ref={sectionRef} className="scroll-mt-20 space-y-3">
      {/* Full-width sticky search + filters — one line on desktop, spans both panes */}
      <div className="space-y-2 lg:sticky lg:top-14 lg:z-[9] lg:-mx-1 lg:flex lg:items-center lg:gap-2 lg:space-y-0 lg:border-b lg:border-border/60 lg:bg-background/85 lg:px-1 lg:pb-3 lg:pt-3 lg:shadow-sm lg:backdrop-blur">
        <div className="relative lg:min-w-[200px] lg:flex-[1.4]">
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

        <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-[2] lg:items-center lg:gap-2">
          <select
            value={locationFilter}
            onChange={(e) => handleFilterChange(setLocationFilter)(e.target.value)}
            className={`${FILTER_SELECT_CLASS} lg:flex-1`}
          >
            <option value="">{filterLabels.location}: {filterLabels.all}</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <select
            value={companyFilter}
            onChange={(e) => handleFilterChange(setCompanyFilter)(e.target.value)}
            className={`${FILTER_SELECT_CLASS} lg:flex-1`}
          >
            <option value="">{filterLabels.company}: {filterLabels.all}</option>
            {uniqueCompanies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {!lockedCategory ? (
            <select
              value={categoryFilter}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className={`${FILTER_SELECT_CLASS} lg:flex-1`}
            >
              <option value="">{filterLabels.category}: {filterLabels.all}</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
          <select
            value={employmentFilter}
            onChange={(e) => handleFilterChange(setEmploymentFilter)(e.target.value)}
            className={`${FILTER_SELECT_CLASS} lg:flex-1`}
          >
            <option value="">{filterLabels.employmentType}: {filterLabels.all}</option>
            {uniqueEmploymentTypes.map((t) => (
              <option key={t} value={t}>{employmentTypeLabel(t, locale) || t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Two panes */}
      <div className="lg:grid lg:grid-cols-[minmax(320px,380px)_1fr] lg:items-start lg:gap-4">
        {/* Left: result count + job list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              {filteredJobs.length} {labels.resultsCount}
            </p>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 shrink-0 gap-1 px-2 text-xs"
              >
                <X className="h-3 w-3" />
                {filterLabels.clearFilters}
              </Button>
            )}
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
            <div className="space-y-2.5">
              {paginatedJobs.map((job) => (
                <JobListRow
                  key={job.id}
                  job={job}
                  locale={locale}
                  labels={labels}
                  selected={isDesktop && job.id === selectedJobId}
                  onSelect={() => handleRowSelect(job.id)}
                />
              ))}

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
            </div>
          )}
        </div>

        {/* Right: detail pane (desktop only) */}
        <div className="hidden lg:sticky lg:top-[124px] lg:block">
          {selectedJob ? (
            <div className="max-h-[calc(100vh-9rem)] overflow-y-auto rounded-2xl border border-border/70 bg-card p-6">
              <JobDetailApply
                key={selectedJob.id}
                job={selectedJob}
                locale={locale}
                messages={messages}
                isApplicant={isApplicant}
              />
            </div>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 p-10 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-4 text-sm text-muted-foreground">
                {labels.selectPrompt}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
