"use client";

import { useEffect } from "react";
import {
  MapPin,
  ExternalLink,
  Building2,
  Briefcase,
  DollarSign,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export interface ExternalJob {
  id: number;
  source: "104" | "1111";
  externalId?: string;
  title: string;
  company: string;
  location: string;
  snippet: string;
  jobType: "full_time" | "part_time" | "internship" | "contract" | null;
  salary: string | null;
  externalUrl: string;
  lastSeenAt?: string;
}

export const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  internship: "Internship",
  contract: "Contract",
};

export function ExternalJobModal({
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
      className="fixed inset-0 z-50 flex items-end justify-center pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:items-center sm:pb-0"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg max-h-[calc(100vh-6rem-env(safe-area-inset-bottom))] overflow-y-auto rounded-t-2xl sm:max-h-[90vh] sm:rounded-2xl bg-card shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
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
