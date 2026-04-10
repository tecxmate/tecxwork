"use client";

import { cn } from "@/lib/utils";
import { INDUSTRIES } from "@/lib/data";

export function IndustryFilter({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (industry: string) => void;
}) {
  return (
    <div
      className="flex gap-2 whitespace-nowrap sm:flex-wrap"
      role="tablist"
      aria-label="Filter by industry"
    >
      {INDUSTRIES.map((industry) => (
        <button
          key={industry}
          role="tab"
          aria-selected={selected === industry}
          onClick={() => onSelect(industry)}
          className={cn(
            "cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-150",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            selected === industry
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          {industry}
        </button>
      ))}
    </div>
  );
}
