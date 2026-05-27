"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { RecruiterCard, type RecruiterCardData } from "./recruiter-card";
import { useStudentI18n } from "@/components/student-locale-provider";

const COMPANIES_PER_PAGE = 12;

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

export function Directory() {
  const { messages } = useStudentI18n();
  const [query, setQuery] = useState("");
  const [recruiters, setRecruiters] = useState<RecruiterCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedQuery = useDebouncedValue(query);
  const cacheRef = useRef(
    new Map<
      string,
      {
        recruiters: RecruiterCardData[];
        total: number;
        totalPages: number;
      }
    >()
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const sectionRef = useRef<HTMLElement>(null);
  const isFirstPageEffect = useRef(true);
  useEffect(() => {
    if (isFirstPageEffect.current) {
      isFirstPageEffect.current = false;
      return;
    }
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecruiters() {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(COMPANIES_PER_PAGE),
      });

      if (debouncedQuery.trim()) {
        params.set("search", debouncedQuery.trim());
      }

      const cacheKey = params.toString();
      const cached = cacheRef.current.get(cacheKey);

      if (cached) {
        setRecruiters(cached.recruiters);
        setTotal(cached.total);
        setTotalPages(cached.totalPages);
        setLoading(false);
        setIsRefreshing(true);
      } else if (recruiters.length === 0) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);

      try {
        const response = await fetch(`/api/recruiters?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(messages.directory.failedToLoad);
        }

        const data = await response.json();
        const nextRecruiters = Array.isArray(data.recruiters) ? data.recruiters : [];
        const nextTotal = typeof data.total === "number" ? data.total : 0;
        const nextTotalPages =
          typeof data.totalPages === "number" ? data.totalPages : 1;

        cacheRef.current.set(cacheKey, {
          recruiters: nextRecruiters,
          total: nextTotal,
          totalPages: nextTotalPages,
        });

        setRecruiters(nextRecruiters);
        setTotal(nextTotal);
        setTotalPages(nextTotalPages);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (recruiters.length === 0) {
          setRecruiters([]);
          setTotal(0);
          setTotalPages(1);
        }
        setError(
          err instanceof Error ? err.message : messages.directory.failedToLoad
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    loadRecruiters();
    return () => controller.abort();
  }, [debouncedQuery, page, recruiters.length]);

  const resultLabel = useMemo(() => {
    if (loading) {
      return (
        <span className="flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          {messages.common.loading}
        </span>
      );
    }

    return `${total} ${
      total === 1
        ? messages.directory.companySingular
        : messages.directory.companyPlural
    }${
      totalPages > 1
        ? ` · ${messages.directory.page} ${page} ${messages.directory.of} ${totalPages}`
        : ""
    }`;
  }, [loading, messages, total, totalPages, page]);

  return (
    <section ref={sectionRef} className="space-y-4 sm:space-y-6 scroll-mt-20">
      <div className="space-y-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={messages.directory.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label={messages.directory.searchAria}
          />
        </div>

        <p className="text-xs text-muted-foreground sm:text-sm">{resultLabel}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              {messages.directory.loadingCompanies}
            </span>
          </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/50 bg-destructive/5 py-16 text-center">
          <p className="text-lg font-medium text-destructive">
            {messages.directory.failedToLoad}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      ) : recruiters.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            {messages.directory.noCompanies}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {messages.directory.tryAdjustingSearch}
          </p>
        </div>
      ) : (
        <>
          <div className="stagger-fade-in grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recruiters.map((recruiter) => (
              <RecruiterCard key={recruiter.id} recruiter={recruiter} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-lg border px-2 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
              >
                <ChevronLeft className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">{messages.common.previous}</span>
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, index) => {
                  let pageNumber: number;
                  if (totalPages <= 7) {
                    pageNumber = index + 1;
                  } else if (page <= 4) {
                    pageNumber = index + 1;
                  } else if (page >= totalPages - 3) {
                    pageNumber = totalPages - 6 + index;
                  } else {
                    pageNumber = page - 3 + index;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNumber
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page === totalPages}
                className="rounded-lg border px-2 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
              >
                <ChevronRight className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">{messages.common.next}</span>
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
