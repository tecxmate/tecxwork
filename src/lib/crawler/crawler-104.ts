import type { ExternalJob, CrawlResult, CrawlerConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";
import {
  politeDelay,
  normalizeJobType,
  isVietnameseRelatedJob,
  sanitizeText,
} from "./utils";

const BASE_URL = "https://www.104.com.tw";
const SEARCH_API = `${BASE_URL}/jobs/search/`;

interface SearchParams {
  keyword?: string;
  page?: number;
  mode?: string;
}

function buildSearchUrl(params: SearchParams): string {
  const url = new URL(SEARCH_API);
  if (params.keyword) url.searchParams.set("keyword", params.keyword);
  if (params.page && params.page > 1) url.searchParams.set("page", String(params.page));
  url.searchParams.set("mode", params.mode || "s");
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
        Referer: BASE_URL,
      },
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        console.warn(`[104] Rate limited or blocked: ${response.status}`);
        return null;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error(`[104] Fetch error for ${url}:`, error);
    return null;
  }
}

async function fetchJobApi(
  keyword: string,
  page: number,
  config: CrawlerConfig
): Promise<{ jobs: ExternalJob[]; hasMore: boolean }> {
  const apiUrl = `${BASE_URL}/jobs/search/list`;
  const params = new URLSearchParams({
    keyword,
    page: String(page),
    mode: "s",
    jobsource: "2018indexpoc",
  });

  try {
    const response = await fetch(`${apiUrl}?${params}`, {
      headers: {
        "User-Agent": config.userAgent,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
        Referer: `${BASE_URL}/jobs/search/?keyword=${encodeURIComponent(keyword)}`,
      },
    });

    if (!response.ok) {
      return { jobs: [], hasMore: false };
    }

    const data = await response.json();
    const jobs: ExternalJob[] = [];

    const jobList = data?.data?.list || [];
    for (const item of jobList) {
      const externalId = item.jobNo || item.j || String(item.id);
      if (!externalId) continue;

      const title = sanitizeText(item.jobName || item.n || "");
      const company = sanitizeText(item.custName || item.c || "Unknown");
      const location = sanitizeText(
        item.jobAddrNoDesc || item.area || "Taiwan"
      );

      const snippet = sanitizeText(item.description || item.d || "");
      const salary = item.salaryDesc || item.s || undefined;
      const jobType = normalizeJobType(item.periodDesc || item.p);

      const jobUrl = item.link || `${BASE_URL}/job/${externalId}`;

      const fullText = `${title} ${company} ${snippet}`;
      const isVietnameseJob = isVietnameseRelatedJob(fullText);

      jobs.push({
        source: "104",
        externalId,
        title,
        company,
        location,
        snippet: snippet.slice(0, 500),
        jobType,
        salary,
        externalUrl: jobUrl,
        isVietnameseJob,
      });
    }

    const totalCount = data?.data?.totalCount || 0;
    const pageSize = data?.data?.pageSize || 20;
    const hasMore = page * pageSize < totalCount;

    return { jobs, hasMore };
  } catch (error) {
    console.error("[104] API fetch error:", error);
    return { jobs: [], hasMore: false };
  }
}

function parseJobListings(html: string): ExternalJob[] {
  const jobs: ExternalJob[] = [];

  const articleRegex =
    /<article[^>]*class="[^"]*job-list-item[^"]*"[^>]*>[\s\S]*?<\/article>/gi;
  const articles = html.match(articleRegex) || [];

  for (const article of articles) {
    try {
      const linkMatch = article.match(
        /<a[^>]*href="(\/job\/[a-zA-Z0-9]+[^"]*)"[^>]*>/i
      );
      if (!linkMatch) continue;

      const path = linkMatch[1];
      const externalId = path.match(/\/job\/([a-zA-Z0-9]+)/)?.[1];
      if (!externalId) continue;

      const url = `${BASE_URL}${path}`;

      const titleMatch = article.match(
        /<a[^>]*class="[^"]*js-job-link[^"]*"[^>]*>([^<]+)<\/a>/i
      );
      const title = titleMatch ? sanitizeText(titleMatch[1]) : "";

      const companyMatch = article.match(
        /<a[^>]*data-gtm-joblist="[^"]*company[^"]*"[^>]*>([^<]+)<\/a>/i
      );
      const company = companyMatch ? sanitizeText(companyMatch[1]) : "Unknown";

      const locationMatch = article.match(
        /<span[^>]*class="[^"]*job-address[^"]*"[^>]*>([^<]+)<\/span>/i
      );
      const location = locationMatch
        ? sanitizeText(locationMatch[1])
        : "Taiwan";

      const snippetMatch = article.match(
        /<p[^>]*class="[^"]*job-content[^"]*"[^>]*>([^<]+)<\/p>/i
      );
      const snippet = snippetMatch ? sanitizeText(snippetMatch[1]) : "";

      const salaryMatch = article.match(
        /<span[^>]*class="[^"]*salary[^"]*"[^>]*>([^<]+)<\/span>/i
      );
      const salary = salaryMatch ? sanitizeText(salaryMatch[1]) : undefined;

      const fullText = `${title} ${company} ${snippet}`;
      const isVietnameseJob = isVietnameseRelatedJob(fullText);

      jobs.push({
        source: "104",
        externalId,
        title,
        company,
        location,
        snippet: snippet.slice(0, 500),
        salary,
        externalUrl: url,
        isVietnameseJob,
      });
    } catch (error) {
      console.error("[104] Error parsing article:", error);
    }
  }

  return jobs;
}

export async function crawl104(
  config: CrawlerConfig = DEFAULT_CONFIG
): Promise<CrawlResult> {
  const startTime = Date.now();
  const allJobs: ExternalJob[] = [];
  const seenIds = new Set<string>();
  let errorMessage: string | undefined;

  const searchQueries = ["越南", "vietnam", "東南亞", "外籍"];

  try {
    for (const keyword of searchQueries) {
      for (let page = 1; page <= Math.min(config.maxPagesPerRun, 5); page++) {
        console.log(`[104] Fetching keyword="${keyword}" page=${page}`);

        const { jobs, hasMore } = await fetchJobApi(keyword, page, config);

        if (jobs.length === 0) {
          const url = buildSearchUrl({ keyword, page });
          const html = await fetchPage(url, config);
          if (html) {
            const htmlJobs = parseJobListings(html);
            for (const job of htmlJobs) {
              if (!seenIds.has(job.externalId)) {
                seenIds.add(job.externalId);
                allJobs.push(job);
              }
            }
          }
        } else {
          for (const job of jobs) {
            if (!seenIds.has(job.externalId)) {
              seenIds.add(job.externalId);
              allJobs.push(job);
            }
          }
        }

        console.log(
          `[104] Page ${page}: found ${jobs.length} jobs (total unique: ${allJobs.length})`
        );

        if (!hasMore && jobs.length === 0) {
          console.log(`[104] No more results for "${keyword}"`);
          break;
        }

        await politeDelay(config);
      }

      await politeDelay(config);
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[104] Crawl error:", error);
  }

  const vietnameseJobs = allJobs.filter((j) => j.isVietnameseJob);

  return {
    source: "104",
    status: errorMessage ? "partial" : "success",
    jobs: vietnameseJobs,
    jobsFound: vietnameseJobs.length,
    errorMessage,
    durationMs: Date.now() - startTime,
  };
}
