import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { memberships, orgInvites, orgs, recruiters, users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth";
import {
  acceptInvite,
  createOrg,
  inviteMember,
  revokeInvite,
  seatsUsed,
  updateOrgPlan,
} from "@/lib/provisioning";
import { seedRecruiter, withSession } from "./helpers";
import { requireAgency } from "@/lib/agency-auth";

let seq = 0;

async function newOrg(overrides: Partial<Parameters<typeof createOrg>[0]> = {}) {
  const result = await createOrg({
    name: `Agency ${seq}`,
    slug: `agency-${seq++}-${Date.now()}`,
    ...overrides,
  });
  if (!result.ok) throw new Error(`seed failed: ${result.error}`);
  return result.data;
}

async function seedUser(email: string, role: "recruiter" | "applicant" = "recruiter") {
  const [user] = await db
    .insert(users)
    .values({
      email,
      name: "Invitee",
      passwordHash: await hashPassword("not-used-in-tests-12345"),
      role,
    })
    .returning();
  return user;
}

describe("provisioning — creating a tenant", () => {
  it("creates an org with the plan's default seats and a dated trial", async () => {
    const org = await newOrg();
    expect(org.plan).toBe("trial");
    expect(org.seatLimit).toBe(3);

    const [row] = await db.select().from(orgs).where(eq(orgs.id, org.id));
    expect(row.status).toBe("active");
    // Fixed at provisioning, not derived later — changing the trial length must not
    // silently extend every existing trial.
    expect(row.trialEndsAt).toBeInstanceOf(Date);
  });

  it("a contracted seat count overrides the plan's default", async () => {
    const org = await newOrg({ plan: "starter", seatLimit: 12 });
    expect(org.seatLimit).toBe(12);
  });

  it("gives the new org a pipeline, so its board is not empty on day one", async () => {
    const org = await newOrg();
    const { listStages } = await import("@/lib/pipeline-config");
    const stages = await listStages(org.id);
    expect(stages.length).toBeGreaterThan(0);
    expect(stages.map((s) => s.stageKind)).toContain("interview");
  });

  it("refuses a slug that could not be a subdomain", async () => {
    for (const slug of ["has space", "-lead", "trail-", "dot.ted", "under_score", ""]) {
      const result = await createOrg({ name: "X", slug });
      expect(result.ok, `expected "${slug}" to be refused`).toBe(false);
    }
  });

  it("normalises case rather than refusing it — a subdomain is case-insensitive", async () => {
    const result = await createOrg({ name: "X", slug: `MixedCase-${Date.now()}` });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.slug).toBe(result.data.slug.toLowerCase());
  });

  it("refuses a reserved slug, so no customer can claim admin.", async () => {
    const result = await createOrg({ name: "X", slug: "admin" });
    expect(result.ok).toBe(false);
  });

  it("refuses a duplicate slug rather than colliding on the subdomain", async () => {
    const slug = `dupe-${Date.now()}`;
    expect((await createOrg({ name: "First", slug })).ok).toBe(true);
    const second = await createOrg({ name: "Second", slug });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.status).toBe(409);
  });
});

describe("provisioning — seats", () => {
  it("counts pending invitations, not just members", async () => {
    // Otherwise a 3-seat org could send thirty invitations and every one would be honoured.
    const org = await newOrg();
    expect(await seatsUsed(org.id)).toBe(0);

    const invited = await inviteMember({
      orgId: org.id,
      email: "a@example.com",
      role: "recruiter",
      invitedByUserId: null,
    });
    expect(invited.ok).toBe(true);
    expect(await seatsUsed(org.id)).toBe(1);
  });

  it("refuses an invitation once the seats are gone", async () => {
    const org = await newOrg({ seatLimit: 1 });
    expect(
      (
        await inviteMember({
          orgId: org.id,
          email: "first@example.com",
          role: "recruiter",
          invitedByUserId: null,
        })
      ).ok
    ).toBe(true);

    const second = await inviteMember({
      orgId: org.id,
      email: "second@example.com",
      role: "recruiter",
      invitedByUserId: null,
    });
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.status).toBe(403);
      expect(second.error).toMatch(/no seats left/i);
    }
  });

  it("revoking an invitation releases its seat", async () => {
    const org = await newOrg({ seatLimit: 1 });
    const invited = await inviteMember({
      orgId: org.id,
      email: "a@example.com",
      role: "recruiter",
      invitedByUserId: null,
    });
    if (!invited.ok) throw new Error("seed failed");

    expect(await seatsUsed(org.id)).toBe(1);
    expect((await revokeInvite(org.id, invited.data.id)).ok).toBe(true);
    expect(await seatsUsed(org.id)).toBe(0);
  });

  it("an expired invitation releases its seat without a cleanup job", async () => {
    const org = await newOrg({ seatLimit: 1 });
    const invited = await inviteMember({
      orgId: org.id,
      email: "a@example.com",
      role: "recruiter",
      invitedByUserId: null,
    });
    if (!invited.ok) throw new Error("seed failed");

    await db
      .update(orgInvites)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(orgInvites.id, invited.data.id));

    expect(await seatsUsed(org.id)).toBe(0);
  });

  it("refuses to shrink the seat limit below the seats already filled", async () => {
    // The alternative is picking someone to evict, and no automatic choice is right.
    const org = await newOrg({ seatLimit: 3 });
    for (const email of ["a@example.com", "b@example.com"]) {
      await inviteMember({ orgId: org.id, email, role: "recruiter", invitedByUserId: null });
    }

    const shrunk = await updateOrgPlan(org.id, { seatLimit: 1 });
    expect(shrunk.ok).toBe(false);
    if (!shrunk.ok) expect(shrunk.status).toBe(409);

    expect((await updateOrgPlan(org.id, { seatLimit: 2 })).ok).toBe(true);
  });
});

describe("provisioning — accepting an invitation", () => {
  it("creates the membership and links the recruiter to the org", async () => {
    const org = await newOrg();
    const rec = await seedRecruiter({ email: `invitee-${seq++}@example.com` });

    const invited = await inviteMember({
      orgId: org.id,
      email: rec.email,
      role: "account_manager",
      invitedByUserId: null,
    });
    if (!invited.ok) throw new Error("seed failed");

    const accepted = await acceptInvite(invited.data.token, rec.userId);
    expect(accepted.ok).toBe(true);

    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, rec.userId));
    expect(membership.orgId).toBe(org.id);
    expect(membership.role).toBe("account_manager");

    // Without this the member passes the tenant check and fails the agency check —
    // authorised and unable to do anything.
    const [recruiterRow] = await db
      .select()
      .from(recruiters)
      .where(eq(recruiters.id, rec.recruiterId));
    expect(recruiterRow.orgId).toBe(org.id);
    expect(recruiterRow.clientKind).toBe("agency");
  });

  it("refuses a forwarded link — the session must match the invited address", async () => {
    const org = await newOrg();
    const invited = await inviteMember({
      orgId: org.id,
      email: "intended@example.com",
      role: "recruiter",
      invitedByUserId: null,
    });
    if (!invited.ok) throw new Error("seed failed");

    const stranger = await seedUser(`stranger-${seq++}@example.com`);
    const result = await acceptInvite(invited.data.token, stranger.id);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
    expect(await db.select().from(memberships)).toHaveLength(0);
  });

  it("refuses an unknown, revoked or expired token", async () => {
    const org = await newOrg();

    const unknown = await acceptInvite("not-a-real-token", 1);
    expect(unknown.ok).toBe(false);

    const revoked = await inviteMember({
      orgId: org.id,
      email: "r@example.com",
      role: "recruiter",
      invitedByUserId: null,
    });
    if (!revoked.ok) throw new Error("seed failed");
    const user = await seedUser("r@example.com");
    await revokeInvite(org.id, revoked.data.id);
    const afterRevoke = await acceptInvite(revoked.data.token, user.id);
    expect(afterRevoke.ok).toBe(false);

    const expiring = await inviteMember({
      orgId: org.id,
      email: "e@example.com",
      role: "recruiter",
      invitedByUserId: null,
    });
    if (!expiring.ok) throw new Error("seed failed");
    const user2 = await seedUser("e@example.com");
    await db
      .update(orgInvites)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(orgInvites.id, expiring.data.id));
    const afterExpiry = await acceptInvite(expiring.data.token, user2.id);
    expect(afterExpiry.ok).toBe(false);
  });

  it("a token can only be used once", async () => {
    const org = await newOrg();
    const rec = await seedRecruiter({ email: `once-${seq++}@example.com` });
    const invited = await inviteMember({
      orgId: org.id,
      email: rec.email,
      role: "recruiter",
      invitedByUserId: null,
    });
    if (!invited.ok) throw new Error("seed failed");

    expect((await acceptInvite(invited.data.token, rec.userId)).ok).toBe(true);
    const replay = await acceptInvite(invited.data.token, rec.userId);
    expect(replay.ok).toBe(false);
    if (!replay.ok) expect(replay.status).toBe(409);
  });

  it("refuses a candidate account — the two roles read opposite sides of the same data", async () => {
    const org = await newOrg();
    const applicant = await seedUser(`cand-${seq++}@example.com`, "applicant");
    const invited = await inviteMember({
      orgId: org.id,
      email: applicant.email,
      role: "recruiter",
      invitedByUserId: null,
    });
    if (!invited.ok) throw new Error("seed failed");

    const result = await acceptInvite(invited.data.token, applicant.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("refuses to re-parent a recruiter who already belongs to another workspace", async () => {
    const first = await newOrg();
    const second = await newOrg();
    const rec = await seedRecruiter({ email: `moved-${seq++}@example.com` });
    await db
      .update(recruiters)
      .set({ orgId: first.id, clientKind: "agency" })
      .where(eq(recruiters.id, rec.recruiterId));

    const invited = await inviteMember({
      orgId: second.id,
      email: rec.email,
      role: "recruiter",
      invitedByUserId: null,
    });
    if (!invited.ok) throw new Error("seed failed");

    const result = await acceptInvite(invited.data.token, rec.userId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });

  it("does not store the raw token", async () => {
    const org = await newOrg();
    const invited = await inviteMember({
      orgId: org.id,
      email: "h@example.com",
      role: "recruiter",
      invitedByUserId: null,
    });
    if (!invited.ok) throw new Error("seed failed");

    const [row] = await db
      .select()
      .from(orgInvites)
      .where(eq(orgInvites.id, invited.data.id));
    expect(row.tokenHash).not.toBe(invited.data.token);
    expect(row.tokenHash).toHaveLength(64); // sha256 hex
  });
});

describe("commercial state — enforced by the gate every request goes through", () => {
  async function signedInMemberOf(orgId: number) {
    const rec = await seedRecruiter({ email: `member-${seq++}@example.com` });
    await db
      .update(recruiters)
      .set({ orgId, clientKind: "agency" })
      .where(eq(recruiters.id, rec.recruiterId));
    await db.insert(memberships).values({ orgId, userId: rec.userId, role: "admin" });
    await withSession({ userId: rec.userId, email: rec.email, role: "recruiter" });
    return rec;
  }

  it("an active tenant passes", async () => {
    const org = await newOrg({ plan: "growth" });
    await signedInMemberOf(org.id);
    const gate = await requireAgency("invoice:read");
    expect(gate.ok).toBe(true);
  });

  it("a suspended tenant is refused, and told why", async () => {
    const org = await newOrg({ plan: "growth" });
    await signedInMemberOf(org.id);
    await updateOrgPlan(org.id, { status: "suspended" });

    const gate = await requireAgency("client:read");
    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(gate.response.status).toBe(403);
      // "suspended", not "your role does not allow this" — the two send people to
      // different places.
      expect((await gate.response.json()).error).toMatch(/suspended/i);
    }
  });

  it("a lapsed trial is refused without touching a single row of the tenant's data", async () => {
    const org = await newOrg({ plan: "trial" });
    await signedInMemberOf(org.id);
    await updateOrgPlan(org.id, { trialEndsAt: new Date(Date.now() - 1000) });

    const gate = await requireAgency("client:read");
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect((await gate.response.json()).error).toMatch(/trial/i);

    // Recovery is one column, never a restore.
    await updateOrgPlan(org.id, { plan: "growth" });
    expect((await requireAgency("client:read")).ok).toBe(true);
  });

  it("gates on the plan as well as the role, with no route change", async () => {
    // starter does not include billing; the invoice routes were never edited for this.
    const org = await newOrg({ plan: "starter" });
    await signedInMemberOf(org.id);

    const billing = await requireAgency("invoice:read");
    expect(billing.ok).toBe(false);
    if (!billing.ok) {
      expect((await billing.response.json()).error).toMatch(/plan/i);
    }

    // ...while everything the plan does include still works for the same admin.
    expect((await requireAgency("candidate:read")).ok).toBe(true);
  });

  it("upgrading the plan restores the feature immediately", async () => {
    const org = await newOrg({ plan: "starter" });
    await signedInMemberOf(org.id);
    expect((await requireAgency("invoice:read")).ok).toBe(false);

    await updateOrgPlan(org.id, { plan: "growth" });
    expect((await requireAgency("invoice:read")).ok).toBe(true);
  });
});
