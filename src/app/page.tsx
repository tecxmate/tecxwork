import Link from "next/link";
import {
  ArrowRight,
  Users,
  MapPin,
  Clock,
  Building2,
  Briefcase,
  ChevronRight,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/countdown";
import { SiteFooter } from "@/components/site-footer";
import { AppTopBar } from "@/components/app-topbar";
import { ExternalJobsPreview } from "@/components/external-jobs-preview";
import { EVENT_CONFIG } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { db, recruiters, jobOpenings, users, externalJobs } from "@/lib/db";
import { eq, desc, or, and, ilike, not } from "drizzle-orm";

// Placeholder event photos - replace with actual photos
const EVENT_PHOTOS = [
  { id: 1, alt: "Career fair networking", placeholder: true },
  { id: 2, alt: "Interview session", placeholder: true },
  { id: 3, alt: "Company presentations", placeholder: true },
  { id: 4, alt: "Student registration", placeholder: true },
];

async function getPublicRecruiters() {
  const recruiterList = await db
    .select({
      id: recruiters.id,
      company: recruiters.company,
      industry: recruiters.industry,
      description: recruiters.description,
    })
    .from(recruiters)
    .innerJoin(users, eq(recruiters.userId, users.id))
    .orderBy(recruiters.company)
    .limit(6);

  const approvedJobs = await db
    .select({
      recruiterId: jobOpenings.recruiterId,
      title: jobOpenings.title,
    })
    .from(jobOpenings)
    .where(eq(jobOpenings.moderationStatus, "approved"));

  const jobsByRecruiter = new Map<number, string[]>();
  for (const job of approvedJobs) {
    const titles = jobsByRecruiter.get(job.recruiterId) ?? [];
    titles.push(job.title);
    jobsByRecruiter.set(job.recruiterId, titles);
  }

  return recruiterList.map((recruiter) => ({
    ...recruiter,
    positions: jobsByRecruiter.get(recruiter.id) ?? [],
  }));
}

async function getPublicJobs() {
  const result = await db
    .select({
      id: jobOpenings.id,
      title: jobOpenings.title,
      description: jobOpenings.description,
      company: recruiters.company,
      industry: recruiters.industry,
    })
    .from(jobOpenings)
    .innerJoin(recruiters, eq(jobOpenings.recruiterId, recruiters.id))
    .where(eq(jobOpenings.moderationStatus, "approved"))
    .limit(8);

  return result;
}

async function getExternalJobsPreview() {
  const vietnamKeywords = or(
    ilike(externalJobs.title, "%越南%"),
    ilike(externalJobs.title, "%vietnam%"),
    ilike(externalJobs.company, "%越南%"),
    ilike(externalJobs.company, "%vietnam%"),
    ilike(externalJobs.snippet, "%越南%"),
    ilike(externalJobs.snippet, "%vietnam%")
  );

  const excludeOtherNationalities = and(
    not(ilike(externalJobs.title, "%英語%")),
    not(ilike(externalJobs.title, "%english%")),
    not(ilike(externalJobs.title, "%印尼%")),
    not(ilike(externalJobs.title, "%indonesia%")),
    not(ilike(externalJobs.snippet, "%英語母語%")),
    not(ilike(externalJobs.snippet, "%native english%")),
    not(ilike(externalJobs.snippet, "%印尼%")),
    not(ilike(externalJobs.snippet, "%indonesia%"))
  );

  const result = await db
    .select({
      id: externalJobs.id,
      source: externalJobs.source,
      title: externalJobs.title,
      company: externalJobs.company,
      location: externalJobs.location,
      jobType: externalJobs.jobType,
      salary: externalJobs.salary,
      snippet: externalJobs.snippet,
      externalUrl: externalJobs.externalUrl,
    })
    .from(externalJobs)
    .where(and(vietnamKeywords, excludeOtherNationalities))
    .orderBy(desc(externalJobs.lastSeenAt))
    .limit(8);

  return result;
}

export default async function LandingPage() {
  const session = await getSession();

  // Determine dashboard URL for logged-in users
  const dashboardUrl = session
    ? session.role === "admin"
      ? "/admin"
      : session.role === "recruiter"
        ? "/dashboard"
        : "/browse"
    : null;

  const [publicRecruiters, publicJobs, externalJobsPreview] = await Promise.all([
    getPublicRecruiters(),
    getPublicJobs(),
    getExternalJobsPreview(),
  ]);

  const formattedDate = EVENT_CONFIG.date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: EVENT_CONFIG.timezone,
  });

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {/* Header */}
      <AppTopBar
        desktopActions={
          session ? (
            <Link
              href={dashboardUrl!}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Log In
              </Link>
              <Link
                href="/get-started"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Sign Up
              </Link>
            </>
          )
        }
      />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-primary/5 to-background px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4">{EVENT_CONFIG.organizerShort}</Badge>
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {EVENT_CONFIG.name}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base italic text-muted-foreground sm:text-lg">
              &ldquo;{EVENT_CONFIG.tagline}&rdquo;
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground sm:text-base">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                10:00 - 17:30
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                {EVENT_CONFIG.hostedAt}
              </span>
            </div>

            <div className="mt-8 flex justify-center">
              <Countdown target={EVENT_CONFIG.date} />
            </div>

            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              {session ? (
                <Link
                  href={dashboardUrl!}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                >
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <Link
                  href="/get-started"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                >
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}
              <Link
                href="#companies"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-8 text-base font-medium transition-colors hover:bg-secondary sm:w-auto"
              >
                Browse Companies
              </Link>
              <Link
                href="#jobs"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-8 text-base font-medium transition-colors hover:bg-secondary sm:w-auto"
              >
                <Briefcase className="h-4 w-4" />
                Find Jobs
              </Link>
              <Link
                href="/jobs"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-8 text-base font-medium transition-colors hover:bg-secondary sm:w-auto"
              >
                <ExternalLink className="h-4 w-4" />
                External Jobs
              </Link>
            </div>
          </div>
        </section>

        {/* Event Photos Section */}
        <section className="border-b px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                Event Highlights
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Moments from our career fair events
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {EVENT_PHOTOS.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-[4/3] overflow-hidden rounded-xl bg-secondary"
                >
                  {photo.placeholder ? (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Users className="mx-auto h-8 w-8 opacity-50" />
                        <p className="mt-2 text-xs">{photo.alt}</p>
                      </div>
                    </div>
                  ) : (
                    // Replace with actual Image component when photos are added
                    <div className="h-full w-full bg-secondary" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recruiters Section */}
        <section id="companies" className="border-b px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                  Participating Companies
                </h2>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Connect with top employers at the event
                </p>
              </div>
              <Link
                href="/get-started"
                className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {publicRecruiters.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {publicRecruiters.map((recruiter) => (
                  <Link
                    key={recruiter.id}
                    href={`/recruiter/${recruiter.id}`}
                    className="group block"
                  >
                    <Card className="flex h-full flex-col gap-3 p-4 transition-all duration-200 ease-out group-hover:border-primary/40 group-hover:shadow-[0_0_24px_rgba(140,82,255,0.12)] group-hover:-translate-y-0.5 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary sm:h-12 sm:w-12">
                          <Building2 className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {recruiter.industry}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-heading text-base font-semibold group-hover:text-primary sm:text-lg">
                          {recruiter.company}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                          {recruiter.description || "Join us at the career fair to learn more about opportunities."}
                        </p>
                      </div>
                      {recruiter.positions.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {recruiter.positions.slice(0, 2).map((pos) => (
                            <Badge
                              key={pos}
                              variant="outline"
                              className="text-[10px] font-normal sm:text-xs"
                            >
                              {pos}
                            </Badge>
                          ))}
                          {recruiter.positions.length > 2 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-normal sm:text-xs"
                            >
                              +{recruiter.positions.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="mt-auto flex items-center gap-1 text-xs font-medium text-primary">
                        View positions
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="flex flex-col items-center justify-center py-16 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium text-muted-foreground">
                  Companies coming soon
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check back later for participating companies
                </p>
              </Card>
            )}

            <Link
              href="/get-started"
              className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline sm:hidden"
            >
              View all companies
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Jobs Section */}
        <section id="jobs" className="border-b px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                  Open Positions
                </h2>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Explore career opportunities
                </p>
              </div>
              <Link
                href="/get-started"
                className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {publicJobs.length > 0 ? (
              <div className="stagger-fade-in grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {publicJobs.map((job) => (
                  <Card key={job.id} className="p-4 transition-all duration-200 ease-out hover:border-primary/40 hover:shadow-[0_0_24px_rgba(140,82,255,0.12)] hover:-translate-y-0.5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold">
                          {job.title}
                        </h3>
                        <p className="truncate text-xs text-muted-foreground">
                          {job.company}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium text-muted-foreground">
                  Positions coming soon
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Companies will post openings as the event approaches
                </p>
              </Card>
            )}

            <Link
              href="/get-started"
              className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline sm:hidden"
            >
              View all positions
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* External Jobs Section */}
        <section className="border-b px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                  External Job Opportunities
                </h2>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  More opportunities from Taiwan job banks
                </p>
              </div>
              <Link
                href="/jobs"
                className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
              >
                Browse all
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <ExternalJobsPreview jobs={externalJobsPreview} />

            <Link
              href="/jobs"
              className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline sm:hidden"
            >
              Browse all external jobs
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Final CTA Section */}
        {!session && (
          <section className="px-4 py-16 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-2xl font-bold sm:text-4xl">
                Ready to Join?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Register now to book interview slots with top companies and take the next step in your career.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/get-started"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                >
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
