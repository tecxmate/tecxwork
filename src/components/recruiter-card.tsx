import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight, FileText } from "lucide-react";
import { useStudentI18n } from "@/components/student-locale-provider";

export type RecruiterCardData = {
  id: number;
  company: string;
  industry: string;
  description: string;
  positions: string[];
  contactEmail: string;
  jdAvailable: boolean;
  logoUrl: string | null;
};

export function RecruiterCard({ recruiter }: { recruiter: RecruiterCardData }) {
  const { messages } = useStudentI18n();

  return (
    <Link
      href={`/recruiter/${recruiter.id}`}
      className="group block h-full min-w-0 focus-visible:outline-none"
    >
      <Card className="flex h-full cursor-pointer flex-col gap-4 p-4 group-focus-visible:ring-2 group-focus-visible:ring-ring sm:p-5">
        {/* Top row: logo + industry */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary sm:h-12 sm:w-12">
            {recruiter.logoUrl ? (
              <img
                src={recruiter.logoUrl}
                alt={`${recruiter.company} logo`}
                className="h-full w-full object-contain"
              />
            ) : (
              <Building2 className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            )}
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {recruiter.industry}
          </Badge>
        </div>

        {/* Company name + description */}
        <div>
          <h3 className="font-heading text-base font-semibold leading-tight sm:text-lg">
            {recruiter.company}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
            {recruiter.description}
          </p>
        </div>

        {/* Positions */}
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

        {/* JD available indicator */}
        {recruiter.jdAvailable && (
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <FileText className="h-3 w-3" />
            <span>{messages.recruiterCard.jdAvailable}</span>
          </div>
        )}

        {/* CTA */}
        <div className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
          {messages.recruiterCard.viewBook}
          <ArrowRight className="h-4 w-4" />
        </div>
      </Card>
    </Link>
  );
}
