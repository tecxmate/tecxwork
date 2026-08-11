import { getCache } from "@vercel/functions";
import { db, recruiters, users, jobOpenings } from "./db";
import { eq, ne } from "drizzle-orm";

const cache = getCache({ namespace: "app" });
const CACHE_TTL = 300; // 5 minutes

/** Invalidate the cached company directory (call after admin edits/pins). */
export async function invalidateRecruitersCache() {
  await cache.expireTag("recruiters");
}

/**
 * Cached recruiters list - 5 minute TTL
 */
export async function getCachedRecruiters() {
  const key = "recruiters:list:v7";
  const cached = await cache.get(key);

  if (cached) {
    return cached as Awaited<ReturnType<typeof fetchRecruiters>>;
  }

  const result = await fetchRecruiters();
  await cache.set(key, result, { ttl: CACHE_TTL, tags: ["recruiters"] });
  return result;
}

async function fetchRecruiters() {
  const recruiterList = await db
    .select({
      id: recruiters.id,
      company: recruiters.company,
      industry: recruiters.industry,
      description: recruiters.description,
      logoUrl: recruiters.logoUrl,
      verified: recruiters.verified,
      pinnedRank: recruiters.pinnedRank,
    })
    .from(recruiters)
    .innerJoin(users, eq(recruiters.userId, users.id))
    // Hide the agency itself from the public company directory (demo).
    .where(ne(recruiters.clientKind, "agency"));

  const approvedJobs = await db
    .select({
      recruiterId: jobOpenings.recruiterId,
      title: jobOpenings.title,
      jdLink: jobOpenings.jdLink,
    })
    .from(jobOpenings)
    .where(eq(jobOpenings.moderationStatus, "approved"));

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

  const mapped = recruiterList
    .map((recruiter) => {
      const jobs = jobsByRecruiter.get(recruiter.id);
      return {
        ...recruiter,
        // Dedupe titles so a company never lists the same role twice.
        positions: [...new Set(jobs?.titles ?? [])],
        jdAvailable: jobs?.hasJdLink ?? false,
      };
    })
    // Never surface a company with zero open positions in the directory.
    .filter((recruiter) => recruiter.positions.length > 0);

  // Collapse duplicate companies (same normalized name), keeping the richer row.
  const byName = new Map<string, (typeof mapped)[number]>();
  for (const recruiter of mapped) {
    const nameKey = recruiter.company.trim().replace(/\s+/g, " ").toLowerCase();
    const existing = byName.get(nameKey);
    if (!existing || recruiter.positions.length > existing.positions.length) {
      byName.set(nameKey, recruiter);
    }
  }

  return [...byName.values()]
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
