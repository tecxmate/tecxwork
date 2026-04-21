import { getCache } from "@vercel/functions";
import { getExternalJobs, type GetExternalJobsOptions } from "./crawler";
import { db, recruiters, users } from "./db";
import { eq } from "drizzle-orm";

const cache = getCache({ namespace: "app" });
const CACHE_TTL = 300; // 5 minutes

/**
 * Cached external jobs - 5 minute TTL
 */
export async function getCachedExternalJobs(options: GetExternalJobsOptions) {
  const key = `jobs:${JSON.stringify(options)}`;
  const cached = await cache.get(key);

  if (cached) {
    return cached as Awaited<ReturnType<typeof getExternalJobs>>;
  }

  const jobs = await getExternalJobs(options);
  await cache.set(key, jobs, { ttl: CACHE_TTL, tags: ["external-jobs"] });
  return jobs;
}

/**
 * Cached recruiters list - 5 minute TTL
 */
export async function getCachedRecruiters() {
  const key = "recruiters:list";
  const cached = await cache.get(key);

  if (cached) {
    return cached as Awaited<ReturnType<typeof fetchRecruiters>>;
  }

  const result = await fetchRecruiters();
  await cache.set(key, result, { ttl: CACHE_TTL, tags: ["recruiters"] });
  return result;
}

async function fetchRecruiters() {
  return db
    .select({
      id: recruiters.id,
      company: recruiters.company,
      industry: recruiters.industry,
      description: recruiters.description,
      positions: recruiters.positions,
      contactEmail: recruiters.contactEmail,
      jdLink: recruiters.jdLink,
    })
    .from(recruiters)
    .innerJoin(users, eq(recruiters.userId, users.id))
    .orderBy(recruiters.company);
}
