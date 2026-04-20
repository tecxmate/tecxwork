import type { ExternalJob, CrawlResult, CrawlerConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";
import {
  politeDelay,
  extractJobId,
  normalizeJobType,
  isVietnameseRelatedJob,
  sanitizeText,
} from "./utils";

const BASE_URL = "https://www.1111.com.tw";
const SEARCH_URL = `${BASE_URL}/search/job`;

interface SearchParams {
  keyword?: string;
  area?: string;
  page?: number;
}

function buildSearchUrl(params: SearchParams): string {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("page", String(params.page || 1));
  url.searchParams.set("col", "ab");
  url.searchParams.set("sort", "desc");
  if (params.keyword) url.searchParams.set("ks", params.keyword);
  if (params.area) url.searchParams.set("d0", params.area);
  return url.toString();
}

async function fetchPage(
  url: string,
  config: CrawlerConfig
): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": config.userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        console.warn(`[1111] Rate limited or blocked: ${response.status}`);
        return null;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error(`[1111] Fetch error for ${url}:`, error);
    return null;
  }
}

function parseNuxtData(html: string): ExternalJob[] {
  const jobs: ExternalJob[] = [];

  const nuxtMatch = html.match(
    /<script[^>]*id="__NUXT_DATA__"[^>]*>([^<]+)<\/script>/
  );
  if (!nuxtMatch) return jobs;

  try {
    const d: unknown[] = JSON.parse(nuxtMatch[1]);
    if (!Array.isArray(d) || d.length < 10) return jobs;

    const rootRef = d[1] as Record<string, unknown>;
    if (!rootRef?.data) return jobs;

    const dataWrapperIdx = rootRef.data as number;
    const dataWrapper = d[dataWrapperIdx];
    if (!Array.isArray(dataWrapper) || dataWrapper[0] !== "ShallowReactive")
      return jobs;

    const dataObjIdx = dataWrapper[1] as number;
    const dataObj = d[dataObjIdx] as Record<string, number>;
    if (!dataObj?.apiJob) return jobs;

    const apiJob = d[dataObj.apiJob] as Record<string, number>;
    if (!apiJob?.result) return jobs;

    const result = d[apiJob.result] as Record<string, number>;
    if (!result?.hits) return jobs;

    const hitIndices = d[result.hits] as number[];
    if (!Array.isArray(hitIndices)) return jobs;

    for (const hitIdx of hitIndices) {
      try {
        const hit = d[hitIdx] as Record<string, number>;
        if (!hit?.jobId || !hit?.title) continue;

        const jobId = d[hit.jobId];
        const title = d[hit.title];
        const companyName = d[hit.companyName];
        const description = d[hit.description];
        const salary = d[hit.salary];
        const workCityObj = d[hit.workCity] as Record<string, number> | undefined;
        const rawJobType = d[hit.jobType] as number | undefined;
        const internshipArr = d[hit.internship] as number[] | undefined;

        if (!jobId || !title) continue;

        let location = "Taiwan";
        if (workCityObj && typeof workCityObj === "object" && workCityObj.name) {
          location = String(d[workCityObj.name] || "Taiwan");
        }

        let jobType: "full_time" | "part_time" | "internship" | "contract" | undefined;
        const isInternship = Array.isArray(internshipArr) && internshipArr.includes(101);
        if (isInternship) {
          jobType = "internship";
        } else if (rawJobType === 1) {
          jobType = "full_time";
        } else if (rawJobType === 2) {
          jobType = "part_time";
        } else if (rawJobType === 3 || rawJobType === 4) {
          jobType = "contract";
        }

        const externalId = String(jobId);
        const url = `${BASE_URL}/job/${externalId}`;
        const snippet = description ? sanitizeText(String(description)) : "";
        const salaryStr = typeof salary === "string" ? salary : undefined;

        const fullText = `${title} ${companyName || ""} ${snippet}`;
        const isVietnamese = isVietnameseRelatedJob(fullText);

        jobs.push({
          source: "1111",
          externalId,
          title: sanitizeText(String(title)),
          company: companyName ? sanitizeText(String(companyName)) : "Unknown",
          location: sanitizeText(location),
          snippet: snippet.slice(0, 500),
          jobType,
          salary: salaryStr ? sanitizeText(salaryStr) : undefined,
          externalUrl: url,
          isVietnameseJob: isVietnamese,
        });
      } catch (e) {
        // Skip malformed entries
      }
    }
  } catch (e) {
    console.error("[1111] Error parsing Nuxt data:", e);
  }

  return jobs;
}

function parseJobListings(html: string): ExternalJob[] {
  const nuxtJobs = parseNuxtData(html);
  if (nuxtJobs.length > 0) {
    return nuxtJobs;
  }

  const jobs: ExternalJob[] = [];

  const jobBlockRegex =
    /<div[^>]*class="[^"]*job[_-]?item[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi;
  const blocks = html.match(jobBlockRegex) || [];

  for (const block of blocks) {
    try {
      const titleMatch = block.match(
        /<a[^>]*href="([^"]*\/job\/\d+[^"]*)"[^>]*>([^<]+)<\/a>/i
      );
      if (!titleMatch) continue;

      const url = titleMatch[1].startsWith("http")
        ? titleMatch[1]
        : `${BASE_URL}${titleMatch[1]}`;
      const title = sanitizeText(titleMatch[2]);
      const externalId = extractJobId(url, "1111");
      if (!externalId) continue;

      const companyMatch = block.match(
        /<a[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/a>/i
      );
      const company = companyMatch ? sanitizeText(companyMatch[1]) : "Unknown";

      const locationMatch = block.match(
        /<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/i
      );
      const location = locationMatch
        ? sanitizeText(locationMatch[1])
        : "Taiwan";

      const snippetMatch = block.match(
        /<p[^>]*class="[^"]*desc[^"]*"[^>]*>([^<]+)<\/p>/i
      );
      const snippet = snippetMatch ? sanitizeText(snippetMatch[1]) : "";

      const salaryMatch = block.match(
        /<span[^>]*class="[^"]*salary[^"]*"[^>]*>([^<]+)<\/span>/i
      );
      const salary = salaryMatch ? sanitizeText(salaryMatch[1]) : undefined;

      const jobTypeMatch = block.match(
        /<span[^>]*class="[^"]*job[_-]?type[^"]*"[^>]*>([^<]+)<\/span>/i
      );
      const jobType = normalizeJobType(jobTypeMatch?.[1]);

      const fullText = `${title} ${company} ${snippet}`;
      const isVietnameseJob = isVietnameseRelatedJob(fullText);

      jobs.push({
        source: "1111",
        externalId,
        title,
        company,
        location,
        snippet: snippet.slice(0, 500),
        jobType,
        salary,
        externalUrl: url,
        isVietnameseJob,
      });
    } catch (error) {
      console.error("[1111] Error parsing job block:", error);
    }
  }

  return jobs;
}

function parseJobListingsAlt(html: string): ExternalJob[] {
  const jobs: ExternalJob[] = [];

  const linkRegex = /<a[^>]*href="(\/job\/\d+[^"]*)"[^>]*title="([^"]+)"[^>]*>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const [, path, title] = match;
    const externalId = extractJobId(path, "1111");
    if (!externalId) continue;

    const url = `${BASE_URL}${path}`;
    const cleanTitle = sanitizeText(title);

    const companyPattern = new RegExp(
      `${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^<]*</a>[\\s\\S]*?<[^>]*>([^<]+)</`,
      "i"
    );
    const companyMatch = html.match(companyPattern);
    const company = companyMatch ? sanitizeText(companyMatch[1]) : "Unknown";

    const fullText = `${cleanTitle} ${company}`;
    const isVietnameseJob = isVietnameseRelatedJob(fullText);

    if (!jobs.some((j) => j.externalId === externalId)) {
      jobs.push({
        source: "1111",
        externalId,
        title: cleanTitle,
        company,
        location: "Taiwan",
        snippet: "",
        externalUrl: url,
        isVietnameseJob,
      });
    }
  }

  return jobs;
}

export async function crawl1111(
  config: CrawlerConfig = DEFAULT_CONFIG
): Promise<CrawlResult> {
  const startTime = Date.now();
  const allJobs: ExternalJob[] = [];
  const seenIds = new Set<string>();
  let errorMessage: string | undefined;

  const searchQueries = [
    { keyword: "越南", area: "" },
    { keyword: "vietnam", area: "" },
    { keyword: "東南亞", area: "" },
    { keyword: "外籍", area: "" },
  ];

  try {
    for (const query of searchQueries) {
      for (let page = 1; page <= Math.min(config.maxPagesPerRun, 5); page++) {
        const url = buildSearchUrl({ ...query, page });
        console.log(`[1111] Fetching: ${url}`);

        const html = await fetchPage(url, config);
        if (!html) {
          console.warn(`[1111] No response for page ${page}, stopping`);
          break;
        }

        let jobs = parseJobListings(html);
        if (jobs.length === 0) {
          jobs = parseJobListingsAlt(html);
        }

        if (jobs.length === 0) {
          console.log(`[1111] No jobs found on page ${page}, stopping pagination`);
          break;
        }

        for (const job of jobs) {
          if (!seenIds.has(job.externalId)) {
            seenIds.add(job.externalId);
            allJobs.push(job);
          }
        }

        console.log(
          `[1111] Page ${page}: found ${jobs.length} jobs (total unique: ${allJobs.length})`
        );

        await politeDelay(config);
      }

      await politeDelay(config);
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[1111] Crawl error:", error);
  }

  const vietnameseJobs = allJobs.filter((j) => j.isVietnameseJob);

  return {
    source: "1111",
    status: errorMessage ? "partial" : "success",
    jobs: vietnameseJobs,
    jobsFound: vietnameseJobs.length,
    errorMessage,
    durationMs: Date.now() - startTime,
  };
}
