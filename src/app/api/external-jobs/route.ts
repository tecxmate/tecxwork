import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCachedExternalJobs } from "@/lib/cache";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const { success, remaining, reset } = await rateLimit(ip, "api");

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitHeaders(remaining, reset) }
      );
    }

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

    const jobs = await getCachedExternalJobs({
      source: source || undefined,
      jobType: jobType || undefined,
      search,
      limit: Math.min(limit, 500),
    });

    return NextResponse.json(
      {
        jobs,
        count: jobs.length,
        attribution: "Data provided by 1111 Job Bank",
      },
      { headers: rateLimitHeaders(remaining, reset) }
    );
  } catch (error) {
    console.error("[API] Error fetching external jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
