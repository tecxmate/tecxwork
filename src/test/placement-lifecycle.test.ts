import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  applicantProfiles,
  clients,
  complianceDocuments,
  jobOrders,
  memberships,
  orgs,
  placements,
  recruiters,
} from "@/lib/db/schema";
import { getPlacementLifecycle } from "@/lib/placement-lifecycle";
import { jsonRequest, seedRecruiter, withSession } from "./helpers";
import { PATCH as updatePlacement } from "@/app/api/agency/placements/[id]/route";

let seq = 0;

const iso = (daysFromToday: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
};

async function seedAgency() {
  const [org] = await db
    .insert(orgs)
    .values({ name: `Agency${seq}`, slug: `agency-${seq++}-${Date.now()}` })
    .returning();
  const rec = await seedRecruiter({ company: "Agency" });
  await db
    .update(recruiters)
    .set({ orgId: org.id, clientKind: "agency" })
    .where(eq(recruiters.id, rec.recruiterId));
  // Authorization reads the membership, not the session.
  await db.insert(memberships).values({ orgId: org.id, userId: rec.userId, role: "admin" });
  const [client] = await db
    .insert(clients)
    .values({ orgId: org.id, name: "Lee Ming", industry: "Construction" })
    .returning();
  const [order] = await db
    .insert(jobOrders)
    .values({ orgId: org.id, clientId: client.id, title: "Site Engineer" })
    .returning();
  return { orgId: org.id, clientId: client.id, jobOrderId: order.id, ...rec };
}

async function seedCandidate(name: string) {
  const [row] = await db
    .insert(applicantProfiles)
    .values({
      name,
      email: `p-${seq++}-${Date.now()}@test.dev`,
      cvLink: "https://example.com/cv",
      pipaConsent: true,
    })
    .returning({ id: applicantProfiles.id });
  return row.id;
}

async function seedPlacement(
  a: Awaited<ReturnType<typeof seedAgency>>,
  name: string,
  extra: Partial<typeof placements.$inferInsert> = {}
) {
  const candidateId = await seedCandidate(name);
  const [row] = await db
    .insert(placements)
    .values({
      orgId: a.orgId,
      candidateId,
      jobOrderId: a.jobOrderId,
      clientId: a.clientId,
      status: "started",
      ...extra,
    })
    .returning({ id: placements.id });
  return { id: row.id, candidateId };
}

describe("placement lifecycle — guarantee window", () => {
  it("counts a live placement inside its guarantee, and the fee still at risk", async () => {
    const a = await seedAgency();
    await seedPlacement(a, "In Guarantee", { guaranteeUntil: iso(30), feeAmount: 45600 });
    await seedPlacement(a, "Out Of Guarantee", { guaranteeUntil: iso(-10), feeAmount: 40800 });

    const { totals, rows } = await getPlacementLifecycle(a.orgId);

    expect(totals.active).toBe(2);
    expect(totals.inGuarantee).toBe(1);
    // only the fee still exposed to clawback counts
    expect(totals.feeAtRisk).toBe(45600);
    // the one needing attention sorts first
    expect(rows[0].candidateName).toBe("In Guarantee");
    expect(rows[0].guaranteeDaysLeft).toBe(30);
    expect(rows[1].inGuarantee).toBe(false);
  });

  it("a placement that already ended is not 'in guarantee' even if the date has not passed", async () => {
    const a = await seedAgency();
    await seedPlacement(a, "Left Early", {
      status: "fell_off",
      guaranteeUntil: iso(30),
      endDate: iso(-2),
      feeAmount: 50000,
    });

    const { totals } = await getPlacementLifecycle(a.orgId);
    expect(totals.active).toBe(0);
    expect(totals.fellOff).toBe(1);
    // they are gone; the guarantee no longer represents live exposure
    expect(totals.inGuarantee).toBe(0);
    expect(totals.feeAtRisk).toBe(0);
  });
});

describe("placement lifecycle — document risk while placed", () => {
  it("flags a live placement whose linked document expires soon", async () => {
    const a = await seedAgency();
    const ok = await seedPlacement(a, "Papers Fine", { guaranteeUntil: iso(20) });
    const bad = await seedPlacement(a, "Permit Lapsing", { guaranteeUntil: iso(20) });

    await db.insert(complianceDocuments).values([
      { orgId: a.orgId, candidateId: ok.candidateId, placementId: ok.id, docType: "arc", expiryDate: iso(400) },
      { orgId: a.orgId, candidateId: bad.candidateId, placementId: bad.id, docType: "arc", expiryDate: iso(400) },
      // the whole point of the screen: a permit lapsing while they are on a client site
      { orgId: a.orgId, candidateId: bad.candidateId, placementId: bad.id, docType: "work_permit", expiryDate: iso(10) },
    ]);

    const { rows, totals } = await getPlacementLifecycle(a.orgId);
    const flagged = rows.find((r) => r.candidateName === "Permit Lapsing");

    expect(totals.docRisk).toBe(1);
    // worst document decides, even though the ARC is fine for another year
    expect(flagged?.docStatus).toBe("expiring");
    expect(flagged?.soonestDocExpiry).toBe(iso(10));
    expect(rows.find((r) => r.candidateName === "Papers Fine")?.docStatus).toBe("valid");
  });

  it("ignores superseded documents, so a renewal clears the risk", async () => {
    const a = await seedAgency();
    const pl = await seedPlacement(a, "Renewed", { guaranteeUntil: iso(20) });
    await db.insert(complianceDocuments).values([
      { orgId: a.orgId, candidateId: pl.candidateId, placementId: pl.id, docType: "arc", expiryDate: iso(-5), status: "superseded" },
      { orgId: a.orgId, candidateId: pl.candidateId, placementId: pl.id, docType: "arc", expiryDate: iso(365) },
    ]);

    const { totals, rows } = await getPlacementLifecycle(a.orgId);
    expect(totals.docRisk).toBe(0);
    expect(rows[0].docStatus).toBe("valid");
  });

  it("does not count document risk for a placement that has ended", async () => {
    const a = await seedAgency();
    const pl = await seedPlacement(a, "Gone", { status: "completed", endDate: iso(-1) });
    await db.insert(complianceDocuments).values({
      orgId: a.orgId, candidateId: pl.candidateId, placementId: pl.id, docType: "arc", expiryDate: iso(-30),
    });

    const { totals } = await getPlacementLifecycle(a.orgId);
    // an expired permit for someone who no longer works there is not the agency's exposure
    expect(totals.docRisk).toBe(0);
  });

  it("scopes to the caller's org", async () => {
    const a = await seedAgency();
    const b = await seedAgency();
    await seedPlacement(a, "Ours", { guaranteeUntil: iso(10) });
    await seedPlacement(b, "Theirs", { guaranteeUntil: iso(10) });

    expect((await getPlacementLifecycle(a.orgId)).rows.map((r) => r.candidateName)).toEqual(["Ours"]);
    expect((await getPlacementLifecycle(b.orgId)).rows.map((r) => r.candidateName)).toEqual(["Theirs"]);
  });
});

describe("placement lifecycle — ending a placement", () => {
  const patch = (id: number, body: unknown) =>
    updatePlacement(
      jsonRequest(`http://localhost/api/agency/placements/${id}`, { method: "PATCH", body }),
      { params: Promise.resolve({ id: String(id) }) }
    );

  it("requires an end date before a placement can be closed", async () => {
    const a = await seedAgency();
    const pl = await seedPlacement(a, "Ending", { guaranteeUntil: iso(30) });
    await withSession({ userId: a.userId, email: a.email, role: "recruiter" });

    const res = await patch(pl.id, { status: "completed" });
    expect(res.status).toBe(400);

    const [row] = await db.select().from(placements).where(eq(placements.id, pl.id));
    expect(row.status).toBe("started");
  });

  it("requires a reason when a placement falls off", async () => {
    const a = await seedAgency();
    const pl = await seedPlacement(a, "Leaving", { guaranteeUntil: iso(30) });
    await withSession({ userId: a.userId, email: a.email, role: "recruiter" });

    expect((await patch(pl.id, { status: "fell_off", endDate: iso(-1) })).status).toBe(400);

    const ok = await patch(pl.id, {
      status: "fell_off",
      endDate: iso(-1),
      endReason: "Returned home",
    });
    expect(ok.status).toBe(200);
    // leaving before the guarantee expired is the clawback case, and the response says so
    expect((await ok.json()).insideGuarantee).toBe(true);
  });

  it("does not flag a clawback when they leave after the guarantee expired", async () => {
    const a = await seedAgency();
    const pl = await seedPlacement(a, "Stayed", { guaranteeUntil: iso(-60) });
    await withSession({ userId: a.userId, email: a.email, role: "recruiter" });

    const res = await patch(pl.id, {
      status: "fell_off",
      endDate: iso(-1),
      endReason: "Moved on",
    });
    expect(res.status).toBe(200);
    expect((await res.json()).insideGuarantee).toBe(false);
  });

  it("cannot update another org's placement", async () => {
    const a = await seedAgency();
    const b = await seedAgency();
    const pl = await seedPlacement(a, "Ours", { guaranteeUntil: iso(10) });
    await withSession({ userId: b.userId, email: b.email, role: "recruiter" });

    expect((await patch(pl.id, { status: "started" })).status).toBe(404);
  });
});
