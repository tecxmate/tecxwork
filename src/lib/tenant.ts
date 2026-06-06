import { cache } from "react";
import { headers } from "next/headers";
import { getCache } from "@vercel/functions";
import { and, asc, eq } from "drizzle-orm";
import { db, events, memberships } from "@/lib/db";
import { getSession, requireSession, type SessionPayload } from "@/lib/auth";

/**
 * Multi-tenant context (Phase 1). The active event is resolved from the
 * `/e/[slug]` route — `proxy.ts` injects the slug as the `x-event-slug` request
 * header, which we read here. During the transition (before flat routes move
 * under `/e/[slug]` in Phase 3), there is no slug, so we fall back to the single
 * active event. Behavior is therefore identical until routing changes.
 *
 * This module is server-only (it touches the DB and request headers). Do not
 * import it into `proxy.ts` (middleware) or client components.
 */

export const EVENT_SLUG_HEADER = "x-event-slug";

export type EventRecord = {
  id: number;
  orgId: number;
  slug: string;
  name: string;
  status: "draft" | "active" | "archived";
};

export type TenantContext = {
  eventId: number;
  orgId: number;
  event: EventRecord;
};

export type MembershipRole = "org_admin" | "recruiter";

function selectEvent() {
  return db
    .select({
      id: events.id,
      orgId: events.orgId,
      slug: events.slug,
      name: events.name,
      status: events.status,
    })
    .from(events);
}

// Event resolution runs on (nearly) every request via getEventBranding. Cache
// it across requests so the hot path doesn't hit the (free-tier) DB each time —
// the same protection the event_config runtime cache provides. Tag `events` so
// it can be invalidated when events change (admin edits land in a later phase).
const runtimeCache = getCache({ namespace: "app" });
const EVENT_TTL = 300; // 5 min
const eventBySlugKey = (slug: string) => `event:slug:v1:${slug}`;
const DEFAULT_EVENT_KEY = "event:default:v1";

async function cachedEvent(
  key: string,
  loader: () => Promise<EventRecord | null>
): Promise<EventRecord | null> {
  try {
    const cached = await runtimeCache.get(key);
    if (cached) return cached as EventRecord;
  } catch {
    // cache unavailable (e.g. build) — fall through to a direct query
  }
  const event = await loader();
  if (event) {
    try {
      await runtimeCache.set(key, event, { ttl: EVENT_TTL, tags: ["events"] });
    } catch {
      // ignore cache write failures
    }
  }
  return event;
}

/** Purge cached event lookups. Call after admin writes that change events. */
export async function invalidateEventsCache() {
  await runtimeCache.expireTag("events");
}

/** Look up an active event by its public slug. Returns null if missing/archived. */
export async function getActiveEventBySlug(
  slug: string
): Promise<EventRecord | null> {
  return cachedEvent(eventBySlugKey(slug), async () => {
    const [event] = await selectEvent()
      .where(and(eq(events.slug, slug), eq(events.status, "active")))
      .limit(1);
    return event ?? null;
  });
}

/**
 * The single active event, used as the fallback while flat routes still exist.
 * If multiple events are ever active, the lowest id wins deterministically.
 */
export async function getDefaultEvent(): Promise<EventRecord | null> {
  return cachedEvent(DEFAULT_EVENT_KEY, async () => {
    const [event] = await selectEvent()
      .where(eq(events.status, "active"))
      .orderBy(asc(events.id))
      .limit(1);
    return event ?? null;
  });
}

/** Read the active event slug injected by proxy.ts, or null on flat routes. */
export async function resolveEventSlug(): Promise<string | null> {
  const h = await headers();
  return h.get(EVENT_SLUG_HEADER);
}

/**
 * Resolve the tenant for the current request. Throws if the slug names an
 * unknown event, or if no active event exists at all. Use in server components
 * and route handlers to scope queries by `ctx.eventId`.
 */
export const getTenantContext = cache(async (): Promise<TenantContext> => {
  const slug = await resolveEventSlug();
  const event = slug
    ? await getActiveEventBySlug(slug)
    : await getDefaultEvent();
  if (!event) {
    throw new Error(
      slug ? `Unknown or inactive event: ${slug}` : "No active event configured"
    );
  }
  return { eventId: event.id, orgId: event.orgId, event };
});

/** The current tenant's event id. Memoized per request via getTenantContext. */
export async function currentEventId(): Promise<number> {
  return (await getTenantContext()).eventId;
}

/** Non-throwing variant — returns null instead of throwing. */
export async function getTenantContextOrNull(): Promise<TenantContext | null> {
  try {
    return await getTenantContext();
  } catch {
    return null;
  }
}

// ---- Membership-based authorization (org-scoped) ----

export async function getUserMemberships(userId: number) {
  return db.select().from(memberships).where(eq(memberships.userId, userId));
}

export async function getMembership(userId: number, orgId: number) {
  const [m] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.orgId, orgId)))
    .limit(1);
  return m ?? null;
}

/**
 * Require that the current session has a membership in `orgId`, optionally with
 * a specific role. The legacy global admin (`users.role = 'admin'`) is allowed
 * through — it was backfilled as `org_admin` of the default org and remains the
 * platform-owner stand-in until Phase 4 introduces explicit platform roles.
 */
export async function requireMembership(
  orgId: number,
  role?: MembershipRole
): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role === "admin") return session;
  const m = await getMembership(session.userId, orgId);
  if (!m) throw new Error("Forbidden");
  if (role && m.role !== role) throw new Error("Forbidden");
  return session;
}

export async function requireOrgAdmin(orgId: number): Promise<SessionPayload> {
  return requireMembership(orgId, "org_admin");
}

/** Non-throwing membership check for the current session. */
export async function getSessionMembership(
  orgId: number
): Promise<{ session: SessionPayload; role: MembershipRole | "admin" } | null> {
  const session = await getSession();
  if (!session) return null;
  if (session.role === "admin") return { session, role: "admin" };
  const m = await getMembership(session.userId, orgId);
  if (!m) return null;
  return { session, role: m.role as MembershipRole };
}
