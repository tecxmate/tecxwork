import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { apiKeys, memberships, recruiters } from "@/lib/db/schema";
import {
  createApiKey,
  listApiKeys,
  resolveApiKeyActor,
  revokeApiKey,
} from "@/lib/api-keys";
import type { MemberRole } from "@/lib/ats-auth";
import { createOrg, updateOrgPlan } from "@/lib/provisioning";
import { seedRecruiter } from "./helpers";

let seq = 0;

/** `scale` is the only plan carrying `api_access`, so keys need it. */
async function newOrg(plan: "scale" | "growth" = "scale") {
  const result = await createOrg({
    name: `Key Org ${seq}`,
    slug: `key-org-${seq++}-${Date.now()}`,
    plan,
  });
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

async function memberOf(orgId: number, role: MemberRole) {
  const rec = await seedRecruiter({ email: `key-${seq++}-${Date.now()}@example.com` });
  await db
    .update(recruiters)
    .set({ orgId, clientKind: "agency" })
    .where(eq(recruiters.id, rec.recruiterId));
  await db.insert(memberships).values({ orgId, userId: rec.userId, role });
  return rec;
}

async function mint(orgId: number, owner: { userId: number }, role: MemberRole, scopes: string[]) {
  const result = await createApiKey({
    orgId,
    ownerUserId: owner.userId,
    ownerRole: role,
    name: "Test key",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scopes: scopes as any,
  });
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

describe("api keys — minting", () => {
  it("returns the raw token once and stores only its hash", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id, "admin");
    const key = await mint(org.id, owner, "admin", ["candidate:read"]);

    expect(key.token.startsWith("tw_")).toBe(true);

    const [row] = await db.select().from(apiKeys).where(eq(apiKeys.id, key.id));
    expect(row.tokenHash).not.toBe(key.token);
    expect(row.tokenHash).toHaveLength(64); // sha256 hex
    // The prefix is kept in clear so a list can identify a key without the secret.
    expect(key.token.startsWith(row.prefix)).toBe(true);

    // And the summary a UI would render never carries the token.
    const listed = await listApiKeys(org.id);
    expect(JSON.stringify(listed)).not.toContain(key.token);
  });

  it("refuses a scope the creator does not hold — you cannot delegate what you lack", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id, "recruiter");

    const result = await createApiKey({
      orgId: org.id,
      ownerUserId: owner.userId,
      ownerRole: "recruiter",
      name: "Overreaching",
      scopes: ["invoice:write"],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("refuses when the plan does not include api_access", async () => {
    // The monetisation hook: machine access is bought, not assumed.
    const org = await newOrg("growth");
    const owner = await memberOf(org.id, "admin");

    const result = await createApiKey({
      orgId: org.id,
      ownerUserId: owner.userId,
      ownerRole: "admin",
      name: "Too early",
      scopes: ["candidate:read"],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/plan/i);
  });
});

describe("api keys — resolving a bearer token", () => {
  it("resolves to an actor carrying the owner's org, role and recruiter", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id, "admin");
    const key = await mint(org.id, owner, "admin", ["candidate:read", "client:read"]);

    const actor = await resolveApiKeyActor(key.token);
    expect(actor).not.toBeNull();
    expect(actor?.orgId).toBe(org.id);
    expect(actor?.userId).toBe(owner.userId);
    expect(actor?.role).toBe("admin");
    expect(actor?.scopes).toEqual(["candidate:read", "client:read"]);
  });

  it("refuses an unknown, malformed or revoked token", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id, "admin");
    const key = await mint(org.id, owner, "admin", ["candidate:read"]);

    expect(await resolveApiKeyActor("not-a-token")).toBeNull();
    expect(await resolveApiKeyActor("tw_wrong")).toBeNull();

    await revokeApiKey(org.id, key.id);
    // Immediate: the row is re-read on every request, not cached.
    expect(await resolveApiKeyActor(key.token)).toBeNull();
  });

  it("refuses an expired key", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id, "admin");
    const key = await mint(org.id, owner, "admin", ["candidate:read"]);

    await db
      .update(apiKeys)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(apiKeys.id, key.id));

    expect(await resolveApiKeyActor(key.token)).toBeNull();
  });

  it("shrinks with the owner: demoting them narrows the key at request time", async () => {
    // The scopes stored at creation are only an upper bound. A key must never be a way to
    // keep authority you have formally lost.
    const org = await newOrg();
    const owner = await memberOf(org.id, "admin");
    const key = await mint(org.id, owner, "admin", ["invoice:write", "candidate:read"]);

    expect((await resolveApiKeyActor(key.token))?.scopes).toContain("invoice:write");

    await db
      .update(memberships)
      .set({ role: "coordinator" })
      .where(eq(memberships.userId, owner.userId));

    const narrowed = await resolveApiKeyActor(key.token);
    // coordinator holds candidate:read but not invoice:write.
    expect(narrowed?.scopes).toEqual(["candidate:read"]);
  });

  it("dies with the owner's membership", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id, "admin");
    const key = await mint(org.id, owner, "admin", ["candidate:read"]);

    await db.delete(memberships).where(eq(memberships.userId, owner.userId));

    expect(await resolveApiKeyActor(key.token)).toBeNull();
  });

  it("stops working when the workspace is suspended", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id, "admin");
    const key = await mint(org.id, owner, "admin", ["candidate:read"]);

    await updateOrgPlan(org.id, { status: "suspended" });
    expect(await resolveApiKeyActor(key.token)).toBeNull();
  });

  it("stops working when the plan loses api_access", async () => {
    const org = await newOrg();
    const owner = await memberOf(org.id, "admin");
    const key = await mint(org.id, owner, "admin", ["candidate:read"]);

    await updateOrgPlan(org.id, { plan: "growth" });
    expect(await resolveApiKeyActor(key.token)).toBeNull();
  });
});

describe("api keys — tenancy", () => {
  it("revoking is scoped to the org, so another tenant's id reads as absent", async () => {
    const mine = await newOrg();
    const theirs = await newOrg();
    const owner = await memberOf(theirs.id, "admin");
    const key = await mint(theirs.id, owner, "admin", ["candidate:read"]);

    const result = await revokeApiKey(mine.id, key.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);

    // ...and it still works for its real owner.
    expect(await resolveApiKeyActor(key.token)).not.toBeNull();
  });

  it("listing shows only this org's keys", async () => {
    const mine = await newOrg();
    const theirs = await newOrg();
    const a = await memberOf(mine.id, "admin");
    const b = await memberOf(theirs.id, "admin");
    await mint(mine.id, a, "admin", ["candidate:read"]);
    await mint(theirs.id, b, "admin", ["candidate:read"]);

    expect(await listApiKeys(mine.id)).toHaveLength(1);
  });
});
