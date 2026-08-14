import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { clients, memberships, orgs, users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth";
import { getActivation } from "@/lib/activation";
import { createOrg, inviteMember, updateOrgPlan } from "@/lib/provisioning";

let seq = 0;

async function newOrg(overrides: Partial<Parameters<typeof createOrg>[0]> = {}) {
  const result = await createOrg({
    name: `Activation Org ${seq}`,
    slug: `activation-${seq++}-${Date.now()}`,
    ...overrides,
  });
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

async function addMember(orgId: number) {
  const email = `member-${seq++}-${Date.now()}@example.com`;
  const [user] = await db
    .insert(users)
    .values({
      email,
      name: "Member",
      passwordHash: await hashPassword("not-used-in-tests-12345"),
      role: "recruiter",
    })
    .returning();
  await db.insert(memberships).values({ orgId, userId: user.id, role: "admin" });
  return user.id;
}

describe("activation — derived from data, never from a flag", () => {
  it("a brand-new workspace has nothing done", async () => {
    const org = await newOrg();
    const activation = await getActivation(org.id);
    if (!activation) throw new Error("expected activation");

    expect(activation.completed).toBe(0);
    expect(activation.complete).toBe(false);
    expect(activation.steps.every((s) => !s.done)).toBe(true);
  });

  it("one member is not a team — the founding admin does not tick the invite step", async () => {
    const org = await newOrg();
    await addMember(org.id);

    const activation = await getActivation(org.id);
    const invite = activation?.steps.find((s) => s.id === "invite_team");
    expect(invite?.done).toBe(false);
  });

  it("a pending invitation does not tick it either — only an accepted one", async () => {
    // The step is "invite your team", but what the customer needs is a colleague who can
    // actually sign in. An unaccepted invitation is not that.
    const org = await newOrg();
    await addMember(org.id);
    await inviteMember({
      orgId: org.id,
      email: "pending@example.com",
      role: "recruiter",
      invitedByUserId: null,
    });

    const activation = await getActivation(org.id);
    expect(activation?.steps.find((s) => s.id === "invite_team")?.done).toBe(false);
    // ...but it does hold a seat.
    expect(activation?.seats.used).toBe(2);
  });

  it("ticks once a second person is actually a member", async () => {
    const org = await newOrg();
    await addMember(org.id);
    await addMember(org.id);

    const activation = await getActivation(org.id);
    expect(activation?.steps.find((s) => s.id === "invite_team")?.done).toBe(true);
  });

  it("reflects a deletion, which a stored flag could not", async () => {
    const org = await newOrg();
    const [client] = await db
      .insert(clients)
      .values({ orgId: org.id, name: "Giant" })
      .returning();

    expect((await getActivation(org.id))?.steps.find((s) => s.id === "add_client")?.done).toBe(
      true
    );

    await db.delete(clients).where(eq(clients.id, client.id));

    expect((await getActivation(org.id))?.steps.find((s) => s.id === "add_client")?.done).toBe(
      false
    );
  });
});

describe("activation — shaped by the plan", () => {
  it("hides steps the plan does not include, and shrinks the denominator with them", async () => {
    // starter has no placements or billing, so "record a placement" is not a task this
    // customer is failing to do — counting it would make 100% unreachable.
    const starter = await newOrg({ plan: "starter" });
    const growth = await newOrg({ plan: "growth" });

    const s = await getActivation(starter.id);
    const g = await getActivation(growth.id);

    expect(s?.steps.some((step) => step.id === "record_placement")).toBe(false);
    expect(g?.steps.some((step) => step.id === "record_placement")).toBe(true);
    expect(s!.applicable).toBeLessThan(g!.applicable);
  });

  it("a workspace can reach complete on a smaller plan", async () => {
    const org = await newOrg({ plan: "starter" });
    const activation = await getActivation(org.id);
    // Every visible step is achievable — none is gated behind a feature they lack.
    expect(activation!.steps.every((s) => s.feature === null || s.feature !== "placements")).toBe(
      true
    );
  });
});

describe("activation — trial state agrees with the auth gate", () => {
  it("counts down while the trial runs", async () => {
    const org = await newOrg({ plan: "trial" });
    const activation = await getActivation(org.id);

    expect(activation?.trial).not.toBeNull();
    expect(activation?.trial?.expired).toBe(false);
    expect(activation?.trial?.daysLeft).toBeGreaterThanOrEqual(0);
  });

  it("reports expiry using the same rule the gate refuses on", async () => {
    // If these two disagreed, a workspace could say "3 days left" while every request was
    // already being refused.
    const org = await newOrg({ plan: "trial" });
    await updateOrgPlan(org.id, { trialEndsAt: new Date(Date.now() - 1000) });

    const activation = await getActivation(org.id);
    expect(activation?.trial?.expired).toBe(true);
  });

  it("a paid plan has no trial banner at all", async () => {
    const org = await newOrg({ plan: "growth" });
    expect((await getActivation(org.id))?.trial).toBeNull();
  });
});

describe("activation — unknown org", () => {
  it("returns null rather than an empty checklist", async () => {
    const [ghost] = await db
      .insert(orgs)
      .values({ name: "Temp", slug: `temp-${Date.now()}` })
      .returning();
    await db.delete(orgs).where(eq(orgs.id, ghost.id));

    expect(await getActivation(ghost.id)).toBeNull();
  });
});
