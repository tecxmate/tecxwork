import { describe, expect, it } from "vitest";
import { consumeRateLimit, rateLimitHeaders } from "@/lib/rate-limit-atomic";

let seq = 0;
const bucket = () => `test:${seq++}:${Date.now()}`;

describe("atomic rate limiter", () => {
  it("allows up to the limit and refuses past it", async () => {
    const b = bucket();
    for (let i = 0; i < 3; i++) {
      expect((await consumeRateLimit(b, 3, 60)).success, `call ${i + 1}`).toBe(true);
    }
    expect((await consumeRateLimit(b, 3, 60)).success).toBe(false);
  });

  it("counts down remaining, and floors it at zero", async () => {
    const b = bucket();
    expect((await consumeRateLimit(b, 2, 60)).remaining).toBe(1);
    expect((await consumeRateLimit(b, 2, 60)).remaining).toBe(0);
    expect((await consumeRateLimit(b, 2, 60)).remaining).toBe(0);
  });

  it("counts each bucket separately, so one key cannot throttle another", async () => {
    const a = bucket();
    const c = bucket();
    await consumeRateLimit(a, 1, 60);
    expect((await consumeRateLimit(a, 1, 60)).success).toBe(false);
    expect((await consumeRateLimit(c, 1, 60)).success).toBe(true);
  });

  it("rolls over into the next window", async () => {
    const b = bucket();
    const now = 1_000_000;
    await consumeRateLimit(b, 1, 60, now);
    expect((await consumeRateLimit(b, 1, 60, now)).success).toBe(false);
    // A time inside the following window gets a fresh allowance.
    expect((await consumeRateLimit(b, 1, 60, now + 60)).success).toBe(true);
  });

  it("does not overshoot under concurrency — the property the cache limiter lacks", async () => {
    // The reason this file exists. Twenty callers race for ten slots; a read-then-write
    // limiter lets more than ten through, an atomic upsert cannot.
    const b = bucket();
    const results = await Promise.all(
      Array.from({ length: 20 }, () => consumeRateLimit(b, 10, 60))
    );

    expect(results.filter((r) => r.success)).toHaveLength(10);
    expect(results.filter((r) => !r.success)).toHaveLength(10);
  });

  it("reports a reset at the window boundary", async () => {
    const result = await consumeRateLimit(bucket(), 5, 60, 1_000_030);
    // Window starts at 1_000_020 (a multiple of 60), so it resets at 1_000_080.
    expect(result.reset).toBe(1_000_080);

    const headers = rateLimitHeaders(result);
    expect(headers["X-RateLimit-Limit"]).toBe("5");
    expect(headers["X-RateLimit-Reset"]).toBe("1000080");
  });
});
