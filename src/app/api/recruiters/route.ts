import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCachedRecruiters } from "@/lib/cache";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET() {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success, remaining, reset } = await rateLimit(ip, "api");

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(remaining, reset) }
    );
  }

  const result = await getCachedRecruiters();

  return NextResponse.json(
    { recruiters: result },
    { headers: rateLimitHeaders(remaining, reset) }
  );
}
