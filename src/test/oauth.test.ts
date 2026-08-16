import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { memberships, oauthTokens, recruiters } from "@/lib/db/schema";
import {
  exchangeAuthCode,
  isAcceptableRedirect,
  issueAuthCode,
  refreshTokens,
  registerClient,
  resolveOAuthActor,
  revokeGrant,
} from "@/lib/oauth";
import { createOrg, updateOrgPlan } from "@/lib/provisioning";
import { seedRecruiter } from "./helpers";

let seq = 0;
const REDIRECT = "http://127.0.0.1:33418/callback";

async function newOrg() {
  const result = await createOrg({
    name: `OAuth Org ${seq}`,
    slug: `oauth-org-${seq++}-${Date.now()}`,
    plan: "scale",
  });
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

async function memberOf(orgId: number, role: "admin" | "viewer" = "admin") {
  const rec = await seedRecruiter({ email: `oauth-${seq++}-${Date.now()}@example.com` });
  await db
    .update(recruiters)
    .set({ orgId, clientKind: "agency" })
    .where(eq(recruiters.id, rec.recruiterId));
  await db.insert(memberships).values({ orgId, userId: rec.userId, role });
  return rec;
}

async function newClient() {
  const result = await registerClient({ name: "Claude", redirectUris: [REDIRECT] });
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

/** A PKCE pair, the way a real client generates one. */
function pkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

async function grantedTokens(orgId: number, userId: number, clientId: string) {
  const { verifier, challenge } = pkce();
  const code = await issueAuthCode({
    clientId,
    orgId,
    userId,
    scopes: ["client:read"],
    redirectUri: REDIRECT,
    codeChallenge: challenge,
  });
  if (!code.ok) throw new Error(code.error);

  const tokens = await exchangeAuthCode({
    code: code.data.code,
    clientId,
    redirectUri: REDIRECT,
    codeVerifier: verifier,
  });
  if (!tokens.ok) throw new Error(tokens.description);
  return tokens.data;
}

describe("oauth — redirect URIs", () => {
  it("allows https anywhere and http only on loopback", () => {
    // The loopback exception exists because a desktop client redirects to a port on the
    // user's own machine, where there is no https to have.
    expect(isAcceptableRedirect("https://claude.ai/callback")).toBe(true);
    expect(isAcceptableRedirect("http://127.0.0.1:1234/cb")).toBe(true);
    expect(isAcceptableRedirect("http://localhost:1234/cb")).toBe(true);

    // A token in clear over someone else's network.
    expect(isAcceptableRedirect("http://evil.example/cb")).toBe(false);
    expect(isAcceptableRedirect("javascript:alert(1)")).toBe(false);
    expect(isAcceptableRedirect("not a url")).toBe(false);
    // A fragment is dropped on redirect, so a client expecting one is misconfigured.
    expect(isAcceptableRedirect("https://ok.example/cb#frag")).toBe(false);
  });

  it("refuses registration with an unacceptable redirect", async () => {
    const result = await registerClient({
      name: "Sketchy",
      redirectUris: ["http://evil.example/cb"],
    });
    expect(result.ok).toBe(false);
  });
});

describe("oauth — the code flow", () => {
  it("issues a code and exchanges it for tokens", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id);
    const client = await newClient();

    const tokens = await grantedTokens(org.id, owner.userId, client.clientId);
    expect(tokens.accessToken.startsWith("two_")).toBe(true);
    expect(tokens.refreshToken.startsWith("twr_")).toBe(true);
    expect(tokens.scopes).toEqual(["client:read"]);
  });

  it("refuses an exchange whose PKCE verifier does not match", async () => {
    // The whole point of PKCE: an intercepted code is useless without the verifier, which
    // never left the client that generated it.
    const org = await newOrg();
    const owner = await memberOf(org.id);
    const client = await newClient();
    const { challenge } = pkce();

    const code = await issueAuthCode({
      clientId: client.clientId,
      orgId: org.id,
      userId: owner.userId,
      scopes: ["client:read"],
      redirectUri: REDIRECT,
      codeChallenge: challenge,
    });
    if (!code.ok) throw new Error("seed failed");

    const stolen = await exchangeAuthCode({
      code: code.data.code,
      clientId: client.clientId,
      redirectUri: REDIRECT,
      codeVerifier: randomBytes(32).toString("base64url"), // attacker's own
    });

    expect(stolen.ok).toBe(false);
    if (!stolen.ok) expect(stolen.error).toBe("invalid_grant");
  });

  it("refuses a redirect_uri that differs from the one the code was issued for", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id);
    const client = await newClient();
    const { verifier, challenge } = pkce();

    const code = await issueAuthCode({
      clientId: client.clientId,
      orgId: org.id,
      userId: owner.userId,
      scopes: ["client:read"],
      redirectUri: REDIRECT,
      codeChallenge: challenge,
    });
    if (!code.ok) throw new Error("seed failed");

    const result = await exchangeAuthCode({
      code: code.data.code,
      clientId: client.clientId,
      redirectUri: "http://127.0.0.1:9999/other",
      codeVerifier: verifier,
    });
    expect(result.ok).toBe(false);
  });

  it("treats a replayed code as a compromise and revokes the whole grant", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id);
    const client = await newClient();
    const { verifier, challenge } = pkce();

    const code = await issueAuthCode({
      clientId: client.clientId,
      orgId: org.id,
      userId: owner.userId,
      scopes: ["client:read"],
      redirectUri: REDIRECT,
      codeChallenge: challenge,
    });
    if (!code.ok) throw new Error("seed failed");

    const first = await exchangeAuthCode({
      code: code.data.code,
      clientId: client.clientId,
      redirectUri: REDIRECT,
      codeVerifier: verifier,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const replay = await exchangeAuthCode({
      code: code.data.code,
      clientId: client.clientId,
      redirectUri: REDIRECT,
      codeVerifier: verifier,
    });
    expect(replay.ok).toBe(false);

    // The safe reading of a reused code is that someone else has it, so the tokens it
    // already produced stop working too.
    expect(await resolveOAuthActor(first.data.accessToken)).toBeNull();
  });

  it("refuses a code issued to a different client", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id);
    const a = await newClient();
    const b = await newClient();
    const { verifier, challenge } = pkce();

    const code = await issueAuthCode({
      clientId: a.clientId,
      orgId: org.id,
      userId: owner.userId,
      scopes: ["client:read"],
      redirectUri: REDIRECT,
      codeChallenge: challenge,
    });
    if (!code.ok) throw new Error("seed failed");

    const result = await exchangeAuthCode({
      code: code.data.code,
      clientId: b.clientId,
      redirectUri: REDIRECT,
      codeVerifier: verifier,
    });
    expect(result.ok).toBe(false);
  });
});

describe("oauth — refresh", () => {
  it("rotates: the old refresh token stops working", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id);
    const client = await newClient();
    const first = await grantedTokens(org.id, owner.userId, client.clientId);

    const second = await refreshTokens({
      refreshToken: first.refreshToken,
      clientId: client.clientId,
    });
    expect(second.ok).toBe(true);

    const reuse = await refreshTokens({
      refreshToken: first.refreshToken,
      clientId: client.clientId,
    });
    expect(reuse.ok).toBe(false);
  });
});

describe("oauth — resolving an access token", () => {
  it("resolves to an actor bound to the granting user's org and role", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id);
    const client = await newClient();
    const tokens = await grantedTokens(org.id, owner.userId, client.clientId);

    const actor = await resolveOAuthActor(tokens.accessToken);
    expect(actor?.orgId).toBe(org.id);
    expect(actor?.userId).toBe(owner.userId);
    expect(actor?.scopes).toEqual(["client:read"]);
  });

  it("narrows with the granting user's role, like an API key does", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id, "admin");
    const client = await newClient();
    const tokens = await grantedTokens(org.id, owner.userId, client.clientId);

    // interviewer holds nothing at all.
    await db
      .update(memberships)
      .set({ role: "interviewer" })
      .where(eq(memberships.userId, owner.userId));

    expect((await resolveOAuthActor(tokens.accessToken))?.scopes).toEqual([]);
  });

  it("stops at revocation, expiry, suspension and plan loss", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id);
    const client = await newClient();

    const revoked = await grantedTokens(org.id, owner.userId, client.clientId);
    await revokeGrant(org.id, owner.userId, client.clientId);
    expect(await resolveOAuthActor(revoked.accessToken)).toBeNull();

    const expired = await grantedTokens(org.id, owner.userId, client.clientId);
    await db
      .update(oauthTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(
        eq(
          oauthTokens.tokenHash,
          createHash("sha256").update(expired.accessToken).digest("hex")
        )
      );
    expect(await resolveOAuthActor(expired.accessToken)).toBeNull();

    const suspended = await grantedTokens(org.id, owner.userId, client.clientId);
    await updateOrgPlan(org.id, { status: "suspended" });
    expect(await resolveOAuthActor(suspended.accessToken)).toBeNull();

    await updateOrgPlan(org.id, { status: "active", plan: "growth" });
    expect(await resolveOAuthActor(suspended.accessToken)).toBeNull(); // no api_access
  });

  it("refuses a refresh token presented as an access token", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id);
    const client = await newClient();
    const tokens = await grantedTokens(org.id, owner.userId, client.clientId);

    expect(await resolveOAuthActor(tokens.refreshToken)).toBeNull();
  });
});
