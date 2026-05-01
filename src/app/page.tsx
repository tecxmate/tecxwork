import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Clock,
  Building2,
  Briefcase,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/countdown";
import { InstallPrompt } from "@/components/install-prompt";
import { RecruiterJobPostingCard } from "@/components/recruiter-job-posting-card";
import { SiteFooter } from "@/components/site-footer";
import { AppTopBar } from "@/components/app-topbar";
import { HeroCarousel } from "@/components/hero-carousel";
import { LogoutButton } from "@/components/logout-button";
import { HomepageImageEditor } from "@/components/homepage-image-editor";
import { EVENT_CONFIG } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { db, recruiters, jobOpenings, users, eventConfig } from "@/lib/db";
import { getStudentLocale } from "@/lib/student-locale.server";
import { getStudentMessages } from "@/lib/student-messages";
import { eq } from "drizzle-orm";

const EVENT_PHOTO_PLACEHOLDERS = [
  { id: 1, alt: "Career fair networking" },
  { id: 2, alt: "Interview session" },
  { id: 3, alt: "Company presentations" },
  { id: 4, alt: "Student registration" },
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
      recruiterId: recruiters.id,
      title: jobOpenings.title,
      jdLink: jobOpenings.jdLink,
      location: jobOpenings.location,
      employmentType: jobOpenings.employmentType,
      workplaceType: jobOpenings.workplaceType,
      salaryMin: jobOpenings.salaryMin,
      salaryMax: jobOpenings.salaryMax,
      salaryCurrency: jobOpenings.salaryCurrency,
      salaryPeriod: jobOpenings.salaryPeriod,
      seniority: jobOpenings.seniority,
      languageRequirement: jobOpenings.languageRequirement,
      visaSupport: jobOpenings.visaSupport,
      applicationDeadline: jobOpenings.applicationDeadline,
      responsibilities: jobOpenings.responsibilities,
      requirements: jobOpenings.requirements,
      benefits: jobOpenings.benefits,
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

async function getHomepageImages() {
  const [config] = await db
    .select({ homepageImages: eventConfig.homepageImages })
    .from(eventConfig)
    .limit(1);
  return config?.homepageImages ?? [];
}

export default async function LandingPage() {
  const session = await getSession();
  const locale = await getStudentLocale();
  const messages = getStudentMessages(locale);

  // Determine dashboard URL for logged-in users
  const dashboardUrl = session
    ? session.role === "admin"
      ? "/admin"
      : session.role === "recruiter"
        ? "/dashboard/interviews"
        : "/browse"
    : null;

  const [publicRecruiters, publicJobs, homepageImages] = await Promise.all([
    getPublicRecruiters(),
    getPublicJobs(),
    getHomepageImages(),
  ]);

  const formattedDate = EVENT_CONFIG.date.toLocaleDateString(
    locale === "vi" ? "vi-VN" : locale === "zh-TW" ? "zh-TW" : "en-US",
    {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: EVENT_CONFIG.timezone,
    }
  );

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {/* Header */}
      <AppTopBar
        navRole={session?.role ?? "guest"}
        currentPath="/"
        desktopActions={
          session ? (
            session.role === "applicant" ? (
              <LogoutButton />
            ) : (
              <Link
                href={dashboardUrl!}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {messages.common.goToDashboard}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {messages.common.logIn}
              </Link>
              <Link
                href="/get-started"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {messages.common.signUp}
              </Link>
            </>
          )
        }
      />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroCarousel images={homepageImages}>
          <div className="px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
            <div className="mx-auto max-w-4xl text-center">
              <Badge className="mb-4">{messages.landing.heroBadge}</Badge>
              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {messages.landing.heroTitle}
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
                <Link
                  href="/browse"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-8 text-base font-medium transition-colors hover:bg-secondary sm:w-auto"
                >
                  {messages.common.browseCompanies}
                </Link>
                <Link
                  href="/jobs"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                >
                  <Briefcase className="h-4 w-4" />
                  {messages.common.findJobs}
                </Link>
              </div>
            </div>
          </div>
        </HeroCarousel>

        {/* Event Photos Section */}
        <section className="border-b px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                {messages.landing.eventHighlightsTitle}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                {messages.landing.eventHighlightsSubtitle}
              </p>
            </div>
            <HomepageImageEditor
              images={homepageImages}
              isAdmin={session?.role === "admin"}
              placeholders={EVENT_PHOTO_PLACEHOLDERS}
            />
          </div>
        </section>

        {/* Recruiters Section */}
        <section id="companies" className="border-b px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                  {messages.landing.companiesTitle}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  {messages.landing.companiesSubtitle}
                </p>
              </div>
              <Link
                href="/get-started"
                className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
              >
                {messages.landing.viewAll}
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
                          {recruiter.description || messages.landing.joinMoreOpportunities}
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
                        {messages.landing.viewPositions}
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
                  {messages.landing.companiesComingSoon}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {messages.landing.checkBackLater}
                </p>
              </Card>
            )}

            <Link
              href="/get-started"
              className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline sm:hidden"
            >
              {messages.landing.viewAllCompanies}
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
                  {messages.landing.jobsTitle}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  {messages.landing.jobsSubtitle}
                </p>
              </div>
              <Link
                href="/get-started"
                className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
              >
                {messages.landing.viewAll}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {publicJobs.length > 0 ? (
              <div className="stagger-fade-in grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {publicJobs.map((job) => (
                  <RecruiterJobPostingCard
                    key={job.id}
                    job={job}
                    compact
                    locale={locale}
                    labels={{
                      seniority: messages.jobsPage.card.seniority,
                      languageRequirement: messages.jobsPage.card.languageRequirement,
                      visaSupport: messages.jobsPage.card.visaSupport,
                      applicationDeadline: messages.jobsPage.card.applicationDeadline,
                      description: messages.jobsPage.card.description,
                      responsibilities: messages.jobsPage.card.responsibilities,
                      requirements: messages.jobsPage.card.requirements,
                      benefits: messages.jobsPage.card.benefits,
                      viewJd: messages.jobsPage.card.viewJd,
                      noJd: messages.jobsPage.card.noJd,
                    }}
                    action={
                      <Link
                        href={`/recruiter/${job.recruiterId}`}
                        className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        {messages.jobsPage.viewCompany}
                      </Link>
                    }
                  />
                ))}
              </div>
            ) : (
              <Card className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium text-muted-foreground">
                  {messages.landing.positionsComingSoon}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {messages.landing.positionsComingSoonHint}
                </p>
              </Card>
            )}

            <Link
              href="/get-started"
              className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline sm:hidden"
            >
              {messages.landing.viewAllPositions}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Final CTA Section */}
        {!session && (
          <section className="px-4 py-16 sm:px-6 sm:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-2xl font-bold sm:text-4xl">
                {messages.landing.readyToJoin}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                {messages.landing.readyToJoinSubtitle}
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/get-started"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                >
                  {messages.landing.getStarted}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <InstallPrompt />
      <SiteFooter />
    </div>
  );
}
