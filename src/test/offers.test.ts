import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  applicantProfiles,
  applications,
  clients,
  jobOpenings,
  jobOrders,
  memberships,
  offers,
  pipelineStages,
  pipelineTemplates,
  orgs,
  placements,
  recruiters,
} from "@/lib/db/schema";
import { jsonRequest, seedRecruiter, withSession } from "./helpers";
import type { MemberRole } from "@/lib/ats-auth";
import { effectiveStatus, hasLapsed, isEditable } from "@/lib/offers";
import { getOffersData } from "@/lib/offers-data";
import { GET as listOffers, POST as createOffer } from "@/app/api/agency/offers/route";
import {
  PATCH as updateOffer,
  POST as offerAction,
} from "@/app/api/agency/offers/[id]/route";

let seq = 0;

const iso = (daysFromToday: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
};

async function seedAgency(role: MemberRole = "admin") {
  const [org] = await db
    .insert(orgs)
    .values({ name: `Org${seq}`, slug: `org-${seq++}-${Date.now()}` })
    .returning();
  const rec = await seedRecruiter({ company: "Agency" });
  await db
    .update(recruiters)
    .set({ orgId: org.id, clientKind: "agency" })
    .where(eq(recruiters.id, rec.recruiterId));
  await db.insert(memberships).values({ orgId: org.id, userId: rec.userId, role });
  await withSession({ userId: rec.userId, email: rec.email, role: "recruiter" });
  return { orgId: org.id, ...rec };
}

/** An application is what an offer is made against, so every test needs one. */
async function seedApplication(orgId: number, recruiterId: number) {
  const [profile] = await db
    .insert(applicantProfiles)
    .values({
      name: "Lê Văn Đức",
      email: `o-${seq++}-${Date.now()}@test.dev`,
      cvLink: "https://example.com/cv",
      pipaConsent: true,
    })
    .returning({ id: applicantProfiles.id });

  const [job] = await db
    .insert(jobOpenings)
    .values({ recruiterId, orgId, title: "Site Engineer" })
    .returning({ id: jobOpenings.id });

  const [app] = await db
    .insert(applications)
    .values({
      applicantId: profile.id,
      recruiterId,
      jobOpeningId: job.id,
      orgId,
    })
    .returning({ id: applications.id });

  return { applicationId: app.id, candidateId: profile.id };
}

const post = (payload: unknown) =>
  jsonRequest("http://localhost/api/agency/offers", { method: "POST", body: payload });
const ctx = (id: number) => ({ params: Promise.resolve({ id: String(id) }) });
const act = (id: number, payload: unknown) =>
  offerAction(
    jsonRequest(`http://localhost/api/agency/offers/${id}`, { method: "POST", body: payload }),
    ctx(id)
  );

async function draftOffer(extra: Record<string, unknown> = {}) {
  const a = await seedAgency();
  const { applicationId, candidateId } = await seedApplication(a.orgId, a.recruiterId);
  const res = await createOffer(post({ applicationId, salary: 45000, ...extra }));
  expect(res.status).toBe(201);
  const { offer } = await res.json();
  return { ...a, applicationId, candidateId, offerId: offer.id as number };
}

describe("offers — recording what was actually offered", () => {
  it("stores the terms against the application's own candidate", async () => {
    const { offerId, candidateId, applicationId } = await draftOffer({
      startDate: iso(30),
      probationMonths: 3,
    });

    const [row] = await db.select().from(offers).where(eq(offers.id, offerId));
    expect(row.status).toBe("draft");
    expect(row.salary).toBe(45000);
    expect(row.probationMonths).toBe(3);
    // the candidate comes from the application, never from the caller
    expect(row.candidateId).toBe(candidateId);
    expect(row.applicationId).toBe(applicationId);
  });

  it("refuses a second live offer for the same application", async () => {
    const { applicationId } = await draftOffer();
    const second = await createOffer(post({ applicationId, salary: 50000 }));
    expect(second.status).toBe(409);
    expect((await second.json()).error).toMatch(/already has an open offer/i);
  });

  it("allows a fresh offer once the previous one was declined", async () => {
    const { offerId, applicationId } = await draftOffer();
    await act(offerId, { action: "approve" });
    await act(offerId, { action: "decline", declineReason: "Took another role" });

    // the declined row stays for history, and the next attempt is not blocked by it
    expect((await createOffer(post({ applicationId, salary: 52000 }))).status).toBe(201);
  });

  it("refuses an offer against another org's application", async () => {
    const theirs = await seedAgency();
    const { applicationId } = await seedApplication(theirs.orgId, theirs.recruiterId);

    const mine = await seedAgency();
    await withSession({ userId: mine.userId, email: mine.email, role: "recruiter" });

    expect((await createOffer(post({ applicationId, salary: 45000 }))).status).toBe(404);
  });
});

describe("offers — approval is what makes it an offer", () => {
  it("a recruiter can draft but cannot authorise the terms", async () => {
    const a = await seedAgency("recruiter");
    const { applicationId } = await seedApplication(a.orgId, a.recruiterId);
    const created = await createOffer(post({ applicationId, salary: 45000 }));
    expect(created.status).toBe(201);
    const { offer } = await created.json();

    const res = await act(offer.id, { action: "approve" });
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/authorise/i);

    const [row] = await db.select().from(offers).where(eq(offers.id, offer.id));
    expect(row.status).toBe("draft");
    expect(row.approvedByUserId).toBeNull();
  });

  it("records who authorised the terms and when", async () => {
    const { offerId, userId } = await draftOffer();
    expect((await act(offerId, { action: "approve" })).status).toBe(200);

    const [row] = await db.select().from(offers).where(eq(offers.id, offerId));
    expect(row.status).toBe("approved");
    expect(row.approvedByUserId).toBe(userId);
    expect(row.approvedAt).not.toBeNull();
  });

  it("freezes the terms once approved", async () => {
    const { offerId } = await draftOffer();
    await act(offerId, { action: "approve" });

    const res = await updateOffer(
      jsonRequest("http://localhost/x", { method: "PATCH", body: { salary: 99999 } }),
      ctx(offerId)
    );
    expect(res.status).toBe(409);

    const [row] = await db.select().from(offers).where(eq(offers.id, offerId));
    // an approval that can be edited afterwards authorises nothing
    expect(row.salary).toBe(45000);
  });

  it("lets the terms be corrected while still a draft", async () => {
    const { offerId } = await draftOffer();
    const res = await updateOffer(
      jsonRequest("http://localhost/x", { method: "PATCH", body: { salary: 47000 } }),
      ctx(offerId)
    );
    expect(res.status).toBe(200);
    const [row] = await db.select().from(offers).where(eq(offers.id, offerId));
    expect(row.salary).toBe(47000);
  });

  it("cannot accept an offer nobody approved", async () => {
    const { offerId } = await draftOffer();
    const res = await act(offerId, { action: "accept" });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/draft/i);
  });
});

describe("offers — the response", () => {
  it("records an acceptance against the approved terms", async () => {
    const { offerId } = await draftOffer({ startDate: iso(30) });
    await act(offerId, { action: "approve" });
    await act(offerId, { action: "send" });

    const res = await act(offerId, { action: "accept" });
    expect(res.status).toBe(200);

    const [row] = await db.select().from(offers).where(eq(offers.id, offerId));
    expect(row.status).toBe("accepted");
    expect(row.respondedAt).not.toBeNull();
  });

  it("requires a reason when recording a decline", async () => {
    const { offerId } = await draftOffer();
    await act(offerId, { action: "approve" });

    expect((await act(offerId, { action: "decline" })).status).toBe(400);

    const ok = await act(offerId, { action: "decline", declineReason: "Salary too low" });
    expect(ok.status).toBe(200);
    const [row] = await db.select().from(offers).where(eq(offers.id, offerId));
    expect(row.declineReason).toBe("Salary too low");
  });

  it("cannot respond twice", async () => {
    const { offerId } = await draftOffer();
    await act(offerId, { action: "approve" });
    await act(offerId, { action: "accept" });

    const again = await act(offerId, { action: "decline", declineReason: "changed mind" });
    expect(again.status).toBe(409);
  });

  it("refuses to accept an offer whose expiry has passed", async () => {
    const { offerId } = await draftOffer({ expiresAt: iso(-1) });
    await act(offerId, { action: "approve" });

    const res = await act(offerId, { action: "accept" });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/expired/i);
  });

  it("shows a lapsed offer as expired without a scheduled job having run", async () => {
    const { offerId } = await draftOffer({ expiresAt: iso(-2) });
    await act(offerId, { action: "approve" });

    const { offers: rows } = await (await listOffers()).json();
    expect(rows.find((o: { id: number }) => o.id === offerId).status).toBe("expired");
  });
});

describe("offers — an accepted offer feeds the placement", () => {
  it("creates the placement carrying the agreed terms", async () => {
    const a = await seedAgency();
    const { applicationId } = await seedApplication(a.orgId, a.recruiterId);
    const [client] = await db
      .insert(clients)
      .values({ orgId: a.orgId, name: "Lee Ming", industry: "Construction" })
      .returning();
    const [order] = await db
      .insert(jobOrders)
      .values({ orgId: a.orgId, clientId: client.id, title: "Site Engineer" })
      .returning();

    const { offer } = await (
      await createOffer(post({ applicationId, salary: 46000, startDate: iso(21) }))
    ).json();
    // attach the vacancy, which is what makes a placement possible
    await db.update(offers).set({ jobOrderId: order.id }).where(eq(offers.id, offer.id));

    await act(offer.id, { action: "approve" });
    const res = await act(offer.id, { action: "accept" });
    const body = await res.json();
    expect(body.placementId).toBeTruthy();

    const [placement] = await db
      .select()
      .from(placements)
      .where(eq(placements.id, body.placementId));
    // the terms are inherited, not retyped
    expect(placement.salary).toBe(46000);
    expect(placement.startDate).toBe(iso(21));
    expect(placement.offerId).toBe(offer.id);
  });
});

describe("offers — withdrawal", () => {
  it("needs the same authority that approved it", async () => {
    const a = await seedAgency("recruiter");
    const { applicationId } = await seedApplication(a.orgId, a.recruiterId);
    const { offer } = await (await createOffer(post({ applicationId, salary: 45000 }))).json();

    // a recruiter drafted it but cannot pull authorised terms
    expect((await act(offer.id, { action: "withdraw" })).status).toBe(403);
  });

  it("can be withdrawn by someone who can approve", async () => {
    const { offerId } = await draftOffer();
    await act(offerId, { action: "approve" });
    expect((await act(offerId, { action: "withdraw" })).status).toBe(200);
  });
});

describe("offers — the lifecycle rules on their own", () => {
  it("only a draft is editable", () => {
    expect(isEditable("draft")).toBe(true);
    for (const s of ["approved", "sent", "accepted", "declined", "withdrawn", "expired"] as const) {
      expect(isEditable(s)).toBe(false);
    }
  });

  it("treats a missing expiry as never lapsing", () => {
    expect(hasLapsed(null, new Date())).toBe(false);
  });

  it("only folds expiry into a status that is still live", () => {
    const past = iso(-1);
    const now = new Date();
    expect(effectiveStatus("approved", past, now)).toBe("expired");
    // an accepted offer does not become "expired" just because the date passed
    expect(effectiveStatus("accepted", past, now)).toBe("accepted");
    expect(effectiveStatus("declined", past, now)).toBe("declined");
  });
});

describe("offers — who is still awaiting one", () => {
  /** Put an application into an offer-kind stage, which is what the list keys off. */
  async function inOfferStage(orgId: number, applicationId: number) {
    const [template] = await db
      .insert(pipelineTemplates)
      .values({ orgId, name: "Standard", isDefault: true })
      .returning({ id: pipelineTemplates.id });
    const [stage] = await db
      .insert(pipelineStages)
      .values({ templateId: template.id, name: "Offer", stageKind: "offer", sortOrder: 0 })
      .returning({ id: pipelineStages.id });
    await db
      .update(applications)
      .set({ stageId: stage.id })
      .where(eq(applications.id, applicationId));
  }

  it("lists someone in an offer stage with no offer written", async () => {
    const a = await seedAgency();
    const { applicationId } = await seedApplication(a.orgId, a.recruiterId);
    await inOfferStage(a.orgId, applicationId);

    const { awaitingOffer } = await getOffersData(a.orgId);
    expect(awaitingOffer.map((r) => r.applicationId)).toEqual([applicationId]);
  });

  it("drops them once an offer exists, and once they have accepted it", async () => {
    const a = await seedAgency();
    const { applicationId } = await seedApplication(a.orgId, a.recruiterId);
    await inOfferStage(a.orgId, applicationId);

    const { offer } = await (await createOffer(post({ applicationId, salary: 45000 }))).json();
    expect((await getOffersData(a.orgId)).awaitingOffer).toHaveLength(0);

    await act(offer.id, { action: "approve" });
    await act(offer.id, { action: "accept" });
    // Someone who accepted is settled, not waiting — this was wrong at first and showed
    // the same person in both lists at once.
    expect((await getOffersData(a.orgId)).awaitingOffer).toHaveLength(0);
  });

  it("puts them back after a decline, because that is who needs a new offer", async () => {
    const a = await seedAgency();
    const { applicationId } = await seedApplication(a.orgId, a.recruiterId);
    await inOfferStage(a.orgId, applicationId);

    const { offer } = await (await createOffer(post({ applicationId, salary: 45000 }))).json();
    await act(offer.id, { action: "approve" });
    await act(offer.id, { action: "decline", declineReason: "Salary too low" });

    expect((await getOffersData(a.orgId)).awaitingOffer.map((r) => r.applicationId)).toEqual([
      applicationId,
    ]);
  });
});
