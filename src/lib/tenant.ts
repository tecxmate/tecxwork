import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { orgs } from "@/lib/db/schema";
import { isTrialExpired, type PlanId } from "@/lib/plans";

/**
 * The tenant behind the current request.
 *
 * `lib/tenant-host.ts` decides the slug from the Host header and `proxy.ts` publishes it as
 * `x-tenant-slug`; this module turns that into the org row and its commercial state.
 */

export type Tenant = {
  id: number;
  name: string;
  slug: string;
  kind: string;
  status: "active" | "suspended" | "cancelled";
  plan: string;
  seatLimit: number;
  trialEndsAt: Date | null;
};

/**
 * Why a tenant cannot be served right now, or null when it can.
 *
 * Returned rather than thrown so the caller decides the shape of the refusal — a route
 * answers with JSON and a page renders a billing notice, and neither should be parsing an
 * error message to tell "suspended" from "trial over".
 */
export type TenantBlock =
  | { reason: "suspended"; message: string }
  | { reason: "cancelled"; message: string }
  | { reason: "trial_expired"; message: string };

/** The slug the proxy resolved, or null on the apex domain (and in tests). */
export async function getTenantSlug(): Promise<string | null> {
  const h = await headers();
  const slug = h.get("x-tenant-slug");
  return slug && slug.length > 0 ? slug : null;
}

/**
 * Load the org named by the request's host.
 *
 * Wrapped in React's `cache` so the many server components rendering one page share a
 * single query, the same treatment `event-branding.ts` gives its config row. Returns null
 * when the host names no tenant (apex, localhost, tests) — callers fall back to the
 * caller's own membership, which is what keeps single-domain access working.
 */
export const getTenant = cache(async (): Promise<Tenant | null> => {
  const slug = await getTenantSlug();
  if (!slug) return null;
  return getTenantBySlug(slug);
});

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const [row] = await getDb()
    .select({
      id: orgs.id,
      name: orgs.name,
      slug: orgs.slug,
      kind: orgs.kind,
      status: orgs.status,
      plan: orgs.plan,
      seatLimit: orgs.seatLimit,
      trialEndsAt: orgs.trialEndsAt,
    })
    .from(orgs)
    .where(eq(orgs.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function getTenantById(orgId: number): Promise<Tenant | null> {
  const [row] = await getDb()
    .select({
      id: orgs.id,
      name: orgs.name,
      slug: orgs.slug,
      kind: orgs.kind,
      status: orgs.status,
      plan: orgs.plan,
      seatLimit: orgs.seatLimit,
      trialEndsAt: orgs.trialEndsAt,
    })
    .from(orgs)
    .where(eq(orgs.id, orgId))
    .limit(1);
  return row ?? null;
}

/**
 * Whether a tenant may be served, independent of who is asking.
 *
 * A lapsed trial and a suspended account both stop the product working while leaving every
 * row untouched — recovery is one column change, never a restore. That is the whole reason
 * commercial state lives on the org rather than being expressed by deleting things.
 */
export function tenantBlock(
  tenant: Pick<Tenant, "status" | "plan" | "trialEndsAt">,
  now: Date = new Date()
): TenantBlock | null {
  if (tenant.status === "suspended") {
    return {
      reason: "suspended",
      message:
        "This workspace is suspended. Contact your account manager to restore access.",
    };
  }
  if (tenant.status === "cancelled") {
    return {
      reason: "cancelled",
      message: "This workspace has been closed.",
    };
  }
  if (isTrialExpired(tenant.plan, tenant.trialEndsAt, now)) {
    return {
      reason: "trial_expired",
      message: "Your trial has ended. Upgrade to continue using this workspace.",
    };
  }
  return null;
}

export type { PlanId };
