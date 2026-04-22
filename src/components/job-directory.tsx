"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Loader2,
  Building2,
  MapPin,
  DollarSign,
  Briefcase,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalJobModal,
  JOB_TYPE_LABELS,
  type ExternalJob,
} from "@/components/external-job-modal";

interface ExternalJobWithMeta extends ExternalJob {
  externalId: string;
  lastSeenAt: string;
}

function JobCardSkeleton() {
  return (
    <div className="relative flex w-full flex-col border border-border/50 bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-4 w-1/2" />
      <div className="mt-3 flex gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="mt-3 h-8 w-full" />
      <div className="mt-3 flex">
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="absolute bottom-4 right-4 h-4 w-20" />
    </div>
  );
}

function JobCard({
  job,
  onClick,
}: {
  job: ExternalJobWithMeta;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex w-full flex-col border border-border/50 bg-card p-4 text-left transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_24px_rgba(140,82,255,0.12)] active:scale-[0.99]"
    >
      <h3 className="line-clamp-2 text-base font-semibold leading-tight">
        {job.title}
      </h3>

      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        <span className="line-clamp-1">{job.company}</span>
      </p>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {job.location}
        </span>
        {job.salary && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {job.salary}
          </span>
        )}
      </div>

      {job.snippet && (
        <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
          {job.snippet}
        </p>
      )}

      <div className="mt-auto pt-3 flex items-center">
        <div className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 text-[10px]"
          >
            {job.source}
          </Badge>
          {job.jobType && (
            <Badge variant="secondary" className="text-[10px]">
              {JOB_TYPE_LABELS[job.jobType]}
            </Badge>
          )}
        </div>
      </div>
      <span className="absolute bottom-4 right-4 flex items-center gap-0.5 text-xs font-medium text-primary">
        View details
        <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

type FilterJobType =
  | "all"
  | "full_time"
  | "part_time"
  | "internship"
  | "contract";

type FilterLanguage = "all" | "english";

const JOBS_PER_PAGE = 24;

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

export function JobDirectory() {
  const [query, setQuery] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState<FilterJobType>("all");
  const [languageFilter, setLanguageFilter] = useState<FilterLanguage>("all");
  const [jobs, setJobs] = useState<ExternalJobWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<ExternalJobWithMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedQuery = useDebouncedValue(query);
  const cacheRef = useRef(
    new Map<
      string,
      {
        jobs: ExternalJobWithMeta[];
        total: number;
        totalPages: number;
      }
    >()
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, jobTypeFilter, languageFilter]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchJobs() {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(JOBS_PER_PAGE),
      });

      if (jobTypeFilter !== "all") params.set("jobType", jobTypeFilter);
      if (debouncedQuery.trim()) params.set("search", debouncedQuery.trim());
      if (languageFilter !== "all") params.set("language", languageFilter);

      const cacheKey = params.toString();
      const cached = cacheRef.current.get(cacheKey);

      if (cached) {
        setJobs(cached.jobs);
        setTotal(cached.total);
        setTotalPages(cached.totalPages);
        setLoading(false);
        setIsRefreshing(true);
      } else if (jobs.length === 0) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await fetch(`/api/external-jobs?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch jobs");
        const data = await response.json();
        const nextJobs = Array.isArray(data.jobs) ? data.jobs : [];
        const nextTotal = typeof data.total === "number" ? data.total : 0;
        const nextTotalPages =
          typeof data.totalPages === "number" ? data.totalPages : 1;

        cacheRef.current.set(cacheKey, {
          jobs: nextJobs,
          total: nextTotal,
          totalPages: nextTotalPages,
        });

        setJobs(nextJobs);
        setTotal(nextTotal);
        setTotalPages(nextTotalPages);
        setError(null);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Unknown error");
        if (jobs.length === 0) {
          setJobs([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    fetchJobs();
    return () => controller.abort();
  }, [currentPage, debouncedQuery, jobTypeFilter, jobs.length, languageFilter]);

  const resultLabel = useMemo(() => {
    if (loading) {
      return (
        <span className="flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading...
        </span>
      );
    }

    if (isRefreshing) {
      return (
        <span className="flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Updating...
        </span>
      );
    }

    return `${total} ${total === 1 ? "job" : "jobs"} found${totalPages > 1 ? ` · Page ${currentPage} of ${totalPages}` : ""}`;
  }, [currentPage, isRefreshing, loading, total, totalPages]);

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="space-y-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search jobs, companies, or locations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search jobs"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              "all",
              "full_time",
              "part_time",
              "internship",
              "contract",
            ] as FilterJobType[]
          ).map((type) => (
            <button
              key={type}
              onClick={() => setJobTypeFilter(type)}
              disabled={loading}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                jobTypeFilter === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {type === "all" ? "All Types" : JOB_TYPE_LABELS[type]}
            </button>
          ))}
          <span className="mx-1 text-border">|</span>
          <button
            onClick={() => setLanguageFilter(languageFilter === "english" ? "all" : "english")}
            disabled={loading}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              languageFilter === "english"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            English
          </button>
        </div>

        <p className="text-xs text-muted-foreground sm:text-sm">
          {resultLabel}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/50 bg-destructive/5 py-16 text-center">
          <p className="text-lg font-medium text-destructive">
            Failed to load jobs
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Briefcase className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-lg font-medium text-muted-foreground">
            No jobs found
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {jobs.length === 0
              ? "Job listings will appear here once crawled."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <>
          <div className="relative">
            <div className="stagger-fade-in grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard
                  key={`${job.source}-${job.externalId}`}
                  job={job}
                  onClick={() => setSelectedJob(job)}
                />
              ))}
            </div>
            {isRefreshing && (
              <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border bg-background/96 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Updating jobs...
                </div>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border px-2 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
              >
                <ChevronLeft className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border px-2 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
              >
                <ChevronRight className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Next</span>
              </button>
            </div>
          )}
        </>
      )}

      {selectedJob && (
        <ExternalJobModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </section>
  );
}
