import "server-only";
import { cache } from "react";
import { getCache } from "@vercel/functions";
import { eq } from "drizzle-orm";
import { db, eventConfig } from "@/lib/db";
import { EVENT_CONFIG } from "@/lib/data";
import { getDefaultEvent } from "@/lib/tenant";

const runtimeCache = getCache({ namespace: "app" });
// Cache key + tag are scoped per event so tenants don't share a cached row.
const eventConfigKey = (eventId: number) => `event-config:row:v2:${eventId}`;
const eventConfigTag = (eventId: number) => `event-config:${eventId}`;
const EVENT_CONFIG_TTL = 3600; // 1h; invalidated on admin edits via the tag

/**
 * Purge the cached event_config row for one event. Call after any admin write
 * that changes branding/timing fields so the next read is fresh.
 */
export async function invalidateEventConfigCache(eventId: number) {
  await runtimeCache.expireTag(eventConfigTag(eventId));
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

async function queryEventConfigRow(eventId: number) {
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
    .where(eq(eventConfig.eventId, eventId))
    .limit(1);
  return row ?? null;
}

async function fetchEventConfigRow(eventId: number): Promise<EventConfigRow> {
  try {
    const cached = await runtimeCache.get(eventConfigKey(eventId));
    if (cached) return cached as EventConfigRow;
  } catch {
    // cache unavailable (e.g. build) — fall through to a direct query
  }
  const row = await queryEventConfigRow(eventId);
  if (row) {
    try {
      await runtimeCache.set(eventConfigKey(eventId), row, {
        ttl: EVENT_CONFIG_TTL,
        tags: [eventConfigTag(eventId)],
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
    // Resolve via getDefaultEvent (no request headers) so this stays usable in
    // statically-prerendered pages — calling headers() here would force every
    // route in the shared root layout into dynamic rendering. Phase 3 will make
    // /e/[slug] branding slug-aware via that route tree, not the global path.
    const event = await getDefaultEvent();
    const row = event ? await fetchEventConfigRow(event.id) : null;
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
