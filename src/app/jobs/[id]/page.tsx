import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { JobDetailApply } from "@/components/job-detail-apply";
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
  const title = `${job.title} — ${job.company} | tecxwork (Vietnamese Jobs in Taiwan)`;
  const cleanDesc = (job.description || "").replace(/\s+/g, " ").trim();
  const description = cleanDesc
    ? cleanDesc.slice(0, 160)
    : `${job.title} at ${job.company}${job.location ? ` · ${job.location}` : ""}. Apply via tecxwork — 越南人才台灣工作.`;
  return {
    title,
    description,
    alternates: { canonical: `/jobs/${job.id}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/jobs/${job.id}`,
    },
  };
}

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  "full-time": "FULL_TIME",
  full_time: "FULL_TIME",
  fulltime: "FULL_TIME",
  "part-time": "PART_TIME",
  part_time: "PART_TIME",
  parttime: "PART_TIME",
  contract: "CONTRACTOR",
  contractor: "CONTRACTOR",
  temporary: "TEMPORARY",
  intern: "INTERN",
  internship: "INTERN",
  volunteer: "VOLUNTEER",
  "per-diem": "PER_DIEM",
  other: "OTHER",
};

const SALARY_PERIOD_MAP: Record<string, string> = {
  hour: "HOUR",
  hourly: "HOUR",
  day: "DAY",
  daily: "DAY",
  week: "WEEK",
  weekly: "WEEK",
  month: "MONTH",
  monthly: "MONTH",
  year: "YEAR",
  yearly: "YEAR",
  annual: "YEAR",
};

function buildJobPostingJsonLd(
  job: NonNullable<Awaited<ReturnType<typeof getJob>>>,
  siteUrl: string,
) {
  const descriptionParts = [
    job.description,
    job.responsibilities && `Responsibilities: ${job.responsibilities}`,
    job.requirements && `Requirements: ${job.requirements}`,
    job.benefits && `Benefits: ${job.benefits}`,
  ].filter(Boolean);
  const descriptionHtml =
    descriptionParts.length > 0
      ? descriptionParts
          .map((p) => `<p>${String(p).replace(/\n/g, "<br/>")}</p>`)
          .join("")
      : `<p>${job.title} at ${job.company}.</p>`;

  const employmentType =
    EMPLOYMENT_TYPE_MAP[(job.employmentType || "").toLowerCase()] ?? undefined;

  const isRemote = (job.workplaceType || "").toLowerCase().includes("remote");

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${siteUrl}/jobs/${job.id}#jobposting`,
    title: job.title,
    description: descriptionHtml,
    identifier: {
      "@type": "PropertyValue",
      name: "tecxwork",
      value: String(job.id),
    },
    datePosted: (job.createdAt ?? new Date()).toISOString(),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      logo: job.logoUrl || undefined,
    },
    directApply: false,
    url: `${siteUrl}/jobs/${job.id}`,
  };

  if (employmentType) jsonLd.employmentType = employmentType;
  if (job.applicationDeadline) {
    const d = new Date(job.applicationDeadline);
    if (!isNaN(d.getTime())) jsonLd.validThrough = d.toISOString();
  }

  const locationCountry = "TW";
  if (isRemote) {
    jsonLd.jobLocationType = "TELECOMMUTE";
    jsonLd.applicantLocationRequirements = {
      "@type": "Country",
      name: "Taiwan",
    };
  }
  jsonLd.jobLocation = {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: job.location || "Taiwan",
      addressCountry: locationCountry,
    },
  };

  if (job.salaryMin || job.salaryMax) {
    const unit =
      SALARY_PERIOD_MAP[(job.salaryPeriod || "month").toLowerCase()] ?? "MONTH";
    const value: Record<string, unknown> = {
      "@type": "QuantitativeValue",
      unitText: unit,
    };
    if (job.salaryMin && job.salaryMax && job.salaryMin !== job.salaryMax) {
      value.minValue = job.salaryMin;
      value.maxValue = job.salaryMax;
    } else {
      value.value = job.salaryMin ?? job.salaryMax;
    }
    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.salaryCurrency || "TWD",
      value,
    };
  }

  if (job.languageRequirement) {
    jsonLd.inLanguage = job.languageRequirement;
  }

  return jsonLd;
}

async function getJob(id: number) {
  const [job] = await db
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
    .where(eq(jobOpenings.id, id))
    .limit(1);

  return job ?? null;
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobId = parseInt(id);
  if (isNaN(jobId)) notFound();

  const job = await getJob(jobId);

  if (!job) notFound();

  const session = await getSession();
  const locale = await getStudentLocale();
  const messages = getStudentMessages(locale);

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "https://work.tecxmate.com"
  ).replace(/\/$/, "");
  const jobPostingJsonLd = buildJobPostingJsonLd(job, siteUrl);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-built JSON-LD, no user-controlled HTML.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
      />
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
          <JobDetailApply
            job={job}
            locale={locale}
            messages={messages}
            isApplicant={session?.role === "applicant"}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
