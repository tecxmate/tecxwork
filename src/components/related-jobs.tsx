import { ArrowRight, Briefcase, Building2, MapPin } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  employmentTypeLabel,
  formatSalaryRange,
  type JobPostingLocale,
} from "@/lib/job-posting";
import { interpolate, type StudentMessages } from "@/lib/student-messages";

export type RelatedJob = {
  id: number;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: string;
};

/**
 * Internal-linking block under a job posting: keeps candidates browsing by
 * surfacing sibling openings plus links back into the category and company.
 */
export function RelatedJobs({
  jobs,
  locale,
  messages,
  categoryHref,
  companyHref,
  companyName,
}: {
  jobs: RelatedJob[];
  locale?: JobPostingLocale;
  messages: StudentMessages;
  categoryHref?: string | null;
  companyHref?: string | null;
  companyName?: string;
}) {
  if (jobs.length === 0) return null;

  const detail = messages.jobDetail;

  return (
    <section aria-labelledby="related-jobs-heading" className="mt-12 border-t pt-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="related-jobs-heading"
            className="font-heading text-xl font-semibold"
          >
            {detail.relatedTitle}
          </h2>
          <p className="text-sm text-muted-foreground">{detail.relatedSubtitle}</p>
        </div>
        <Link
          href={categoryHref ?? "/jobs"}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {detail.viewAllJobs}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((related) => {
          const salaryLabel = formatSalaryRange({
            salaryMin: related.salaryMin,
            salaryMax: related.salaryMax,
            salaryCurrency: related.salaryCurrency,
            salaryPeriod: related.salaryPeriod,
            locale,
          });
          const employment = employmentTypeLabel(related.employmentType, locale);

          return (
            <li key={related.id} className="min-w-0">
              <Link href={`/jobs/${related.id}`} className="block h-full">
                <Card className="flex h-full flex-col gap-2 p-4 transition-all duration-200 ease-out hover:border-primary/40 hover:shadow-[0_0_24px_rgba(140,82,255,0.12)]">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug">
                    {related.title}
                  </p>
                  <p className="inline-flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3 shrink-0" />
                    {related.company}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {related.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {related.location}
                      </span>
                    ) : null}
                    {employment ? (
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {employment}
                      </span>
                    ) : null}
                  </div>
                  {salaryLabel ? (
                    <p className="text-xs font-semibold text-primary">{salaryLabel}</p>
                  ) : null}
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>

      {companyHref && companyName ? (
        <Link
          href={companyHref}
          className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {interpolate(detail.moreFromCompany, { company: companyName })}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </section>
  );
}
