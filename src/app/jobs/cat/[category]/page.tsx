import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { JobsListPage } from "@/app/jobs/jobs-list-page";
import { getEventBranding } from "@/lib/event-branding";
import {
  getJobCategoryStaticParams,
  jobCategoryValueFromSlug,
} from "@/lib/job-category-routes";
import { jobCategoryLabel } from "@/lib/job-posting";

export function generateStaticParams() {
  return getJobCategoryStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = jobCategoryValueFromSlug(slug);
  if (!category) return { title: "Jobs Not Found" };

  const branding = await getEventBranding();
  const categoryName = jobCategoryLabel(category) ?? "Jobs";

  return {
    title: `${categoryName} Jobs | ${branding.name}`,
    description: `Browse ${categoryName.toLowerCase()} jobs posted by participating recruiters.`,
  };
}

export default async function JobsCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = jobCategoryValueFromSlug(slug);
  if (!category) notFound();

  return <JobsListPage category={category} />;
}
