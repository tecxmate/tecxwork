export interface ExternalJob {
  source: "104" | "1111";
  externalId: string;
  title: string;
  company: string;
  location: string;
  snippet: string;
  jobType?: "full_time" | "part_time" | "internship" | "contract";
  salary?: string;
  externalUrl: string;
  isVietnameseJob: boolean;
}

export interface CrawlResult {
  source: "104" | "1111";
  status: "success" | "partial" | "error";
  jobs: ExternalJob[];
  jobsFound: number;
  errorMessage?: string;
  durationMs: number;
}

export interface CrawlerConfig {
  minDelay: number;
  maxDelay: number;
  maxPagesPerRun: number;
  userAgent: string;
}

export const DEFAULT_CONFIG: CrawlerConfig = {
  minDelay: 2000,
  maxDelay: 5000,
  maxPagesPerRun: 20,
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};
