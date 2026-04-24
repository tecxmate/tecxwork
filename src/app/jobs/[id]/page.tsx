import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppTopBar } from "@/components/app-topbar";
import { RecruiterJobPostingCard } from "@/components/recruiter-job-posting-card";
import { SiteFooter } from "@/components/site-footer";
import { db, jobOpenings, recruiters } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getStudentLocale } from "@/lib/student-locale.server";
import { getStudentMessages } from "@/lib/student-messages";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(parseInt(id));
  if (!job) return { title: "Job Not Found" };
  return {
    title: `${job.title} at ${job.company} | TECXWORK`,
    description: job.description.slice(0, 160),
  };
}

async function getJob(id: number) {
  const [job] = await db
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
    .where(eq(jobOpenings.id, id))
    .limit(1);

  return job ?? null;
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(parseInt(id));

  if (!job) notFound();

  const session = await getSession();
  const locale = await getStudentLocale();
  const messages = getStudentMessages(locale);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-white dark:bg-card">
        <div className="h-[env(safe-area-inset-top)] bg-primary md:hidden" />
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/jobs"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {messages.common.back}
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <RecruiterJobPostingCard
            job={job}
            locale={locale}
            className="border-0 bg-transparent p-0 shadow-none hover:border-transparent hover:bg-transparent hover:shadow-none"
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
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
