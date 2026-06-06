import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCachedRecruiters } from "@/lib/cache";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success, remaining, reset } = await rateLimit(ip, "public", "recruiters");

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(remaining, reset) }
    );
  }

  const url = new URL(request.url);
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();
  const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") || "12", 10), 1),
    50
  );

  const result = await getCachedRecruiters();
  const filtered = search
    ? result.filter((recruiter) => {
        const haystack = [
          recruiter.company,
          recruiter.industry,
          recruiter.description,
          ...recruiter.positions,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      })
    : result;

  const total = filtered.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const recruiters = filtered.slice(start, start + limit);

  return NextResponse.json(
    { recruiters, total, page: safePage, totalPages, limit },
    { headers: rateLimitHeaders(remaining, reset) }
  );
}
