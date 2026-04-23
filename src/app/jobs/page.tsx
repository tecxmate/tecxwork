import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AppTopBar } from "@/components/app-topbar";
import { LogoutButton } from "@/components/logout-button";
import { SiteFooter } from "@/components/site-footer";
import { db, jobOpenings, recruiters } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

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
                Go to Dashboard
              </Link>
            )
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
              >
                Log In
              </Link>
              <Link
                href="/get-started"
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:text-sm"
              >
                Sign Up
              </Link>
            </>
          )
        }
      />

      <section className="border-b bg-card px-4 py-6 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-7xl text-center">
          <Badge className="mb-2 sm:mb-4">Job Board</Badge>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Recruiter-Posted Jobs
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:mt-3 sm:text-base">
            Browse open positions published directly by participating recruiters.
          </p>
        </div>
      </section>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl space-y-4">
          {jobs.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                No recruiter jobs available yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Recruiters will post openings as the event approaches.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <Link key={job.id} href={`/recruiter/${job.recruiterId}`}>
                  <Card className="h-full p-4 transition-all duration-200 ease-out hover:border-primary/40 hover:shadow-[0_0_24px_rgba(140,82,255,0.12)] hover:-translate-y-0.5">
                    <div className="space-y-2">
                      <h2 className="line-clamp-2 text-base font-semibold">
                        {job.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="text-[11px]">
                          Recruiter posted
                        </Badge>
                        {job.jdLink ? (
                          <Badge variant="outline" className="text-[11px]">
                            JD available
                          </Badge>
                        ) : null}
                      </div>
                      {job.description ? (
                        <p className="line-clamp-3 text-xs text-muted-foreground">
                          {job.description}
                        </p>
                      ) : null}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
