"use client";

import { useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalJobModal, type ExternalJob } from "@/components/external-job-modal";

export function ExternalJobsPreview({ jobs }: { jobs: ExternalJob[] }) {
  const [selectedJob, setSelectedJob] = useState<ExternalJob | null>(null);

  if (jobs.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12 text-center">
        <ExternalLink className="h-10 w-10 text-muted-foreground/50" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">
          External jobs loading
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Job listings from Taiwan job banks will appear here
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="stagger-fade-in grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {jobs.map((job) => (
          <button
            key={job.id}
            onClick={() => setSelectedJob(job)}
            className="group block text-left"
          >
            <Card className="flex h-full flex-col gap-2 p-4 transition-all duration-200 ease-out group-hover:border-primary/40 group-hover:shadow-[0_0_24px_rgba(140,82,255,0.12)] group-hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-semibold group-hover:text-primary">
                  {job.title}
                </h3>
                <Badge
                  variant="secondary"
                  className="shrink-0 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 text-[10px]"
                >
                  {job.source}
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {job.company}
              </p>
              <div className="mt-auto flex items-center justify-between pt-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
              </div>
            </Card>
          </button>
        ))}
      </div>

      {selectedJob && (
        <ExternalJobModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </>
  );
}
