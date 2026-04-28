import { getCache } from "@vercel/functions";

interface RateLimitConfig {
  limit: number;
  window: number; // seconds
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  api: { limit: 60, window: 60 }, // 60 req/min for general API
  auth: { limit: 5, window: 60 }, // 5 req/min for auth endpoints
};

/**
 * Best-effort fixed-window rate limiter backed by Vercel Runtime Cache.
 *
 * The cache exposes get/set/delete only — no atomic increment — so under
 * burst concurrency two callers can each read N and write N+1, briefly
 * overshooting the limit. To keep the overshoot bounded:
 *   - the cache key embeds the window start, so windows roll over cleanly
 *     and a previous-window key can never leak credits into the next one
 *   - the TTL is set to the remaining time in the window, not the full
 *     window length, so keys expire exactly at the boundary
 *
 * For strict guarantees (e.g. credential stuffing defenses), back this with
 * an atomic store (Upstash INCR or a Postgres upsert).
 */
export async function rateLimit(
  ip: string,
  type: "api" | "auth" = "api",
  scope = "global"
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const config = DEFAULTS[type];
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % config.window);
  const reset = windowStart + config.window;
  const ttl = Math.max(1, reset - now);
  const key = `ratelimit:${type}:${scope}:${ip}:${windowStart}`;

  const cache = getCache({ namespace: "ratelimit" });
  const current = ((await cache.get(key)) as number | undefined) ?? 0;

  if (current >= config.limit) {
    return { success: false, remaining: 0, reset };
  }

  await cache.set(key, current + 1, { ttl });

  return { success: true, remaining: config.limit - current - 1, reset };
}

/**
 * Rate limit response headers
 */
export function rateLimitHeaders(remaining: number, reset: number) {
  return {
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(reset),
  };
}
