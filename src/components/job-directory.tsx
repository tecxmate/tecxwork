"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Loader2,
  ExternalLink,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ExternalJob {
  id: number;
  source: "104" | "1111";
  externalId: string;
  title: string;
  company: string;
  location: string;
  snippet: string;
  jobType: "full_time" | "part_time" | "internship" | "contract" | null;
  salary: string | null;
  externalUrl: string;
  lastSeenAt: string;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  internship: "Internship",
  contract: "Contract",
};

const JOB_TYPE_ORDER: Record<string, number> = {
  full_time: 1,
  part_time: 2,
  internship: 3,
  contract: 4,
};

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
  job: ExternalJob;
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

function JobModal({
  job,
  onClose,
}: {
  job: ExternalJob;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-card shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3 sm:px-6">
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 text-xs"
          >
            {job.source}
          </Badge>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold leading-tight">{job.title}</h2>
            <p className="mt-2 flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              {job.company}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </div>
            {job.jobType && (
              <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm">
                <Briefcase className="h-3.5 w-3.5" />
                {JOB_TYPE_LABELS[job.jobType]}
              </div>
            )}
            {job.salary && (
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-sm font-medium">
                <DollarSign className="h-3.5 w-3.5" />
                {job.salary}
              </div>
            )}
          </div>

          {job.snippet && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Job Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {job.snippet}
              </p>
            </div>
          )}

          <div className="pt-2">
            <a
              href={job.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                className: "w-full gap-2 h-12 text-base",
              })}
            >
              Apply on {job.source}
              <ExternalLink className="h-4 w-4" />
            </a>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              You will be redirected to {job.source} Job Bank to complete your application
            </p>
          </div>
        </div>
      </div>
    </div>
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

function isEnglishTitle(title: string): boolean {
  const asciiLetters = (title.match(/[a-zA-Z]/g) || []).length;
  const chineseChars = (title.match(/[\u4e00-\u9fff]/g) || []).length;
  if (asciiLetters + chineseChars === 0) return false;
  return asciiLetters > chineseChars;
}

export function JobDirectory() {
  const [query, setQuery] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState<FilterJobType>("all");
  const [languageFilter, setLanguageFilter] = useState<FilterLanguage>("all");
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<ExternalJob | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchJobs = useCallback(async (jobType: FilterJobType) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (jobType !== "all") params.set("jobType", jobType);
      params.set("limit", "500");

      const response = await fetch(`/api/external-jobs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch jobs");
      const data = await response.json();
      setJobs(data.jobs ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(jobTypeFilter);
  }, [jobTypeFilter, fetchJobs]);

  const filtered = useMemo(() => {
    let result = jobs;

    const q = query.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.snippet.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q)
      );
    }

    if (languageFilter === "english") {
      result = result.filter((job) => isEnglishTitle(job.title));
    }

    result = [...result].sort((a, b) => {
      const orderA = a.jobType ? JOB_TYPE_ORDER[a.jobType] ?? 99 : 99;
      const orderB = b.jobType ? JOB_TYPE_ORDER[b.jobType] ?? 99 : 99;
      return orderA - orderB;
    });

    return result;
  }, [query, jobs, languageFilter]);

  const totalPages = Math.ceil(filtered.length / JOBS_PER_PAGE);
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * JOBS_PER_PAGE;
    return filtered.slice(start, start + JOBS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, jobTypeFilter, languageFilter]);

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
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading...
            </span>
          ) : (
            `${filtered.length} ${filtered.length === 1 ? "job" : "jobs"} found${totalPages > 1 ? ` · Page ${currentPage} of ${totalPages}` : ""}`
          )}
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
      ) : filtered.length === 0 ? (
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
          <div className="stagger-fade-in grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedJobs.map((job) => (
              <JobCard
                key={`${job.source}-${job.externalId}`}
                job={job}
                onClick={() => setSelectedJob(job)}
              />
            ))}
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
        <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </section>
  );
}
