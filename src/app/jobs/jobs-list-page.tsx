import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { Briefcase } from "lucide-react";

import { AppTopBar } from "@/components/app-topbar";
import { LogoutButton } from "@/components/logout-button";
import { PageHero } from "@/components/page-hero";
import { RecruiterJobsBrowser } from "@/components/recruiter-jobs-browser";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { db, jobOpenings, recruiters } from "@/lib/db";
import { getJobsPageHeroEnabled, getPageImages } from "@/lib/page-images";
import { getStudentLocale } from "@/lib/student-locale.server";
import { getStudentMessages } from "@/lib/student-messages";
import {
  jobCategoryLabel,
  type JobCategoryValue,
} from "@/lib/job-posting";

async function getRecruiterPostedJobs(category?: JobCategoryValue) {
  return db
    .select({
      id: jobOpenings.id,
      title: jobOpenings.title,
      jobCategory: jobOpenings.jobCategory,
      description: jobOpenings.description,
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
      createdAt: jobOpenings.createdAt,
      recruiterId: recruiters.id,
      company: recruiters.company,
      logoUrl: recruiters.logoUrl,
    })
    .from(jobOpenings)
    .innerJoin(recruiters, eq(jobOpenings.recruiterId, recruiters.id))
    .where(
      category
        ? and(
            eq(jobOpenings.moderationStatus, "approved"),
            eq(jobOpenings.jobCategory, category)
          )
        : eq(jobOpenings.moderationStatus, "approved")
    )
    .orderBy(desc(jobOpenings.createdAt));
}

export async function JobsListPage({
  category,
}: {
  category?: JobCategoryValue;
}) {
  const session = await getSession();
  const locale = await getStudentLocale();
  const messages = getStudentMessages(locale);
  const categoryName = category ? jobCategoryLabel(category, locale) : null;
  const [jobs, pageImages, jobsPageHeroEnabled] = await Promise.all([
    getRecruiterPostedJobs(category),
    getPageImages("jobs"),
    getJobsPageHeroEnabled(),
  ]);
  const dashboardUrl = session
    ? session.role === "admin"
      ? "/admin"
      : session.role === "recruiter"
        ? "/dashboard/interviews"
        : null
    : null;

  const title = categoryName
    ? `${categoryName} ${messages.jobsPage.categoryTitleSuffix}`
    : messages.jobsPage.title;
  const subtitle = categoryName
    ? messages.jobsPage.categorySubtitle.replace("{category}", categoryName)
    : messages.jobsPage.subtitle;

  return (
    <div className="flex flex-1 flex-col">
      <AppTopBar
        href="/jobs"
        navRole={session?.role ?? "guest"}
        currentPath="/jobs"
        desktopActions={
          session ? (
            session.role === "applicant" ? (
              <LogoutButton />
            ) : (
              <Link
                href={dashboardUrl!}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:text-sm"
              >
                {messages.common.goToDashboard}
              </Link>
            )
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
              >
                {messages.common.logIn}
              </Link>
              <Link
                href="/get-started"
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:text-sm"
              >
                {messages.common.signUp}
              </Link>
            </>
          )
        }
      />

      {jobsPageHeroEnabled ? (
        <PageHero images={pageImages} title={title} subtitle={subtitle} />
      ) : null}

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl space-y-4">
          {jobs.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                {messages.jobsPage.emptyTitle}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {messages.jobsPage.emptySubtitle}
              </p>
            </Card>
          ) : (
            <RecruiterJobsBrowser
              jobs={jobs}
              locale={locale}
              messages={messages}
              isApplicant={session?.role === "applicant"}
              labels={{
                viewDetails: messages.jobsPage.viewDetails,
                searchPlaceholder: messages.jobsPage.searchPlaceholder,
                resultsCount: messages.jobsPage.resultsCount,
                noMatchTitle: messages.jobsPage.noMatchTitle,
                noMatchSubtitle: messages.jobsPage.noMatchSubtitle,
                selectPrompt: messages.jobsPage.subtitle,
                card: {
                  applicationDeadline: messages.jobsPage.card.applicationDeadline,
                },
                filters: messages.jobsPage.filters,
              }}
              lockedCategory={category}
            />
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
