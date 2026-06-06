import { getCache } from "@vercel/functions";

interface RateLimitConfig {
  limit: number;
  window: number; // seconds
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  // Per-IP outer ring. Raised from 60 so a venue's shared NAT (hundreds of
  // students on one public IP) isn't collectively locked out during the event.
  // The real brute-force defense is the per-email `auth` bucket below, which is
  // unaffected by shared NAT.
  api: { limit: 300, window: 60 }, // 300 req/min per IP — general/auth outer ring
  auth: { limit: 5, window: 60 }, // 5 req/min — per-account auth bucket
  // Public, cache-served reads (recruiters / jobs / event-pulse). Cheap and
  // public, so the per-IP cap exists only to deter scraping — generous enough
  // that an entire venue behind one NAT can browse freely.
  public: { limit: 1200, window: 60 }, // 1200 req/min per IP — cached public reads
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
  type: "api" | "auth" | "public" = "api",
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
