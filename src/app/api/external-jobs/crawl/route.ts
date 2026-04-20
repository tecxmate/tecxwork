import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { crawlAll, DEFAULT_CONFIG } from "@/lib/crawler";

export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await crawlAll(DEFAULT_CONFIG);

    return NextResponse.json({
      success: true,
      ...result,
      message: `Crawl completed: ${result.totalJobsFound} jobs found, ${result.totalInserted} inserted, ${result.totalUpdated} updated`,
    });
  } catch (error) {
    console.error("[API] Crawl error:", error);
    return NextResponse.json(
      {
        error: "Crawl failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
