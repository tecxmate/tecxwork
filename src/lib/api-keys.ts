import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { apiKeys, memberships, orgs, recruiters } from "@/lib/db/schema";
import type { MemberRole } from "@/lib/ats-auth";
import { can, type Capability } from "@/lib/permissions";
import { hasFeature } from "@/lib/plans";

/**
 * Machine credentials.
 *
 * A key **borrows a person's authority**, narrowed by its own scopes. That choice is the
 * whole design: every ownership rule, every capability check and every audit row keeps
 * working unchanged, and "who did this" still names a human. A standalone robot identity
 * would have needed a second authorisation path beside the human one, and a second path is
 * the kind of door that outlives the reason it was cut.
 *
 * Three consequences follow, and all three are enforced below rather than documented and
 * hoped for:
 *
 *   - Scopes can never exceed what the owner holds **at request time**, not merely at
 *     creation time. Demote someone and their keys shrink with them; remove their
 *     membership and their keys stop working. Otherwise a key would be a way to keep
 *     authority you have formally lost.
 *   - The key is org-scoped, and the org is re-read on every request, so a suspended tenant
 *     or a lapsed trial refuses machine traffic exactly as it refuses a browser.
 *   - Only the SHA-256 of the token is stored. The raw value exists once, in the response
 *     that created it.
 */

const TOKEN_BYTES = 32;
const PREFIX_LENGTH = 8;

export type ApiKeyActor = {
  keyId: number;
  orgId: number;
  userId: number;
  recruiterId: number;
  role: MemberRole;
  plan: string;
  scopes: Capability[];
};

export type ApiKeySummary = {
  id: number;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
};

export type KeyResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: 400 | 403 | 404 };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** `tw_` so a leaked token is greppable in logs and recognisable in a support ticket. */
function mintToken(): { token: string; prefix: string } {
  const token = `tw_${randomBytes(TOKEN_BYTES).toString("base64url")}`;
  return { token, prefix: token.slice(0, PREFIX_LENGTH) };
}

/**
 * Create a key on behalf of a member.
 *
 * Refuses any scope the creator does not hold: a key is a delegation, and you cannot
 * delegate what you were never given. This is checked here *and* at request time, because
 * the two answer different questions — this one stops a mistake being stored, the other
 * stops a stored key outliving the authority behind it.
 */
export async function createApiKey(input: {
  orgId: number;
  ownerUserId: number;
  ownerRole: MemberRole;
  name: string;
  scopes: Capability[];
  expiresAt?: Date | null;
}): Promise<KeyResult<{ id: number; token: string; prefix: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "A key needs a name.", status: 400 };
  if (input.scopes.length === 0) {
    return { ok: false, error: "A key needs at least one scope.", status: 400 };
  }

  const overreach = input.scopes.filter((scope) => !can(input.ownerRole, scope));
  if (overreach.length > 0) {
    return {
      ok: false,
      error: `Your role does not allow: ${overreach.join(", ")}.`,
      status: 403,
    };
  }

  const db = getDb();
  const [org] = await db
    .select({ plan: orgs.plan, status: orgs.status })
    .from(orgs)
    .where(eq(orgs.id, input.orgId))
    .limit(1);
  if (!org) return { ok: false, error: "Workspace not found.", status: 404 };
  if (org.status !== "active") {
    return { ok: false, error: "This workspace is not active.", status: 403 };
  }
  // The monetisation hook: machine access is a plan feature, not a universal one.
  if (!hasFeature(org.plan, "api_access")) {
    return {
      ok: false,
      error: "API access is not included in your current plan.",
      status: 403,
    };
  }

  const { token, prefix } = mintToken();
  const [row] = await db
    .insert(apiKeys)
    .values({
      orgId: input.orgId,
      ownerUserId: input.ownerUserId,
      name,
      tokenHash: hashToken(token),
      prefix,
      scopes: input.scopes,
      expiresAt: input.expiresAt ?? null,
    })
    .returning({ id: apiKeys.id });

  return { ok: true, data: { id: row.id, token, prefix } };
}

export async function listApiKeys(orgId: number): Promise<ApiKeySummary[]> {
  return getDb()
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      scopes: apiKeys.scopes,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.orgId, orgId), isNull(apiKeys.revokedAt)))
    .orderBy(desc(apiKeys.createdAt));
}

export async function revokeApiKey(
  orgId: number,
  keyId: number
): Promise<KeyResult<{ id: number }>> {
  const [row] = await getDb()
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.orgId, orgId), isNull(apiKeys.revokedAt)))
    .returning({ id: apiKeys.id });

  if (!row) return { ok: false, error: "No such key.", status: 404 };
  return { ok: true, data: row };
}

/**
 * Turn a bearer token into an actor, or null.
 *
 * Null for every failure — unknown, revoked, expired, owner no longer a member, org not
 * active, plan without `api_access`. The caller answers 401 without saying which, because
 * distinguishing "no such key" from "revoked key" tells an attacker whether they guessed a
 * real one.
 */
export async function resolveApiKeyActor(token: string): Promise<ApiKeyActor | null> {
  if (!token.startsWith("tw_")) return null;

  const db = getDb();
  const [key] = await db
    .select({
      id: apiKeys.id,
      orgId: apiKeys.orgId,
      ownerUserId: apiKeys.ownerUserId,
      scopes: apiKeys.scopes,
      expiresAt: apiKeys.expiresAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.tokenHash, hashToken(token)))
    .limit(1);

  if (!key) return null;
  if (key.revokedAt) return null;
  if (key.expiresAt && key.expiresAt.getTime() <= Date.now()) return null;

  // The owner's CURRENT membership, not the one they had when the key was minted. A key
  // must not be a way to keep authority you have formally lost.
  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.orgId, key.orgId), eq(memberships.userId, key.ownerUserId)))
    .limit(1);
  if (!membership) return null;

  const [org] = await db
    .select({ plan: orgs.plan, status: orgs.status })
    .from(orgs)
    .where(eq(orgs.id, key.orgId))
    .limit(1);
  if (!org || org.status !== "active") return null;
  if (!hasFeature(org.plan, "api_access")) return null;

  // requireAgency authorises on the recruiter row as well, so a key whose owner has none
  // would authenticate and then fail every check. Refuse it here instead.
  const [rec] = await db
    .select({ id: recruiters.id, clientKind: recruiters.clientKind, orgId: recruiters.orgId })
    .from(recruiters)
    .where(eq(recruiters.userId, key.ownerUserId))
    .limit(1);
  if (!rec || rec.clientKind !== "agency" || rec.orgId !== key.orgId) return null;

  const role = membership.role as MemberRole;
  // Intersect at request time: the stored scopes are an upper bound, the owner's current
  // role is the other, and the key gets whichever is smaller.
  const scopes = (key.scopes as Capability[]).filter((scope) => can(role, scope));

  return {
    keyId: key.id,
    orgId: key.orgId,
    userId: key.ownerUserId,
    recruiterId: rec.id,
    role,
    plan: org.plan,
    scopes,
  };
}

/**
 * Record that a key was used. Fire-and-forget: a failed bookkeeping write must never fail
 * the request it was observing.
 */
export async function touchApiKey(keyId: number): Promise<void> {
  await getDb()
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyId))
    .catch(() => {});
}

/** The bearer token on a request, if any. */
export function bearerToken(req: { headers: Headers }): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  if (!value || scheme.toLowerCase() !== "bearer") return null;
  return value.trim() || null;
}
