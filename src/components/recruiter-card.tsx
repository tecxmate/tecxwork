"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight, FileText, BadgeCheck } from "lucide-react";
import { useStudentI18n } from "@/components/student-locale-provider";

export type RecruiterCardData = {
  id: number;
  company: string;
  industry: string;
  description: string;
  positions: string[];
  jdAvailable: boolean;
  logoUrl: string | null;
  verified: boolean;
};

export function RecruiterCard({
  recruiter,
  showPositions = true,
}: {
  recruiter: RecruiterCardData;
  /**
   * Whether to list the company's open roles on the card.
   *
   * The homepage turns this off: it is the public front door, and the badges name actual
   * vacancies. The companies directory keeps them — someone who has navigated to browse
   * employers is asking exactly that question.
   */
  showPositions?: boolean;
}) {
  const { messages } = useStudentI18n();

  return (
    <Link
      href={`/recruiter/${recruiter.id}`}
      className="group block h-full min-w-0 focus-visible:outline-none"
    >
      <Card className="flex h-full min-w-0 cursor-pointer flex-col gap-4 border-border/70 p-4 transition-all duration-200 ease-out group-hover:border-primary/40 group-hover:shadow-[0_0_24px_rgba(140,82,255,0.12)] group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg">
            {recruiter.logoUrl ? (
              <img
                src={recruiter.logoUrl}
                alt={`${recruiter.company} logo`}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-lg border border-border/60 bg-secondary">
                <Building2 className="h-7 w-7 text-primary" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="line-clamp-2 font-heading text-base font-semibold leading-tight sm:text-lg">
              {recruiter.company}
              {recruiter.verified && (
                <span
                  title={messages.recruiterCard.verified}
                  className="ml-1 inline-flex translate-y-0.5 items-center text-primary"
                >
                  <BadgeCheck className="h-4 w-4" aria-label={messages.recruiterCard.verified} />
                </span>
              )}
            </h3>
            <Badge variant="secondary" className="min-w-0 max-w-full !shrink text-xs">
              <span className="block truncate">{recruiter.industry}</span>
            </Badge>
            <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">
              {recruiter.description}
            </p>
          </div>
        </div>

        {showPositions ? (
          <div className="flex-1">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
              {messages.recruiterCard.openPositions}
            </p>
            <div className="flex min-w-0 max-w-full flex-wrap gap-1">
              {recruiter.positions.slice(0, 3).map((pos) => (
                <Badge
                  key={pos}
                  variant="outline"
                  className="min-w-0 max-w-full !shrink text-[10px] font-normal sm:text-xs"
                >
                  <span className="block truncate">{pos}</span>
                </Badge>
              ))}
              {recruiter.positions.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-normal sm:text-xs"
                >
                  +{recruiter.positions.length - 3}
                </Badge>
              )}
            </div>
          </div>
        ) : null}

        {recruiter.jdAvailable && (
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <FileText className="h-3 w-3" />
            <span>{messages.recruiterCard.jdAvailable}</span>
          </div>
        )}

        <div className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
          {messages.recruiterCard.viewBook}
          <ArrowRight className="h-4 w-4" />
        </div>
      </Card>
    </Link>
  );
}
