import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCachedExternalJobs } from "@/lib/cache";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

function isEnglishTitle(title: string): boolean {
  const asciiLetters = (title.match(/[a-zA-Z]/g) || []).length;
  const chineseChars = (title.match(/[\u4e00-\u9fff]/g) || []).length;
  if (asciiLetters + chineseChars === 0) return false;
  return asciiLetters > chineseChars;
}

export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const { success, remaining, reset } = await rateLimit(
      ip,
      "api",
      "external-jobs"
    );

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
    const search = (url.searchParams.get("search") || "").trim().toLowerCase();
    const language = url.searchParams.get("language") as "all" | "english" | null;
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") || "24", 10), 1),
      100
    );
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);

    const allJobs = await getCachedExternalJobs({
      source: source || undefined,
      jobType: jobType || undefined,
      limit: 500,
    });

    let filtered = allJobs;

    if (search) {
      filtered = filtered.filter((job) => {
        const haystack = [
          job.title,
          job.company,
          job.snippet,
          job.location,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      });
    }

    if (language === "english") {
      filtered = filtered.filter((job) => isEnglishTitle(job.title));
    }

    const total = filtered.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const jobs = filtered.slice(start, start + limit);

    return NextResponse.json(
      {
        jobs,
        count: jobs.length,
        total,
        page: safePage,
        totalPages,
        limit,
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
