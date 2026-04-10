import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight } from "lucide-react";

export type RecruiterCardData = {
  id: number;
  company: string;
  industry: string;
  description: string;
  positions: string[];
  contactEmail: string;
};

export function RecruiterCard({ recruiter }: { recruiter: RecruiterCardData }) {
  return (
    <Link
      href={`/recruiter/${recruiter.id}`}
      className="group block h-full focus-visible:outline-none"
    >
      <Card className="flex h-full flex-col cursor-pointer transition-shadow duration-200 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardHeader className="gap-3 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary sm:h-12 sm:w-12">
              <Building2 className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {recruiter.industry}
            </Badge>
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold leading-tight sm:text-lg">
              {recruiter.company}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
              {recruiter.description}
            </p>
          </div>
        </CardHeader>

        <CardContent className="flex-1 pb-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
            Open Positions
          </p>
          <div className="flex flex-wrap gap-1">
            {recruiter.positions.slice(0, 3).map((pos) => (
              <Badge
                key={pos}
                variant="outline"
                className="text-[10px] font-normal sm:text-xs"
              >
                {pos}
              </Badge>
            ))}
            {recruiter.positions.length > 3 && (
              <Badge variant="outline" className="text-[10px] font-normal sm:text-xs">
                +{recruiter.positions.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <div className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors group-hover:bg-primary/80">
            View & Book
            <ArrowRight className="h-4 w-4" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
