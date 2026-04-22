import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCachedExternalJobs } from "@/lib/cache";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const JOB_TYPE_ORDER: Record<string, number> = {
  full_time: 1,
  part_time: 2,
  internship: 3,
  contract: 4,
};

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

    filtered = [...filtered].sort((a, b) => {
      const orderA = a.jobType ? JOB_TYPE_ORDER[a.jobType] ?? 99 : 99;
      const orderB = b.jobType ? JOB_TYPE_ORDER[b.jobType] ?? 99 : 99;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      const timeA = new Date(a.lastSeenAt).getTime();
      const timeB = new Date(b.lastSeenAt).getTime();
      return timeB - timeA;
    });

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
