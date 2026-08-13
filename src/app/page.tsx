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
import { Countdown } from "@/components/countdown";
import { InstallPrompt } from "@/components/install-prompt";
import { RecruiterCard } from "@/components/recruiter-card";
import { SiteFooter } from "@/components/site-footer";
import { AppTopBar } from "@/components/app-topbar";
import { HeroCarousel } from "@/components/hero-carousel";
import { LogoutButton } from "@/components/logout-button";
import { EVENT_CONFIG } from "@/lib/data";
import { getEventBranding } from "@/lib/event-branding";
import { getSession } from "@/lib/auth";
import { getCachedRecruiters } from "@/lib/cache";
import { db, eventConfig } from "@/lib/db";
import { getStudentLocale } from "@/lib/student-locale.server";
import { getStudentMessages } from "@/lib/student-messages";

async function getPublicRecruiters() {
  // Reuse the canonical directory order (pinned first, then approved-job
  // count, then A→Z) so the homepage preview matches the Companies tab.
  const recruiters = (await getCachedRecruiters()).slice(0, 6);

  // Drop the vacancy titles before they leave the server. The card is a client
  // component, so anything handed to it is serialised into the page payload —
  // hiding the badges in JSX still left every open role readable in view-source,
  // which is not "turned off" in any sense that matters.
  return recruiters.map((recruiter) => ({ ...recruiter, positions: [] }));
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

  const [publicRecruiters, allHomepageImages, branding] = await Promise.all([
    getPublicRecruiters(),
    getHomepageImages(),
    getEventBranding(),
  ]);

  // Demo: cycle through all Yang Luck hero banners as a carousel (rather than
  // one localised image per visitor locale).
  const homepageImages = allHomepageImages.filter(
    (url): url is string => Boolean(url)
  );

  const formattedDate = branding.date.toLocaleDateString(
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
          {branding.heroOverlayEnabled && (
          <div className="px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {branding.name}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base italic text-muted-foreground sm:text-lg">
                &ldquo;{branding.tagline}&rdquo;
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
                  {branding.hostedAt}
                </span>
              </div>

              <div className="mt-8 flex justify-center">
                <Countdown target={branding.date} />
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
          )}
        </HeroCarousel>

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
                href="/browse"
                className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
              >
                {messages.landing.viewAll}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {publicRecruiters.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {publicRecruiters.map((recruiter) => (
                  <RecruiterCard
                    key={recruiter.id}
                    recruiter={recruiter}
                    // The homepage no longer advertises vacancies publicly.
                    showPositions={false}
                  />
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
              href="/browse"
              className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline sm:hidden"
            >
              {messages.landing.viewAllCompanies}
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
