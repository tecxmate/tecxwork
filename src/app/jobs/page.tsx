import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AppTopBar } from "@/components/app-topbar";
import { LogoutButton } from "@/components/logout-button";
import { RecruiterJobPostingCard } from "@/components/recruiter-job-posting-card";
import { SiteFooter } from "@/components/site-footer";
import { db, jobOpenings, recruiters } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getStudentLocale } from "@/lib/student-locale.server";
import { getStudentMessages } from "@/lib/student-messages";

export const metadata = {
  title: "Job Opportunities | V-GEN TRIDENT",
  description:
    "Browse openings posted by participating recruiters",
};

async function getRecruiterPostedJobs() {
  return db
    .select({
      id: jobOpenings.id,
      title: jobOpenings.title,
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
    })
    .from(jobOpenings)
    .innerJoin(recruiters, eq(jobOpenings.recruiterId, recruiters.id))
    .where(eq(jobOpenings.moderationStatus, "approved"))
    .orderBy(desc(jobOpenings.createdAt));
}

export default async function JobsPage() {
  const session = await getSession();
  const locale = await getStudentLocale();
  const messages = getStudentMessages(locale);
  const jobs = await getRecruiterPostedJobs();
  const dashboardUrl = session
    ? session.role === "admin"
      ? "/admin"
      : session.role === "recruiter"
        ? "/dashboard/interviews"
        : null
    : null;

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

      <section className="border-b bg-card px-4 py-6 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-7xl text-center">
          <Badge className="mb-2 sm:mb-4">{messages.jobsPage.badge}</Badge>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {messages.jobsPage.title}
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:mt-3 sm:text-base">
            {messages.jobsPage.subtitle}
          </p>
        </div>
      </section>

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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <RecruiterJobPostingCard
                  key={job.id}
                  job={job}
                  compact
                  locale={locale}
                  status={
                    <Badge variant="secondary" className="text-[11px]">
                      {messages.jobsPage.recruiterPosted}
                    </Badge>
                  }
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
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
