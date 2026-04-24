import {
  Building2,
  Briefcase,
  CalendarClock,
  ExternalLink,
  FileText,
  Globe2,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  employmentTypeLabel,
  formatApplicationDeadline,
  formatSalaryRange,
  seniorityLabel,
  visaSupportLabel,
  workplaceTypeLabel,
} from "@/lib/job-posting";

export type RecruiterJobPosting = {
  id: number;
  title: string;
  company?: string;
  jdLink: string | null;
  location: string;
  employmentType: string;
  workplaceType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: string;
  seniority: string;
  languageRequirement: string;
  visaSupport: string;
  applicationDeadline: string | null;
  description: string;
  responsibilities: string;
  requirements: string;
};

type JobCardLabels = {
  seniority: string;
  languageRequirement: string;
  visaSupport: string;
  applicationDeadline: string;
  description: string;
  responsibilities: string;
  requirements: string;
  viewJd: string;
  noJd: string;
};

const defaultLabels: JobCardLabels = {
  seniority: "Seniority",
  languageRequirement: "Language requirement",
  visaSupport: "Visa support",
  applicationDeadline: "Application deadline",
  description: "Description",
  responsibilities: "Responsibilities",
  requirements: "Requirements",
  viewJd: "View JD",
  noJd: "No JD link",
};

export function RecruiterJobPostingCard({
  job,
  className,
  status,
  action,
  labels = defaultLabels,
  compact = false,
}: {
  job: RecruiterJobPosting;
  className?: string;
  status?: React.ReactNode;
  action?: React.ReactNode;
  labels?: JobCardLabels;
  compact?: boolean;
}) {
  const salaryLabel = formatSalaryRange({
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    salaryPeriod: job.salaryPeriod,
  });
  const employmentLabel = employmentTypeLabel(job.employmentType) || "Employment";
  const workplaceLabel = workplaceTypeLabel(job.workplaceType);
  const seniority = seniorityLabel(job.seniority);
  const visaSupport = visaSupportLabel(job.visaSupport);
  const applicationDeadline = formatApplicationDeadline(job.applicationDeadline);

  return (
    <Card
      className={cn(
        "border-border/70 p-4 transition-all duration-200 ease-out hover:border-primary/40 hover:shadow-[0_0_24px_rgba(140,82,255,0.12)]",
        className
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="line-clamp-2 text-base font-semibold leading-tight">
              {job.title}
            </h3>
            {job.company ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">{job.company}</span>
              </p>
            ) : null}
          </div>
          {status}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {job.location ? (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <MapPin className="h-3 w-3" />
              {job.location}
            </Badge>
          ) : null}
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Briefcase className="h-3 w-3" />
            {employmentLabel}
          </Badge>
          {workplaceLabel ? (
            <Badge variant="secondary" className="text-[10px]">
              {workplaceLabel}
            </Badge>
          ) : null}
          {salaryLabel ? (
            <Badge className="text-[10px]">{salaryLabel}</Badge>
          ) : null}
          {seniority ? (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Sparkles className="h-3 w-3" />
              {seniority}
            </Badge>
          ) : null}
          {visaSupport ? (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <ShieldCheck className="h-3 w-3" />
              {visaSupport}
            </Badge>
          ) : null}
          {applicationDeadline ? (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <CalendarClock className="h-3 w-3" />
              {labels.applicationDeadline}: {applicationDeadline}
            </Badge>
          ) : null}
        </div>

        {job.languageRequirement ? (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">
              {labels.languageRequirement}
            </p>
            <p
              className={cn(
                "flex items-start gap-2 text-sm text-muted-foreground",
                compact ? "line-clamp-2" : "line-clamp-3"
              )}
            >
              <Globe2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{job.languageRequirement}</span>
            </p>
          </div>
        ) : null}

        {job.description ? (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">
              {labels.description}
            </p>
            <p className={cn("text-sm text-muted-foreground", compact ? "line-clamp-2" : "line-clamp-3")}>
              {job.description}
            </p>
          </div>
        ) : null}

        {job.responsibilities ? (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">
              {labels.responsibilities}
            </p>
            <p className={cn("text-sm text-muted-foreground", compact ? "line-clamp-2" : "line-clamp-3")}>
              {job.responsibilities}
            </p>
          </div>
        ) : null}

        {job.requirements ? (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">
              {labels.requirements}
            </p>
            <p className={cn("text-sm text-muted-foreground", compact ? "line-clamp-2" : "line-clamp-3")}>
              {job.requirements}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          {job.jdLink ? (
            <a
              href={job.jdLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <FileText className="h-3 w-3" />
              {labels.viewJd}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">{labels.noJd}</span>
          )}
          {action}
        </div>
      </div>
    </Card>
  );
}
