import { getCache } from "@vercel/functions";
import { getExternalJobs, type GetExternalJobsOptions } from "./crawler";
import { db, recruiters, users, jobOpenings } from "./db";
import { currentEventId } from "./tenant";
import { and, eq } from "drizzle-orm";

const cache = getCache({ namespace: "app" });
const CACHE_TTL = 300; // 5 minutes

/** Invalidate the cached company directory (call after admin edits/pins). */
export async function invalidateRecruitersCache() {
  await cache.expireTag("recruiters");
}

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
  const eventId = await currentEventId();
  const key = `recruiters:list:v7:${eventId}`;
  const cached = await cache.get(key);

  if (cached) {
    return cached as Awaited<ReturnType<typeof fetchRecruiters>>;
  }

  const result = await fetchRecruiters(eventId);
  await cache.set(key, result, { ttl: CACHE_TTL, tags: ["recruiters"] });
  return result;
}

async function fetchRecruiters(eventId: number) {
  const recruiterList = await db
    .select({
      id: recruiters.id,
      company: recruiters.company,
      industry: recruiters.industry,
      description: recruiters.description,
      logoUrl: recruiters.logoUrl,
      pinnedRank: recruiters.pinnedRank,
    })
    .from(recruiters)
    .innerJoin(users, eq(recruiters.userId, users.id))
    .where(eq(recruiters.eventId, eventId));

  const approvedJobs = await db
    .select({
      recruiterId: jobOpenings.recruiterId,
      title: jobOpenings.title,
      jdLink: jobOpenings.jdLink,
    })
    .from(jobOpenings)
    .where(
      and(
        eq(jobOpenings.moderationStatus, "approved"),
        eq(jobOpenings.eventId, eventId)
      )
    );

  const jobsByRecruiter = new Map<
    number,
    { titles: string[]; hasJdLink: boolean }
  >();

  for (const job of approvedJobs) {
    const current = jobsByRecruiter.get(job.recruiterId) ?? {
      titles: [],
      hasJdLink: false,
    };
    current.titles.push(job.title);
    current.hasJdLink = current.hasJdLink || Boolean(job.jdLink);
    jobsByRecruiter.set(job.recruiterId, current);
  }

  return recruiterList
    .map((recruiter) => {
      const jobs = jobsByRecruiter.get(recruiter.id);
      return {
        ...recruiter,
        positions: jobs?.titles ?? [],
        jdAvailable: jobs?.hasJdLink ?? false,
      };
    })
    .sort((a, b) => {
      // Admin-pinned companies lead, ordered by ascending pinnedRank.
      const rankA = a.pinnedRank ?? Number.POSITIVE_INFINITY;
      const rankB = b.pinnedRank ?? Number.POSITIVE_INFINITY;
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      // Unpinned (and any rank ties): most approved jobs first, then A→Z.
      if (b.positions.length !== a.positions.length) {
        return b.positions.length - a.positions.length;
      }
      return a.company.localeCompare(b.company);
    });
}
