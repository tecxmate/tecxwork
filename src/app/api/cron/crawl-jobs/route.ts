import { NextResponse } from "next/server";
import { crawlAll, DEFAULT_CONFIG } from "@/lib/crawler";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron] Starting scheduled job crawl...");

    const result = await crawlAll({
      ...DEFAULT_CONFIG,
      minDelay: 3000,
      maxDelay: 6000,
      maxPagesPerRun: 10,
    });

    console.log(
      `[Cron] Completed: ${result.totalJobsFound} jobs, ${result.totalInserted} new, ${result.totalUpdated} updated`
    );

    return NextResponse.json({
      success: true,
      totalJobsFound: result.totalJobsFound,
      totalInserted: result.totalInserted,
      totalUpdated: result.totalUpdated,
      isOffPeakHours: result.isOffPeakHours,
      results: result.results.map((r) => ({
        source: r.source,
        status: r.status,
        jobsFound: r.jobsFound,
        durationMs: r.durationMs,
        errorMessage: r.errorMessage,
      })),
    });
  } catch (error) {
    console.error("[Cron] Crawl failed:", error);
    return NextResponse.json(
      {
        error: "Crawl failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export const maxDuration = 300;
