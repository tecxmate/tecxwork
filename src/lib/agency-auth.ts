import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRecruiterFromSession } from "@/lib/auth";
import { memberships, recruiters } from "@/lib/db/schema";
import type { MemberRole } from "@/lib/ats-auth";
import { can, type Capability } from "@/lib/permissions";
import { planAllows } from "@/lib/plans";
import { resolveApiKeyActor, touchApiKey, type ApiKeyActor } from "@/lib/api-keys";
import { consumeRateLimit } from "@/lib/rate-limit-atomic";
import { resolveOAuthActor } from "@/lib/oauth";
import { getTenant, getTenantById, tenantBlock } from "@/lib/tenant";

/**
 * Generous enough that ordinary automation never notices, low enough that a runaway loop
 * is stopped before it costs a database. Per key, per minute.
 */
const API_KEY_RATE_LIMIT = 300;
const API_KEY_RATE_WINDOW_SECONDS = 60;

export type AgencyActor = {
  orgId: number;
  recruiterId: number;
  userId: number;
  role: MemberRole;
  /** The tenant's plan, so a caller can shape the UI to what was actually bought. */
  plan: string;
};

/**
 * The single gate every agency request goes through.
 *
 * Three things have to be true and each is easy to forget at a call site: the caller must be
 * an AGENCY recruiter (a client-company recruiter must never create clients or job orders),
 * every row written or read has to be filtered by that recruiter's `orgId`, and their role in
 * the org has to actually permit the action. Returning the orgId and role here — rather than
 * letting each route look them up — is what makes "did we scope this query?" and "was this
 * allowed?" answerable by reading one function instead of twelve.
 *
 * Pass the capability the route needs. Omitting it authenticates the tenant but authorizes
 * nothing, which is only right for a request that reveals nothing on its own.
 *
 * Returns a ready-to-send 401/403 rather than throwing, so routes stay flat.
 */
export async function requireAgency(
  capability?: Capability
): Promise<{ ok: true; actor: AgencyActor } | { ok: false; response: NextResponse }> {
  const result = await resolveAgencyActor(capability);
  if (result.ok) return result;
  return {
    ok: false,
    response: NextResponse.json({ error: result.error }, { status: result.status }),
  };
}

/**
 * The same gate for server components, which render a page rather than return a status.
 *
 * Pages need this because they load agency data directly instead of going through the API —
 * which is exactly how the candidate database ended up readable by client-company recruiters:
 * the route was guarded and the page that showed the same rows was not.
 */
export async function getAgencyActor(
  capability?: Capability
): Promise<AgencyActor | null> {
  const result = await resolveAgencyActor(capability);
  return result.ok ? result.actor : null;
}

export type Resolution =
  | { ok: true; actor: AgencyActor }
  | { ok: false; error: string; status: 401 | 403 | 429 };

/**
 * A machine caller presents `Authorization: Bearer tw_…`; a person presents a cookie.
 *
 * Read through `headers()` rather than by taking the request as an argument, so every one
 * of the existing agency routes gained machine access without a signature change. The two
 * paths converge on the same `AgencyActor`, which is what stops "can a token do this?" from
 * becoming a second, divergent authorisation story.
 */
async function resolveAgencyActor(capability?: Capability): Promise<Resolution> {
  const token = await bearerFromHeaders();
  if (token) return resolveFromApiKey(token, capability);
  return resolveFromSession(capability);
}

async function bearerFromHeaders(): Promise<string | null> {
  try {
    const header = (await headers()).get("authorization");
    if (!header) return null;
    const [scheme, value] = header.split(" ");
    if (!value || scheme.toLowerCase() !== "bearer") return null;
    return value.trim() || null;
  } catch {
    // No request headers available (a prerender, a script). Not a machine caller.
    return null;
  }
}

async function resolveFromApiKey(
  token: string,
  capability?: Capability
): Promise<Resolution> {
  // An OAuth access token and an API key are two ways to present the same kind of actor, so
  // they converge here rather than forking the authorisation path.
  if (token.startsWith("two_")) {
    const oauth = await resolveOAuthActor(token);
    if (!oauth) return { ok: false, error: "Invalid access token", status: 401 };
    return authorizeApiKey(
      {
        keyId: oauth.tokenId,
        orgId: oauth.orgId,
        userId: oauth.userId,
        recruiterId: oauth.recruiterId,
        role: oauth.role,
        plan: oauth.plan,
        scopes: oauth.scopes,
      },
      capability
    );
  }

  const actor = await resolveApiKeyActor(token);
  // One message for every failure — unknown, revoked, expired, owner no longer a member,
  // workspace suspended. Distinguishing them tells an attacker whether they guessed a real
  // key.
  if (!actor) return { ok: false, error: "Invalid API key", status: 401 };
  return authorizeApiKey(actor, capability);
}

/**
 * Authorise an already-resolved key actor.
 *
 * Split out because a caller that has *already* resolved the credential must not have to
 * resolve it again from ambient request state. The MCP transport is exactly that caller: it
 * reads the token off the request to decide which tools to advertise, and then needs the
 * same commercial, plan, scope and rate-limit checks applied per call. Re-deriving the
 * actor from `headers()` there meant one fact with two sources, which is a bug waiting for
 * the day they disagree.
 */
export async function authorizeApiKey(
  actor: ApiKeyActor,
  capability?: Capability
): Promise<Resolution> {

  const org = await getTenantById(actor.orgId);
  if (!org) return { ok: false, error: "Workspace not found.", status: 403 };
  const blocked = tenantBlock(org);
  if (blocked) return { ok: false, error: blocked.message, status: 403 };

  // A host that names a tenant still decides which workspace the request is for, so a key
  // cannot be pointed at someone else's subdomain.
  const tenant = await getTenant();
  if (tenant && tenant.id !== actor.orgId) {
    return { ok: false, error: "You do not have access to this workspace.", status: 403 };
  }

  if (capability && !planAllows(org.plan, capability)) {
    return {
      ok: false,
      error: "This feature is not included in your current plan.",
      status: 403,
    };
  }

  // `scopes` is already the intersection of the key's grant and the owner's current role,
  // so this single check enforces both.
  if (capability && !actor.scopes.includes(capability)) {
    return { ok: false, error: "This key does not have that scope.", status: 403 };
  }

  // Per-KEY, not per-IP: agents share egress addresses, so an IP bucket would either
  // throttle unrelated tenants together or be set so high it limits nothing. Atomic,
  // because parallel bursts from one credential are exactly what the cache-based limiter
  // cannot count correctly.
  const limited = await consumeRateLimit(
    `api_key:${actor.keyId}`,
    API_KEY_RATE_LIMIT,
    API_KEY_RATE_WINDOW_SECONDS
  );
  if (!limited.success) {
    return {
      ok: false,
      error: `Rate limit exceeded. Try again after ${new Date(limited.reset * 1000).toISOString()}.`,
      status: 429,
    };
  }

  void touchApiKey(actor.keyId);

  return {
    ok: true,
    actor: {
      orgId: actor.orgId,
      recruiterId: actor.recruiterId,
      userId: actor.userId,
      role: actor.role,
      plan: org.plan,
    },
  };
}

async function resolveFromSession(capability?: Capability): Promise<Resolution> {
  const auth = await getRecruiterFromSession();
  if (!auth) return { ok: false, error: "Not signed in", status: 401 };

  const db = getDb();
  const [me] = await db
    .select({ clientKind: recruiters.clientKind, orgId: recruiters.orgId })
    .from(recruiters)
    .where(eq(recruiters.id, auth.recruiterId))
    .limit(1);

  if (!me || me.clientKind !== "agency" || me.orgId == null) {
    return {
      ok: false,
      error: "This action is only available to agency accounts.",
      status: 403,
    };
  }

  // The host, when it names a tenant, decides which workspace this request is for — and a
  // signed-in user reaching a workspace they do not belong to is refused rather than
  // silently served their own. On the apex domain (and in tests) no tenant is named and the
  // user's own org stands, which is what keeps single-domain access working.
  const tenant = await getTenant();
  if (tenant && tenant.id !== me.orgId) {
    return {
      ok: false,
      error: "You do not have access to this workspace.",
      status: 403,
    };
  }

  // Commercial state gates everything before role does. A suspended tenant or a lapsed
  // trial is not a permissions problem, and answering "your role does not allow this" when
  // the real answer is "the subscription ended" sends people to the wrong person.
  const org = tenant ?? (await getTenantById(me.orgId));
  if (!org) return { ok: false, error: "Workspace not found.", status: 403 };

  const blocked = tenantBlock(org);
  if (blocked) return { ok: false, error: blocked.message, status: 403 };

  // The membership — not the session — carries the org role. Scope the lookup to the org we
  // just resolved: a user could hold memberships in several orgs, and the role that matters
  // is the one for the tenant they are acting in.
  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(eq(memberships.userId, auth.session.userId), eq(memberships.orgId, me.orgId))
    )
    .limit(1);

  // No membership means no role, and no role means no permissions. Denying is the only safe
  // reading — inferring one from the recruiter row would hand out authority by accident.
  if (!membership) {
    return {
      ok: false,
      error: "You are not a member of this organisation.",
      status: 403,
    };
  }

  const role = membership.role as MemberRole;

  // Entitlement before permission, for the same reason: "not on your plan" and "not your
  // job" are different problems with different fixes. Deriving the feature from the
  // capability the route already declares means every existing route gained plan
  // enforcement without being edited.
  if (capability && !planAllows(org.plan, capability)) {
    return {
      ok: false,
      error: "This feature is not included in your current plan.",
      status: 403,
    };
  }

  if (capability && !can(role, capability)) {
    return { ok: false, error: "Your role does not allow this action.", status: 403 };
  }

  return {
    ok: true,
    actor: {
      orgId: me.orgId,
      recruiterId: auth.recruiterId,
      userId: auth.session.userId,
      role,
      plan: org.plan,
    },
  };
}

/** Client IP for the audit trail, best-effort. */
export function clientIp(req: Request): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}
