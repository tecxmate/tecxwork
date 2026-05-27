import type { JobCategoryValue } from "@/lib/job-posting";

export const JOB_CATEGORY_SLUGS = {
  business: "business",
  tech_engineering: "tech",
  service_hospitality: "service",
} as const satisfies Record<JobCategoryValue, string>;

export type JobCategorySlug =
  (typeof JOB_CATEGORY_SLUGS)[keyof typeof JOB_CATEGORY_SLUGS];

const JOB_CATEGORY_VALUES_BY_SLUG = Object.fromEntries(
  Object.entries(JOB_CATEGORY_SLUGS).map(([value, slug]) => [slug, value])
) as Record<JobCategorySlug, JobCategoryValue>;

export function jobCategoryValueFromSlug(
  slug: string
): JobCategoryValue | null {
  return JOB_CATEGORY_VALUES_BY_SLUG[slug as JobCategorySlug] ?? null;
}

export function jobCategorySlugFromValue(value: JobCategoryValue) {
  return JOB_CATEGORY_SLUGS[value];
}

export function getJobCategoryStaticParams() {
  return Object.values(JOB_CATEGORY_SLUGS).map((category) => ({ category }));
}
