import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { memberships, oauthTokens, recruiters } from "@/lib/db/schema";
import {
  exchangeAuthCode,
  issueAuthCode,
  listGrants,
  registerClient,
  resolveOAuthActor,
} from "@/lib/oauth";
import type { MemberRole } from "@/lib/ats-auth";
import { createOrg } from "@/lib/provisioning";
import { GET, DELETE } from "@/app/api/org/connections/route";
import { jsonRequest, seedRecruiter, withSession } from "./helpers";

let seq = 0;
const REDIRECT = "http://127.0.0.1:33418/callback";

async function newOrg() {
  const result = await createOrg({
    name: `Conn Org ${seq}`,
    slug: `conn-org-${seq++}-${Date.now()}`,
    plan: "scale",
  });
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

async function memberOf(orgId: number, role: MemberRole = "admin") {
  const rec = await seedRecruiter({ email: `conn-${seq++}-${Date.now()}@example.com` });
  await db
    .update(recruiters)
    .set({ orgId, clientKind: "agency" })
    .where(eq(recruiters.id, rec.recruiterId));
  await db.insert(memberships).values({ orgId, userId: rec.userId, role });
  return rec;
}

/** Drive a real grant, the way a connector would, so the list reflects a real state. */
async function connect(
  orgId: number,
  userId: number,
  clientName = "Claude",
  scopes: string[] = ["client:read"]
) {
  const registered = await registerClient({ name: clientName, redirectUris: [REDIRECT] });
  if (!registered.ok) throw new Error(registered.error);

  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const code = await issueAuthCode({
    clientId: registered.data.clientId,
    orgId,
    userId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scopes: scopes as any,
    redirectUri: REDIRECT,
    codeChallenge: challenge,
  });
  if (!code.ok) throw new Error(code.error);

  const tokens = await exchangeAuthCode({
    code: code.data.code,
    clientId: registered.data.clientId,
    redirectUri: REDIRECT,
    codeVerifier: verifier,
  });
  if (!tokens.ok) throw new Error(tokens.description);

  return { clientId: registered.data.clientId, ...tokens.data };
}

describe("connections — listing grants", () => {
  it("folds the tokens of one grant into a single application", async () => {
    // A grant is not a row; it is implied by its live tokens, and a refresh mints more.
    // The screen has to show one application, not the token churn beneath it.
    const org = await newOrg();
    const owner = await memberOf(org.id);
    const conn = await connect(org.id, owner.userId);

    const rows = await db
      .select()
      .from(oauthTokens)
      .where(eq(oauthTokens.clientId, conn.clientId));
    expect(rows.length).toBe(2); // access + refresh

    const grants = await listGrants(org.id);
    expect(grants).toHaveLength(1);
    expect(grants[0].clientName).toBe("Claude");
    expect(grants[0].userId).toBe(owner.userId);
    expect(grants[0].scopes).toEqual(["client:read"]);
  });

  it("does not list another workspace's connections", async () => {
    const a = await newOrg();
    const b = await newOrg();
    const ownerA = await memberOf(a.id);
    await connect(a.id, ownerA.userId);

    expect(await listGrants(b.id)).toHaveLength(0);
  });

  it("drops a grant once every token under it is revoked or expired", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id);
    const conn = await connect(org.id, owner.userId);
    expect(await listGrants(org.id)).toHaveLength(1);

    await db
      .update(oauthTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(oauthTokens.clientId, conn.clientId));

    expect(await listGrants(org.id)).toHaveLength(0);
  });
});

describe("connections — the route", () => {
  it("lets an administrator see and disconnect a colleague's application", async () => {
    const org = await newOrg();
    const admin = await memberOf(org.id, "admin");
    const colleague = await memberOf(org.id, "recruiter");
    const conn = await connect(org.id, colleague.userId);

    await withSession({ userId: admin.userId, email: admin.email, role: "recruiter" });

    const listed = await (await GET()).json();
    expect(listed.connections).toHaveLength(1);
    expect(listed.connections[0].userId).toBe(colleague.userId);
    expect(listed.connections[0].revocable).toBe(true);

    const res = await DELETE(
      jsonRequest("http://localhost/api/org/connections", {
        method: "DELETE",
        body: { clientId: conn.clientId, userId: colleague.userId },
      })
    );
    expect(res.status).toBe(200);

    // Immediate, not at the end of some cache window.
    expect(await resolveOAuthActor(conn.accessToken)).toBeNull();
    expect(await listGrants(org.id)).toHaveLength(0);
  });

  it("lets a non-admin disconnect their own, which is what the consent screen promised", async () => {
    // The consent copy says "you can revoke this at any time from your workspace settings".
    // A recruiter can grant, so a recruiter must be able to withdraw without an admin.
    const org = await newOrg();
    const member = await memberOf(org.id, "recruiter");
    const conn = await connect(org.id, member.userId);

    await withSession({ userId: member.userId, email: member.email, role: "recruiter" });

    const res = await DELETE(
      jsonRequest("http://localhost/api/org/connections", {
        method: "DELETE",
        body: { clientId: conn.clientId }, // omitted userId means "mine"
      })
    );
    expect(res.status).toBe(200);
    expect(await resolveOAuthActor(conn.accessToken)).toBeNull();
  });

  it("shows a non-admin only their own, and refuses to revoke someone else's", async () => {
    const org = await newOrg();
    const member = await memberOf(org.id, "recruiter");
    const colleague = await memberOf(org.id, "recruiter");
    await connect(org.id, member.userId, "Mine");
    const theirs = await connect(org.id, colleague.userId, "Theirs");

    await withSession({ userId: member.userId, email: member.email, role: "recruiter" });

    const listed = await (await GET()).json();
    expect(listed.connections).toHaveLength(1);
    expect(listed.connections[0].clientName).toBe("Mine");

    const res = await DELETE(
      jsonRequest("http://localhost/api/org/connections", {
        method: "DELETE",
        body: { clientId: theirs.clientId, userId: colleague.userId },
      })
    );
    expect(res.status).toBe(403);
    // And it really is still live — the refusal is not cosmetic.
    expect(await resolveOAuthActor(theirs.accessToken)).not.toBeNull();
  });

  it("cannot be used to revoke across tenants", async () => {
    const a = await newOrg();
    const b = await newOrg();
    const adminA = await memberOf(a.id, "admin");
    const ownerB = await memberOf(b.id, "admin");
    const connB = await connect(b.id, ownerB.userId);

    await withSession({ userId: adminA.userId, email: adminA.email, role: "recruiter" });

    // Same success shape, so the response cannot confirm that grant exists elsewhere.
    const res = await DELETE(
      jsonRequest("http://localhost/api/org/connections", {
        method: "DELETE",
        body: { clientId: connB.clientId, userId: ownerB.userId },
      })
    );
    expect(res.status).toBe(200);
    expect(await resolveOAuthActor(connB.accessToken)).not.toBeNull();
  });

  it("refuses a caller with no session", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
