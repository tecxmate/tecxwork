import {
  Briefcase,
  Building2,
  CalendarClock,
  ExternalLink,
  FileText,
  Globe2,
  Laptop,
  MapPin,
  ShieldCheck,
  Tags,
  User,
} from "lucide-react";
import Link from "next/link";

import { TextBlock, type RecruiterJobPosting } from "@/components/recruiter-job-posting-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import type { StudentMessages } from "@/lib/student-messages";

type JobDetailJob = RecruiterJobPosting & {
  recruiterId?: number;
  company?: string;
};

function FactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

/**
 * Job detail reading layout: the job content itself sits in the left (primary)
 * column and the supporting company / summary / apply panel sits on the right,
 * matching left-to-right reading flow.
 */
export function JobDetailContent({
  job,
  locale,
  messages,
  apply,
  note,
}: {
  job: JobDetailJob;
  locale?: JobPostingLocale;
  messages: StudentMessages;
  /** Apply button or applied-status badge. */
  apply?: React.ReactNode;
  /** Small note rendered under the apply control. */
  note?: React.ReactNode;
}) {
  const labels = messages.jobsPage.card;
  const detail = messages.jobDetail;

  const salaryLabel = formatSalaryRange({
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    salaryPeriod: job.salaryPeriod,
    locale,
  });
  const employmentLabel = employmentTypeLabel(job.employmentType, locale);
  const workplaceLabel = workplaceTypeLabel(job.workplaceType, locale);
  const categoryLabel = jobCategoryLabel(job.jobCategory, locale);
  const seniority = seniorityLabel(job.seniority, locale);
  const visaSupport = visaSupportLabel(job.visaSupport, locale);
  const applicationDeadline = formatApplicationDeadline(job.applicationDeadline, locale);
  const languageTokens = job.languageRequirement
    ? parseLanguageRequirementTokens(job.languageRequirement, locale)
    : [];

  return (
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <article className="min-w-0 space-y-5">
        <header className="space-y-3">
          <h1 className="font-heading text-2xl font-semibold leading-tight sm:text-3xl">
            {job.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
            {job.company ? (
              job.recruiterId ? (
                <Link
                  href={`/recruiter/${job.recruiterId}`}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {job.company}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{job.company}</span>
              )
            ) : null}
            {job.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            ) : null}
            {employmentLabel ? (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {employmentLabel}
              </span>
            ) : null}
          </div>
        </header>

        <div className="space-y-5 border-t pt-5">
          <TextBlock label={labels.description} value={job.description} />
          <TextBlock label={labels.responsibilities} value={job.responsibilities} />
          <TextBlock label={labels.requirements} value={job.requirements} />
          <TextBlock label={labels.benefits} value={job.benefits} />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
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
        </div>
      </article>

      <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
        <Card className="space-y-3 p-4">
          {salaryLabel ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {detail.salary}
              </p>
              <p className="font-heading text-lg font-semibold text-primary">
                {salaryLabel}
              </p>
            </div>
          ) : null}
          {apply ? <div className="flex flex-col gap-2 [&>*]:w-full">{apply}</div> : null}
          {note ? <div className="text-xs text-muted-foreground">{note}</div> : null}
          {applicationDeadline ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              {labels.applicationDeadline}: {applicationDeadline}
            </p>
          ) : null}
        </Card>

        {job.company ? (
          <Card className="p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {detail.aboutCompany}
            </p>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-secondary">
                {job.logoUrl ? (
                  <img
                    src={job.logoUrl}
                    alt={`${job.company} logo`}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-primary" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{job.company}</p>
                {job.recruiterId ? (
                  <Link
                    href={`/recruiter/${job.recruiterId}`}
                    className="text-xs text-primary hover:underline"
                  >
                    {detail.viewCompanyJobs}
                  </Link>
                ) : null}
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {detail.overview}
          </p>
          <div className="divide-y divide-border/60">
            {job.location ? (
              <FactRow
                icon={<MapPin className="h-4 w-4" />}
                label={detail.location}
                value={job.location}
              />
            ) : null}
            {employmentLabel ? (
              <FactRow
                icon={<Briefcase className="h-4 w-4" />}
                label={detail.employmentType}
                value={employmentLabel}
              />
            ) : null}
            {workplaceLabel ? (
              <FactRow
                icon={<Laptop className="h-4 w-4" />}
                label={detail.workplaceType}
                value={workplaceLabel}
              />
            ) : null}
            {categoryLabel ? (
              <FactRow
                icon={<Tags className="h-4 w-4" />}
                label={detail.category}
                value={categoryLabel}
              />
            ) : null}
            {seniority ? (
              <FactRow
                icon={<User className="h-4 w-4" />}
                label={labels.seniority}
                value={seniority}
              />
            ) : null}
            {visaSupport ? (
              <FactRow
                icon={<ShieldCheck className="h-4 w-4" />}
                label={labels.visaSupport}
                value={visaSupport}
              />
            ) : null}
            {languageTokens.length > 0 ? (
              <FactRow
                icon={<Globe2 className="h-4 w-4" />}
                label={labels.languageRequirement}
                value={
                  <span className="flex flex-wrap gap-1.5 pt-0.5">
                    {languageTokens.map((item) => (
                      <Badge key={item.key} variant="secondary" className="text-[10px]">
                        {item.label}
                      </Badge>
                    ))}
                  </span>
                }
              />
            ) : null}
          </div>
        </Card>
      </aside>
    </div>
  );
}
