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
 * Simple rate limiter using Vercel Runtime Cache
 * Returns { success, remaining, reset } or throws if limit exceeded
 */
export async function rateLimit(
  ip: string,
  type: "api" | "auth" = "api"
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const config = DEFAULTS[type];
  const key = `ratelimit:${type}:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % config.window);
  const reset = windowStart + config.window;

  const cache = getCache({ namespace: "ratelimit" });
  const current = ((await cache.get(key)) as number | undefined) ?? 0;

  if (current >= config.limit) {
    return { success: false, remaining: 0, reset };
  }

  await cache.set(key, current + 1, { ttl: config.window });

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
