"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RecruiterCard, type RecruiterCardData } from "./recruiter-card";
import { IndustryFilter } from "./industry-filter";

export function Directory() {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All");
  const [recruiters, setRecruiters] = useState<RecruiterCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recruiters")
      .then((r) => r.json())
      .then((data) => setRecruiters(data.recruiters ?? []))
      .catch(() => setRecruiters([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return recruiters.filter((r) => {
      const matchesIndustry = industry === "All" || r.industry === industry;
      const matchesQuery =
        !q ||
        r.company.toLowerCase().includes(q) ||
        r.industry.toLowerCase().includes(q) ||
        r.positions.some((p) => p.toLowerCase().includes(q));
      return matchesIndustry && matchesQuery;
    });
  }, [query, industry, recruiters]);

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="space-y-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search companies or positions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search companies or positions"
          />
        </div>

        {/* Industry filter chips — temporarily disabled */}
        {/* <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <IndustryFilter selected={industry} onSelect={setIndustry} />
        </div> */}

        <p className="text-xs text-muted-foreground sm:text-sm">
          {filtered.length} {filtered.length === 1 ? "company" : "companies"}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading companies...
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No companies found
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RecruiterCard key={r.id} recruiter={r} />
          ))}
        </div>
      )}
    </section>
  );
}
