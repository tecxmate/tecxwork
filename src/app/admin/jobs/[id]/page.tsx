import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { getSession } from "@/lib/auth";
import { db, jobOpenings, recruiters } from "@/lib/db";
import { getStudentLocale } from "@/lib/student-locale.server";
import { getStudentMessages } from "@/lib/student-messages";
import { AdminJobReview } from "@/components/admin-job-review";

export default async function AdminJobReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isFinite(jobId)) notFound();

  const [job] = await db
    .select({
      id: jobOpenings.id,
      recruiterId: recruiters.id,
      company: recruiters.company,
      logoUrl: recruiters.logoUrl,
      title: jobOpenings.title,
      jobCategory: jobOpenings.jobCategory,
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
      benefits: jobOpenings.benefits,
      moderationStatus: jobOpenings.moderationStatus,
      moderationNotes: jobOpenings.moderationNotes,
    })
    .from(jobOpenings)
    .innerJoin(recruiters, eq(jobOpenings.recruiterId, recruiters.id))
    .where(eq(jobOpenings.id, jobId))
    .limit(1);

  if (!job) notFound();

  const locale = await getStudentLocale();
  const messages = getStudentMessages(locale);

  return (
    <AdminJobReview
      job={{
        ...job,
        applicationDeadline: job.applicationDeadline
          ? String(job.applicationDeadline)
          : null,
      }}
      locale={locale}
      labels={{
        card: {
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
        },
        approve: messages.admin.moderation.approve,
        approved: messages.admin.moderation.approved,
        reject: messages.admin.moderation.reject,
        rejected: messages.admin.moderation.rejected,
        resetToDraft: messages.admin.moderation.resetToDraft,
        jobCategory: messages.admin.moderation.jobCategory,
        uncategorized: messages.admin.moderation.uncategorized,
        saveCategory: messages.admin.moderation.saveCategory,
        adminNotes: messages.admin.moderation.adminNotes,
        notesPlaceholder: messages.admin.moderation.notesPlaceholder,
        back: messages.common.back,
      }}
    />
  );
}
