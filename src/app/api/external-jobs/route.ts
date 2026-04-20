import { NextResponse } from "next/server";
import { getExternalJobs } from "@/lib/crawler";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const source = url.searchParams.get("source") as "104" | "1111" | null;
    const jobType = url.searchParams.get("jobType") as
      | "full_time"
      | "part_time"
      | "internship"
      | "contract"
      | null;
    const search = url.searchParams.get("search") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const jobs = await getExternalJobs({
      source: source || undefined,
      jobType: jobType || undefined,
      search,
      limit: Math.min(limit, 500),
    });

    return NextResponse.json({
      jobs,
      count: jobs.length,
      attribution: "Data provided by 1111 Job Bank",
    });
  } catch (error) {
    console.error("[API] Error fetching external jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
