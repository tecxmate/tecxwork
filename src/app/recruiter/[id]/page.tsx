import { notFound } from "next/navigation";
import { db, recruiters, jobOpenings } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { RecruiterDetail } from "./recruiter-detail";

export default async function RecruiterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recruiterId = parseInt(id);
  if (isNaN(recruiterId)) notFound();

  const session = await getSession();

  const [[recruiter], jobs] = await Promise.all([
    db
      .select({
        id: recruiters.id,
        company: recruiters.company,
        industry: recruiters.industry,
        description: recruiters.description,
        contactEmail: recruiters.contactEmail,
      })
      .from(recruiters)
      .where(eq(recruiters.id, recruiterId)),
    db
      .select({
        id: jobOpenings.id,
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
        description: jobOpenings.description,
        responsibilities: jobOpenings.responsibilities,
        requirements: jobOpenings.requirements,
      })
      .from(jobOpenings)
      .where(
        and(
          eq(jobOpenings.recruiterId, recruiterId),
          eq(jobOpenings.moderationStatus, "approved")
        )
      ),
  ]);

  if (!recruiter) notFound();

  return (
    <RecruiterDetail
      recruiter={recruiter}
      jobs={jobs}
      isAuthenticated={!!session}
    />
  );
}
