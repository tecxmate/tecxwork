import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight, Mail } from "lucide-react";

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
    <Card className="flex flex-col transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {recruiter.industry}
          </Badge>
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold leading-tight">
            {recruiter.company}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {recruiter.description}
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Open Positions
        </p>
        <div className="flex flex-wrap gap-1.5">
          {recruiter.positions.map((pos) => (
            <Badge key={pos} variant="outline" className="text-xs font-normal">
              {pos}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <Link
          href={`/recruiter/${recruiter.id}`}
          className="inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          View & Book
          <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span>Share CV with: {recruiter.contactEmail}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
