import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  memberships,
  oauthAuthCodes,
  oauthClients,
  oauthTokens,
  orgs,
  recruiters,
} from "@/lib/db/schema";
import type { MemberRole } from "@/lib/ats-auth";
import { can, type Capability } from "@/lib/permissions";
import { hasFeature } from "@/lib/plans";

/**
 * OAuth 2.1 for MCP clients.
 *
 * This exists so connecting is a button rather than a pasted secret — which is what Apollo
 * and Buffer ship, and the difference between a connector a customer can adopt and one
 * their administrator has to be talked through.
 *
 * The shape mirrors `lib/api-keys.ts` deliberately: org-scoped, hashed at rest, scoped to
 * the same `Capability` strings, and **bound to the user who granted consent**. An OAuth
 * caller and a key caller therefore resolve to the same actor and travel the same
 * authorisation path. Two credential types, one authorisation story.
 *
 * OAuth 2.1 rather than 2.0: PKCE is required for every client, the implicit and password
 * grants do not exist, and redirect URIs are matched exactly rather than by prefix.
 */

const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const AUTH_CODE_TTL_MS = 60 * 1000; // 1 minute — long enough to redirect, not to sit in a log

export type OAuthActor = {
  tokenId: number;
  orgId: number;
  userId: number;
  recruiterId: number;
  role: MemberRole;
  plan: string;
  scopes: Capability[];
  clientId: string;
};

export type OAuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; description: string };

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function secret(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Constant-time compare, so a wrong secret cannot be found a character at a time. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/* ------------------------------------------------------- client registration -- */

export type RegisterClientInput = {
  name: string;
  redirectUris: string[];
  /** Public clients (the common MCP case) hold no secret and rely on PKCE. */
  wantsSecret?: boolean;
};

/**
 * Dynamic client registration (RFC 7591).
 *
 * Open by design — an MCP client registers itself before any human is involved, so this
 * endpoint cannot authenticate anyone. It hands out an identity, never an authorisation:
 * a fresh client can do nothing at all until a signed-in member approves a scope at the
 * consent screen. Redirect URIs are validated here because they are the one field that
 * decides where tokens are delivered.
 */
export async function registerClient(
  input: RegisterClientInput
): Promise<OAuthResult<{ clientId: string; clientSecret: string | null }>> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "invalid_client_metadata", description: "A name is required." };
  }
  if (!input.redirectUris.length) {
    return {
      ok: false,
      error: "invalid_redirect_uri",
      description: "At least one redirect URI is required.",
    };
  }

  for (const uri of input.redirectUris) {
    if (!isAcceptableRedirect(uri)) {
      return {
        ok: false,
        error: "invalid_redirect_uri",
        description: `Not an acceptable redirect URI: ${uri}`,
      };
    }
  }

  const clientId = `mcp_${secret(16)}`;
  const clientSecret = input.wantsSecret ? secret(32) : null;

  await getDb()
    .insert(oauthClients)
    .values({
      clientId,
      clientSecretHash: clientSecret ? hash(clientSecret) : null,
      name,
      redirectUris: input.redirectUris,
    });

  return { ok: true, data: { clientId, clientSecret } };
}

/**
 * Which redirect targets are allowed.
 *
 * HTTPS anywhere, plus loopback HTTP — the localhost exception exists because a desktop MCP
 * client redirects to a port on the user's own machine, and there is no https there to
 * have. `http://` to any other host is refused: that is a token travelling in clear over
 * someone else's network.
 */
export function isAcceptableRedirect(uri: string): boolean {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (url.hash) return false; // a fragment would be silently dropped on redirect
  if (url.protocol === "https:") return true;
  if (url.protocol === "http:") {
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
  }
  return false;
}

export async function getClient(clientId: string) {
  const [row] = await getDb()
    .select({
      clientId: oauthClients.clientId,
      clientSecretHash: oauthClients.clientSecretHash,
      name: oauthClients.name,
      redirectUris: oauthClients.redirectUris,
    })
    .from(oauthClients)
    .where(eq(oauthClients.clientId, clientId))
    .limit(1);
  return row ?? null;
}

/* -------------------------------------------------------------- authorization -- */

export type IssueCodeInput = {
  clientId: string;
  orgId: number;
  userId: number;
  /** Already narrowed to what the consenting member actually holds. */
  scopes: Capability[];
  redirectUri: string;
  codeChallenge: string;
};

/**
 * Mint an authorization code after a human has approved the scopes.
 *
 * The caller is responsible for having checked the member's role — this function trusts the
 * scopes it is given, because the consent screen is where a person decided, and re-deriving
 * that here would let the two disagree.
 */
export async function issueAuthCode(
  input: IssueCodeInput
): Promise<OAuthResult<{ code: string }>> {
  const client = await getClient(input.clientId);
  if (!client) {
    return { ok: false, error: "invalid_client", description: "Unknown client." };
  }
  // Exact match: a prefix rule is how an open redirect gets shipped.
  if (!client.redirectUris.includes(input.redirectUri)) {
    return {
      ok: false,
      error: "invalid_redirect_uri",
      description: "That redirect URI is not registered for this client.",
    };
  }
  if (!input.codeChallenge) {
    return {
      ok: false,
      error: "invalid_request",
      description: "PKCE is required: send code_challenge with S256.",
    };
  }

  const code = secret(32);
  await getDb()
    .insert(oauthAuthCodes)
    .values({
      codeHash: hash(code),
      clientId: input.clientId,
      orgId: input.orgId,
      userId: input.userId,
      scopes: input.scopes,
      redirectUri: input.redirectUri,
      codeChallenge: input.codeChallenge,
      expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MS),
    });

  return { ok: true, data: { code } };
}

/* -------------------------------------------------------------------- tokens -- */

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scopes: Capability[];
};

/**
 * Exchange an authorization code for tokens.
 *
 * Three checks decide whether this is safe, and all three are the point of the code flow:
 * the code must be unused (a second exchange is a replay, and is recorded rather than
 * silently ignored), the redirect URI must match the one the code was issued for, and the
 * PKCE verifier must hash to the stored challenge — which is what stops an intercepted code
 * being useful to whoever intercepted it.
 */
export async function exchangeAuthCode(input: {
  code: string;
  clientId: string;
  clientSecret?: string | null;
  redirectUri: string;
  codeVerifier: string;
}): Promise<OAuthResult<TokenPair>> {
  const db = getDb();
  const client = await getClient(input.clientId);
  if (!client) {
    return { ok: false, error: "invalid_client", description: "Unknown client." };
  }
  if (client.clientSecretHash) {
    if (!input.clientSecret || !safeEqual(hash(input.clientSecret), client.clientSecretHash)) {
      return { ok: false, error: "invalid_client", description: "Client authentication failed." };
    }
  }

  const [row] = await db
    .select()
    .from(oauthAuthCodes)
    .where(eq(oauthAuthCodes.codeHash, hash(input.code)))
    .limit(1);

  if (!row) {
    return { ok: false, error: "invalid_grant", description: "Unknown authorization code." };
  }
  if (row.consumedAt) {
    // A replay. Revoke everything this grant produced: the safe reading of a reused code is
    // that someone else has it.
    await revokeGrant(row.orgId, row.userId, row.clientId);
    return {
      ok: false,
      error: "invalid_grant",
      description: "This code has already been used. All tokens for it have been revoked.",
    };
  }
  if (row.expiresAt.getTime() <= Date.now()) {
    return { ok: false, error: "invalid_grant", description: "Authorization code expired." };
  }
  if (row.clientId !== input.clientId) {
    return { ok: false, error: "invalid_grant", description: "Code was issued to another client." };
  }
  if (row.redirectUri !== input.redirectUri) {
    return { ok: false, error: "invalid_grant", description: "redirect_uri does not match." };
  }

  // PKCE S256: base64url(sha256(verifier)) must equal the stored challenge.
  const derived = createHash("sha256").update(input.codeVerifier).digest("base64url");
  if (!input.codeVerifier || !safeEqual(derived, row.codeChallenge)) {
    return { ok: false, error: "invalid_grant", description: "PKCE verification failed." };
  }

  await db
    .update(oauthAuthCodes)
    .set({ consumedAt: new Date() })
    .where(eq(oauthAuthCodes.id, row.id));

  return {
    ok: true,
    data: await mintTokens({
      clientId: row.clientId,
      orgId: row.orgId,
      userId: row.userId,
      scopes: row.scopes as Capability[],
    }),
  };
}

/** Rotate a refresh token. The old one is revoked, so a stolen copy is single-use at best. */
export async function refreshTokens(input: {
  refreshToken: string;
  clientId: string;
}): Promise<OAuthResult<TokenPair>> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(oauthTokens)
    .where(eq(oauthTokens.tokenHash, hash(input.refreshToken)))
    .limit(1);

  if (!row || row.kind !== "refresh") {
    return { ok: false, error: "invalid_grant", description: "Unknown refresh token." };
  }
  if (row.revokedAt) {
    // Same reasoning as a replayed code: a revoked refresh token in use means someone kept
    // a copy. Kill the whole grant rather than just this token.
    await revokeGrant(row.orgId, row.userId, row.clientId);
    return { ok: false, error: "invalid_grant", description: "This token has been revoked." };
  }
  if (row.expiresAt.getTime() <= Date.now()) {
    return { ok: false, error: "invalid_grant", description: "Refresh token expired." };
  }
  if (row.clientId !== input.clientId) {
    return { ok: false, error: "invalid_grant", description: "Token was issued to another client." };
  }

  await db
    .update(oauthTokens)
    .set({ revokedAt: new Date() })
    .where(eq(oauthTokens.id, row.id));

  return {
    ok: true,
    data: await mintTokens({
      clientId: row.clientId,
      orgId: row.orgId,
      userId: row.userId,
      scopes: row.scopes as Capability[],
    }),
  };
}

async function mintTokens(input: {
  clientId: string;
  orgId: number;
  userId: number;
  scopes: Capability[];
}): Promise<TokenPair> {
  const accessToken = `two_${secret(32)}`;
  const refreshToken = `twr_${secret(32)}`;
  const now = Date.now();

  await getDb()
    .insert(oauthTokens)
    .values([
      {
        tokenHash: hash(accessToken),
        kind: "access",
        clientId: input.clientId,
        orgId: input.orgId,
        userId: input.userId,
        scopes: input.scopes,
        expiresAt: new Date(now + ACCESS_TOKEN_TTL_MS),
      },
      {
        tokenHash: hash(refreshToken),
        kind: "refresh",
        clientId: input.clientId,
        orgId: input.orgId,
        userId: input.userId,
        scopes: input.scopes,
        expiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
      },
    ]);

  return {
    accessToken,
    refreshToken,
    expiresIn: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
    scopes: input.scopes,
  };
}

/** Revoke every live token for one (org, user, client) grant. */
export async function revokeGrant(
  orgId: number,
  userId: number,
  clientId: string
): Promise<void> {
  await getDb()
    .update(oauthTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(oauthTokens.orgId, orgId),
        eq(oauthTokens.userId, userId),
        eq(oauthTokens.clientId, clientId),
        isNull(oauthTokens.revokedAt)
      )
    );
}

/* ------------------------------------------------------------------ resolving -- */

/**
 * Turn an access token into an actor, or null.
 *
 * Every rule `resolveApiKeyActor` applies applies here too, for the same reasons: the
 * owner's CURRENT membership decides the ceiling, the org must still be active and on a
 * plan with `api_access`, and the recruiter row must exist. A grant is not a way to keep
 * authority the granting user has since lost.
 */
export async function resolveOAuthActor(token: string): Promise<OAuthActor | null> {
  if (!token.startsWith("two_")) return null;

  const db = getDb();
  const [row] = await db
    .select()
    .from(oauthTokens)
    .where(eq(oauthTokens.tokenHash, hash(token)))
    .limit(1);

  if (!row || row.kind !== "access") return null;
  if (row.revokedAt) return null;
  if (row.expiresAt.getTime() <= Date.now()) return null;

  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.orgId, row.orgId), eq(memberships.userId, row.userId)))
    .limit(1);
  if (!membership) return null;

  const [org] = await db
    .select({ plan: orgs.plan, status: orgs.status })
    .from(orgs)
    .where(eq(orgs.id, row.orgId))
    .limit(1);
  if (!org || org.status !== "active") return null;
  if (!hasFeature(org.plan, "api_access")) return null;

  const [rec] = await db
    .select({ id: recruiters.id, clientKind: recruiters.clientKind, orgId: recruiters.orgId })
    .from(recruiters)
    .where(eq(recruiters.userId, row.userId))
    .limit(1);
  if (!rec || rec.clientKind !== "agency" || rec.orgId !== row.orgId) return null;

  const role = membership.role as MemberRole;
  const scopes = (row.scopes as Capability[]).filter((scope) => can(role, scope));

  return {
    tokenId: row.id,
    orgId: row.orgId,
    userId: row.userId,
    recruiterId: rec.id,
    role,
    plan: org.plan,
    scopes,
    clientId: row.clientId,
  };
}
