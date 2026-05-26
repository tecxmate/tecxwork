import {
  Building2,
  Briefcase,
  Tags,
  CalendarClock,
  ExternalLink,
  FileText,
  Globe2,
  Laptop,
  MapPin,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  employmentTypeLabel,
  formatApplicationDeadline,
  formatSalaryRange,
  jobCategoryLabel,
  parseLanguageRequirementTokens,
  type JobPostingLocale,
  seniorityLabel,
  visaSupportLabel,
  workplaceTypeLabel,
} from "@/lib/job-posting";

export type RecruiterJobPosting = {
  id: number;
  recruiterId?: number;
  title: string;
  company?: string;
  logoUrl?: string | null;
  jobCategory: string;
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

type ContentBlock =
  | { type: "list"; items: string[] }
  | { type: "paragraph"; text: string };

function parseContent(value: string): ContentBlock[] {
  const lines = value.split(/\r?\n/);
  const hasMarkers = lines.some((l) => /^\s*[-*•]\s/.test(l));
  const blocks: ContentBlock[] = [];
  let currentList: string[] | null = null;
  const flushList = () => {
    if (currentList && currentList.length) blocks.push({ type: "list", items: currentList });
    currentList = null;
  };
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    const markerMatch = line.match(/^[-*•]\s+(.*)$/);
    if (markerMatch) {
      currentList ??= [];
      currentList.push(markerMatch[1].trim());
    } else if (!hasMarkers) {
      currentList ??= [];
      currentList.push(line);
    } else {
      flushList();
      blocks.push({ type: "paragraph", text: line });
    }
  }
  flushList();
  return blocks;
}

function countBlockItems(blocks: ContentBlock[]) {
  return blocks.reduce((sum, b) => sum + (b.type === "list" ? b.items.length : 1), 0);
}

function limitBlocks(blocks: ContentBlock[], max: number): ContentBlock[] {
  const limited: ContentBlock[] = [];
  let used = 0;
  for (const b of blocks) {
    if (used >= max) break;
    if (b.type === "paragraph") {
      limited.push(b);
      used += 1;
    } else {
      const take = Math.min(b.items.length, max - used);
      limited.push({ type: "list", items: b.items.slice(0, take) });
      used += take;
    }
  }
  return limited;
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
  const blocks = parseContent(value);
  if (blocks.length === 0) return null;

  const total = countBlockItems(blocks);
  if (total === 1 && blocks[0].type === "paragraph") {
    return (
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase text-muted-foreground">
          {label}
        </p>
        <p className={cn("text-sm text-muted-foreground whitespace-pre-wrap", compact ? "line-clamp-2" : "")}>
          {blocks[0].text}
        </p>
      </div>
    );
  }

  const visible = compact ? limitBlocks(blocks, 3) : blocks;

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <div className="space-y-2 text-sm text-muted-foreground">
        {visible.map((block, idx) =>
          block.type === "list" ? (
            <ul
              key={`${label}-list-${idx}`}
              className="space-y-1 pl-6 marker:text-muted-foreground"
            >
              {block.items.map((item, i) => (
                <li key={`${label}-${idx}-${i}`} className="list-disc">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p key={`${label}-p-${idx}`} className="whitespace-pre-wrap">
              {block.text}
            </p>
          )
        )}
      </div>
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
  const categoryLabel = jobCategoryLabel(job.jobCategory, locale);
  const seniority = seniorityLabel(job.seniority, locale);
  const visaSupport = visaSupportLabel(job.visaSupport, locale);
  const applicationDeadline = formatApplicationDeadline(job.applicationDeadline, locale);

  return (
    <Card
      className={cn(
        "min-w-0 border-border/70 p-4 transition-all duration-200 ease-out hover:border-primary/40 hover:shadow-[0_0_24px_rgba(140,82,255,0.12)]",
        className
      )}
    >
      <div className="space-y-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {job.company ? (
              job.recruiterId ? (
                <Link
                  href={`/recruiter/${job.recruiterId}`}
                  className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`View ${job.company}`}
                >
                  {job.logoUrl ? (
                    <img
                      src={job.logoUrl}
                      alt={`${job.company} logo`}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center rounded-lg border border-border/60 bg-secondary">
                      <Building2 className="h-7 w-7 text-primary" />
                    </span>
                  )}
                </Link>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                  {job.logoUrl ? (
                    <img
                      src={job.logoUrl}
                      alt={`${job.company} logo`}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center rounded-lg border border-border/60 bg-secondary">
                      <Building2 className="h-7 w-7 text-primary" />
                    </span>
                  )}
                </div>
              )
            ) : null}
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="line-clamp-2 text-base font-semibold leading-tight">
                {job.title}
              </h3>
              {job.company ? (
                job.recruiterId ? (
                  <Link
                    href={`/recruiter/${job.recruiterId}`}
                    className="line-clamp-1 text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    {job.company}
                  </Link>
                ) : (
                  <span className="line-clamp-1 text-sm text-muted-foreground">
                    {job.company}
                  </span>
                )
              ) : null}
            </div>
          </div>
          {status}
        </div>

        <div className="flex min-w-0 max-w-full flex-wrap gap-1.5 overflow-hidden">
          {job.location ? (
            <Badge
              variant="secondary"
              className="min-w-0 max-w-full shrink justify-start gap-1 text-[10px]"
            >
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="min-w-0 truncate">{job.location}</span>
            </Badge>
          ) : null}
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Briefcase className="h-3 w-3" />
            {employmentLabel}
          </Badge>
          {categoryLabel ? (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Tags className="h-3 w-3" />
              {categoryLabel}
            </Badge>
          ) : null}
          {workplaceLabel ? (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Laptop className="h-3 w-3" />
              {workplaceLabel}
            </Badge>
          ) : null}
          {seniority ? (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <User className="h-3 w-3" />
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
            <Badge
              variant="secondary"
              className="min-w-0 max-w-full shrink justify-start gap-1 text-[10px]"
            >
              <CalendarClock className="h-3 w-3" />
              <span className="min-w-0 truncate">
                {labels.applicationDeadline}: {applicationDeadline}
              </span>
            </Badge>
          ) : null}
          {salaryLabel ? (
            <Badge className="min-w-0 max-w-full shrink justify-start text-[10px]">
              <span className="min-w-0 truncate">{salaryLabel}</span>
            </Badge>
          ) : null}
        </div>

        {job.languageRequirement ? (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">
              {labels.languageRequirement}
            </p>
            <div className="flex flex-wrap items-start gap-1.5">
              <Globe2 className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="flex flex-wrap gap-1.5">
                {parseLanguageRequirementTokens(job.languageRequirement, locale).map(
                  (item) => (
                    <Badge
                      key={item.key}
                      variant="secondary"
                      className="text-[10px]"
                    >
                      {item.label}
                    </Badge>
                  )
                )}
              </div>
            </div>
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
