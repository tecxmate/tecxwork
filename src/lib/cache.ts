import { getCache } from "@vercel/functions";
import { getExternalJobs, type GetExternalJobsOptions } from "./crawler";
import { db, recruiters, users, jobOpenings } from "./db";
import { eq } from "drizzle-orm";

const cache = getCache({ namespace: "app" });
const CACHE_TTL = 300; // 5 minutes

// Sponsors are pinned to the top of the company directory in this exact
// order. Matched by normalized keyword so full legal names still resolve
// (e.g. "Indovina Bank (IVB)" → "ivb"). Order = display priority.
const SPONSOR_PRIORITY = [
  "ivb",
  "gtalent",
  "mdor",
  "tripod",
  "chinli",
  "ssb",
  "viethoa",
  "yongzhan",
];

function normalizeCompany(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function sponsorRank(company: string): number {
  const normalized = normalizeCompany(company);
  const index = SPONSOR_PRIORITY.findIndex((kw) => normalized.includes(kw));
  return index === -1 ? Number.POSITIVE_INFINITY : index;
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
  const key = "recruiters:list:v5";
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
    })
    .from(recruiters)
    .innerJoin(users, eq(recruiters.userId, users.id));

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
      const rankA = sponsorRank(a.company);
      const rankB = sponsorRank(b.company);
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      if (b.positions.length !== a.positions.length) {
        return b.positions.length - a.positions.length;
      }
      return a.company.localeCompare(b.company);
    });
}
