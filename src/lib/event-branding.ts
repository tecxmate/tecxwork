import "server-only";
import { cache } from "react";
import { eq, isNull, type SQL } from "drizzle-orm";
import { getCache } from "@vercel/functions";
import { db, eventConfig } from "@/lib/db";
import { EVENT_CONFIG } from "@/lib/data";
import { getTenant } from "@/lib/tenant";

const runtimeCache = getCache({ namespace: "app" });
const EVENT_CONFIG_KEY = "event-config:row:v1";
const EVENT_CONFIG_TAG = "event-config";
const EVENT_CONFIG_TTL = 3600; // 1h; invalidated on admin edits via the tag

/**
 * Purge the cached event_config row. Call after any admin write that changes
 * branding/timing fields so the next read is fresh.
 */
export async function invalidateEventConfigCache() {
  await runtimeCache.expireTag(EVENT_CONFIG_TAG);
}

export type EventBranding = {
  name: string;
  emailEventName: string;
  tagline: string;
  subtitle: string;
  organizer: string;
  organizerShort: string;
  hostedAt: string;
  hostedAtFull: string;
  date: Date;
  endDate: Date;
  displayDate: string;
  displayYear: string;
  location: string;
  timezone: string;
  slotDuration: number;
  bufferMinutes: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  /** @deprecated alias of endMinute, kept for backwards compatibility */
  endMinutes: number;
  enableNewsletterOptIn: boolean;
  heroOverlayEnabled: boolean;
};

/**
 * Cross-request cache for the event_config row. This query runs on every page
 * (root layout `generateMetadata`) plus several pages, so caching it removes a
 * per-request DB round trip and shields the (free-tier) DB from the connection
 * storm that can overload it under load. Invalidated via EVENT_CONFIG_CACHE_TAG.
 */
type EventConfigRow = Awaited<ReturnType<typeof queryEventConfigRow>>;

/**
 * Which tenant's branding to serve, or null for the platform default.
 *
 * Defensive on purpose: this runs from `generateMetadata`, from the sitemap, and from
 * statically prerendered routes, and `headers()` is not available in all of them. A
 * prerendered page is by definition not tenant-specific, so the platform default is the
 * correct answer there rather than an error.
 */
async function currentOrgId(): Promise<number | null> {
  try {
    const tenant = await getTenant();
    return tenant?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * The tenant's own row, falling back to the platform default.
 *
 * The fallback is what lets a workspace exist before anyone has customised its branding —
 * and it is why this query is two steps rather than one `IN` with an ordering trick: the
 * intent ("mine, else the platform's") should be readable.
 */
async function queryEventConfigRow(orgId: number | null) {
  try {
    if (orgId !== null) {
      const own = await selectEventConfigRow(eq(eventConfig.orgId, orgId));
      if (own) return own;
    }
    return await selectEventConfigRow(isNull(eventConfig.orgId));
  } catch (err) {
    // `event_config.org_id` is added by the saas-tenancy migration. Between a deploy and
    // that migration the column does not exist, and every query above fails — which would
    // drop the whole public site back to the hardcoded EVENT_CONFIG, losing the event name,
    // dates and imagery the admin panel controls.
    //
    // Falling back to the unscoped read (the behaviour before tenancy) keeps branding live
    // through that window, so deploy order stops mattering. Narrow on purpose: only
    // undefined_column is caught, so a genuinely broken query still surfaces.
    if (!isUndefinedColumn(err)) throw err;
    console.warn(
      "event_config.org_id is missing — serving unscoped branding. " +
        "Run `npm run db:update:saas-tenancy` against this database."
    );
    return selectEventConfigRow(undefined);
  }
}

/** Postgres `undefined_column` (42703) — the one error this fallback is for. */
function isUndefinedColumn(err: unknown): boolean {
  const code = (err as { code?: unknown })?.code;
  if (code === "42703") return true;
  // Neon's serverless driver wraps the original error rather than re-exposing `code`.
  const cause = (err as { cause?: { code?: unknown } })?.cause;
  return cause?.code === "42703";
}

async function selectEventConfigRow(where: SQL | undefined) {
  const [row] = await db
    .select({
      eventName: eventConfig.eventName,
      emailEventName: eventConfig.emailEventName,
      tagline: eventConfig.tagline,
      organizer: eventConfig.organizer,
      organizerShort: eventConfig.organizerShort,
      hostedAt: eventConfig.hostedAt,
      hostedAtFull: eventConfig.hostedAtFull,
      displayDate: eventConfig.displayDate,
      displayYear: eventConfig.displayYear,
      eventDate: eventConfig.eventDate,
      eventEndDate: eventConfig.eventEndDate,
      location: eventConfig.location,
      heroOverlayEnabled: eventConfig.heroOverlayEnabled,
      startHour: eventConfig.startHour,
      startMinute: eventConfig.startMinute,
      endHour: eventConfig.endHour,
      endMinute: eventConfig.endMinute,
      slotDurationMinutes: eventConfig.slotDurationMinutes,
      bufferMinutes: eventConfig.bufferMinutes,
    })
    .from(eventConfig)
    .where(where)
    .limit(1);
  return row ?? null;
}

async function fetchEventConfigRow(orgId: number | null): Promise<EventConfigRow> {
  // The cache key carries the tenant. Without it every workspace would share one entry and
  // the first one to warm the cache would brand the whole platform.
  const cacheKey = `${EVENT_CONFIG_KEY}:${orgId ?? "platform"}`;
  try {
    const cached = await runtimeCache.get(cacheKey);
    if (cached) return cached as EventConfigRow;
  } catch {
    // cache unavailable (e.g. build) — fall through to a direct query
  }
  const row = await queryEventConfigRow(orgId);
  if (row) {
    try {
      await runtimeCache.set(cacheKey, row, {
        ttl: EVENT_CONFIG_TTL,
        tags: [EVENT_CONFIG_TAG],
      });
    } catch {
      // ignore cache write failures
    }
  }
  return row;
}

const staticFallback = (): EventBranding => ({
  ...EVENT_CONFIG,
  heroOverlayEnabled: true,
  startMinute: 0,
  endMinute: EVENT_CONFIG.endMinutes,
  bufferMinutes: 0,
});

/**
 * Fetches event branding fields from the DB (cached) and merges with static
 * EVENT_CONFIG defaults. Wrapped in React `cache()` for per-request dedup.
 *
 * Use this on the server (metadata, emails, server components) so the
 * admin panel can update event branding for the next job fair without
 * redeploying.
 */
export const getEventBranding = cache(async (): Promise<EventBranding> => {
  try {
    const row = await fetchEventConfigRow(await currentOrgId());
    if (!row) {
      return staticFallback();
    }

    return {
      ...EVENT_CONFIG,
      heroOverlayEnabled: row.heroOverlayEnabled ?? true,
      startHour: row.startHour ?? EVENT_CONFIG.startHour,
      startMinute: row.startMinute ?? 0,
      endHour: row.endHour ?? EVENT_CONFIG.endHour,
      endMinute: row.endMinute ?? EVENT_CONFIG.endMinutes,
      endMinutes: row.endMinute ?? EVENT_CONFIG.endMinutes,
      slotDuration: row.slotDurationMinutes ?? EVENT_CONFIG.slotDuration,
      bufferMinutes: row.bufferMinutes ?? 0,
      name: row.eventName ?? EVENT_CONFIG.name,
      emailEventName: row.emailEventName ?? EVENT_CONFIG.emailEventName,
      tagline: row.tagline ?? EVENT_CONFIG.tagline,
      organizer: row.organizer ?? EVENT_CONFIG.organizer,
      organizerShort: row.organizerShort ?? EVENT_CONFIG.organizerShort,
      hostedAt: row.hostedAt ?? EVENT_CONFIG.hostedAt,
      hostedAtFull: row.hostedAtFull ?? EVENT_CONFIG.hostedAtFull,
      displayDate: row.displayDate ?? EVENT_CONFIG.displayDate,
      displayYear: row.displayYear ?? EVENT_CONFIG.displayYear,
      // unstable_cache serializes Dates to strings; rehydrate defensively.
      date: row.eventDate ? new Date(row.eventDate) : EVENT_CONFIG.date,
      endDate: row.eventEndDate ? new Date(row.eventEndDate) : EVENT_CONFIG.endDate,
      location: row.location ?? EVENT_CONFIG.location,
    };
  } catch (err) {
    console.error("getEventBranding: falling back to static EVENT_CONFIG", err);
    return staticFallback();
  }
});
