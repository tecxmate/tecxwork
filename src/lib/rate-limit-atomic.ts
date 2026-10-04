import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

/**
 * An atomic fixed-window rate limiter, backed by Postgres.
 *
 * `lib/rate-limit.ts` states its own weakness plainly: the Vercel cache has get and set but
 * no atomic increment, so two concurrent callers each read N and each write N+1. Against a
 * browser that overshoot is academic. Against machine callers it is the actual failure
 * mode — an agent bursts in parallel on one credential, which is precisely the case the
 * read-then-write loses.
 *
 * `INSERT … ON CONFLICT DO UPDATE … RETURNING` is atomic in one statement, so the count a
 * caller gets back is the count it actually took. That single property is the whole reason
 * this file exists; everything else here is bookkeeping.
 *
 * Fixed windows, not a sliding log: a burst straddling a boundary can briefly see up to
 * twice the limit. That is the accepted, well-understood trade for one row and one
 * statement per request, and it is a bound rather than the unbounded overshoot above.
 */

export type RateLimitResult = {
  success: boolean;
  /** Requests left in this window, floored at zero. */
  remaining: number;
  /** Unix seconds when the window rolls over. */
  reset: number;
  limit: number;
};

/** Sweep probability per call. Bounded work on a path already writing, so no cron. */
const SWEEP_CHANCE = 0.01;

export async function consumeRateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
  now: number = Math.floor(Date.now() / 1000)
): Promise<RateLimitResult> {
  const windowStart = now - (now % windowSeconds);
  const reset = windowStart + windowSeconds;
  const db = getDb();

  // One statement: insert-or-increment, and tell me the resulting count. Nothing between
  // the read and the write for a concurrent caller to slip into.
  const rows = (await db.execute(sql`
    INSERT INTO rate_limit_counters (bucket, window_start, count)
    VALUES (${bucket}, ${windowStart}, 1)
    ON CONFLICT (bucket, window_start)
    DO UPDATE SET count = rate_limit_counters.count + 1
    RETURNING count
  `)) as unknown as { rows?: { count: number }[] } | { count: number }[];

  // The two drivers in this repo (Neon serverless and node-postgres) disagree about
  // whether execute() returns rows directly or wraps them, so accept both.
  const list = Array.isArray(rows) ? rows : (rows.rows ?? []);
  const count = Number(list[0]?.count ?? 1);

  if (Math.random() < SWEEP_CHANCE) void sweep(windowStart - windowSeconds);

  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
    reset,
    limit,
  };
}

/** Drop windows that can no longer be current. Never allowed to fail a request. */
async function sweep(before: number): Promise<void> {
  await getDb()
    .execute(sql`DELETE FROM rate_limit_counters WHERE window_start < ${before}`)
    .catch(() => {});
}

/** Headers an HTTP caller can act on rather than guess from a 429 alone. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}
