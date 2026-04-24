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
  type JobPostingLocale,
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
  benefits: string;
};

type JobCardLabels = {
  seniority: string;
  languageRequirement: string;
  visaSupport: string;
  applicationDeadline: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
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
  benefits: "Benefits",
  viewJd: "View JD",
  noJd: "No JD link",
};

function splitTextItems(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim());
}

function TextBlock({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  const items = splitTextItems(value);

  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase text-muted-foreground">
          {label}
        </p>
        <p className={cn("text-sm text-muted-foreground whitespace-pre-wrap", compact ? "line-clamp-2" : "")}>
          {items[0]}
        </p>
      </div>
    );
  }

  const visibleItems = compact ? items.slice(0, 3) : items;

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <ul className="space-y-1 pl-4 text-sm text-muted-foreground">
        {visibleItems.map((item, index) => (
          <li key={`${label}-${index}`} className="list-disc">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RecruiterJobPostingCard({
  job,
  className,
  status,
  action,
  labels = defaultLabels,
  compact = false,
  locale,
}: {
  job: RecruiterJobPosting;
  className?: string;
  status?: React.ReactNode;
  action?: React.ReactNode;
  labels?: JobCardLabels;
  compact?: boolean;
  locale?: JobPostingLocale;
}) {
  const salaryLabel = formatSalaryRange({
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    salaryPeriod: job.salaryPeriod,
    locale,
  });
  const employmentLabel =
    employmentTypeLabel(job.employmentType, locale) || "Employment";
  const workplaceLabel = workplaceTypeLabel(job.workplaceType, locale);
  const seniority = seniorityLabel(job.seniority, locale);
  const visaSupport = visaSupportLabel(job.visaSupport, locale);
  const applicationDeadline = formatApplicationDeadline(job.applicationDeadline, locale);

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

        <TextBlock label={labels.description} value={job.description} compact={compact} />
        <TextBlock
          label={labels.responsibilities}
          value={job.responsibilities}
          compact={compact}
        />
        <TextBlock label={labels.requirements} value={job.requirements} compact={compact} />
        <TextBlock label={labels.benefits} value={job.benefits} compact={compact} />

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
