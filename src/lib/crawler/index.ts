import { db } from "@/lib/db";
import { externalJobs, crawlLogs } from "@/lib/db/schema";
import { eq, and, desc, not, ilike } from "drizzle-orm";
import { crawl104 } from "./crawler-104";
import { crawl1111 } from "./crawler-1111";
import type { ExternalJob, CrawlResult, CrawlerConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { isTaiwanOffPeakHours } from "./utils";

export type { ExternalJob, CrawlResult, CrawlerConfig };
export { DEFAULT_CONFIG };

async function saveJobs(
  jobs: ExternalJob[]
): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const job of jobs) {
    const existing = await db
      .select()
      .from(externalJobs)
      .where(
        and(
          eq(externalJobs.source, job.source),
          eq(externalJobs.externalId, job.externalId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(externalJobs)
        .set({
          title: job.title,
          company: job.company,
          location: job.location,
          snippet: job.snippet,
          jobType: job.jobType,
          salary: job.salary,
          externalUrl: job.externalUrl,
          isVietnameseJob: job.isVietnameseJob,
          lastSeenAt: new Date(),
        })
        .where(eq(externalJobs.id, existing[0].id));
      updated++;
    } else {
      await db.insert(externalJobs).values({
        source: job.source,
        externalId: job.externalId,
        title: job.title,
        company: job.company,
        location: job.location,
        snippet: job.snippet,
        jobType: job.jobType,
        salary: job.salary,
        externalUrl: job.externalUrl,
        isVietnameseJob: job.isVietnameseJob,
      });
      inserted++;
    }
  }

  return { inserted, updated };
}

async function logCrawl(
  result: CrawlResult,
  inserted: number,
  updated: number
): Promise<void> {
  await db.insert(crawlLogs).values({
    source: result.source,
    status: result.status,
    jobsFound: result.jobsFound,
    jobsInserted: inserted,
    jobsUpdated: updated,
    errorMessage: result.errorMessage,
    durationMs: result.durationMs,
  });
}

export interface CrawlAllResult {
  results: CrawlResult[];
  totalJobsFound: number;
  totalInserted: number;
  totalUpdated: number;
  isOffPeakHours: boolean;
}

export async function crawlAll(
  config: CrawlerConfig = DEFAULT_CONFIG
): Promise<CrawlAllResult> {
  const isOffPeak = isTaiwanOffPeakHours();
  console.log(
    `[Crawler] Starting crawl (off-peak: ${isOffPeak}, config: ${JSON.stringify(config)})`
  );

  const results: CrawlResult[] = [];
  let totalInserted = 0;
  let totalUpdated = 0;

  const crawlers = [
    { name: "1111", fn: crawl1111 },
    { name: "104", fn: crawl104 },
  ];

  for (const { name, fn } of crawlers) {
    try {
      console.log(`[Crawler] Running ${name} crawler...`);
      const result = await fn(config);
      results.push(result);

      if (result.jobs.length > 0) {
        const { inserted, updated } = await saveJobs(result.jobs);
        totalInserted += inserted;
        totalUpdated += updated;
        await logCrawl(result, inserted, updated);
        console.log(
          `[Crawler] ${name}: ${result.jobsFound} jobs found, ${inserted} inserted, ${updated} updated`
        );
      } else {
        await logCrawl(result, 0, 0);
        console.log(`[Crawler] ${name}: no jobs found`);
      }
    } catch (error) {
      console.error(`[Crawler] ${name} failed:`, error);
      const errorResult: CrawlResult = {
        source: name as "104" | "1111",
        status: "error",
        jobs: [],
        jobsFound: 0,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        durationMs: 0,
      };
      results.push(errorResult);
      await logCrawl(errorResult, 0, 0);
    }
  }

  const totalJobsFound = results.reduce((sum, r) => sum + r.jobsFound, 0);

  console.log(
    `[Crawler] Completed: ${totalJobsFound} total jobs, ${totalInserted} inserted, ${totalUpdated} updated`
  );

  return {
    results,
    totalJobsFound,
    totalInserted,
    totalUpdated,
    isOffPeakHours: isOffPeak,
  };
}

export interface GetExternalJobsOptions {
  source?: "104" | "1111";
  jobType?: "full_time" | "part_time" | "internship" | "contract";
  limit?: number;
  search?: string;
}

export async function getExternalJobs(
  options?: GetExternalJobsOptions
): Promise<typeof externalJobs.$inferSelect[]> {
  const query = db.select().from(externalJobs);

  const conditions = [eq(externalJobs.isVietnameseJob, true)];

  if (options?.source) {
    conditions.push(eq(externalJobs.source, options.source));
  }

  if (options?.jobType) {
    conditions.push(eq(externalJobs.jobType, options.jobType));
  }

  const excludeOtherNationalities = and(
    not(ilike(externalJobs.title, "%英語%")),
    not(ilike(externalJobs.title, "%english%")),
    not(ilike(externalJobs.title, "%印尼%")),
    not(ilike(externalJobs.title, "%indonesia%")),
    not(ilike(externalJobs.snippet, "%英語母語%")),
    not(ilike(externalJobs.snippet, "%native english%")),
    not(ilike(externalJobs.snippet, "%印尼%")),
    not(ilike(externalJobs.snippet, "%indonesia%"))
  );

  conditions.push(excludeOtherNationalities!);

  const results = await query
    .where(and(...conditions))
    .orderBy(desc(externalJobs.lastSeenAt))
    .limit(options?.limit || 100);

  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    return results.filter(
      (job) =>
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.snippet.toLowerCase().includes(searchLower)
    );
  }

  return results;
}
