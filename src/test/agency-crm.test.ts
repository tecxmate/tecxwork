import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  clients,
  complianceDocuments,
  orgs,
  placements,
  recruiters,
  memberships,
} from "@/lib/db/schema";
import { jsonRequest, seedApplicant, seedRecruiter, withSession } from "./helpers";
import type { MemberRole } from "@/lib/ats-auth";

import { POST as createClient } from "@/app/api/agency/clients/route";
import { POST as createContact } from "@/app/api/agency/contacts/route";
import { POST as createJobOrder } from "@/app/api/agency/job-orders/route";
import { POST as createPlacement } from "@/app/api/agency/placements/route";
import { POST as createDoc } from "@/app/api/agency/compliance/route";
import { POST as renewDoc } from "@/app/api/agency/compliance/[id]/renew/route";

/** An agency recruiter in its own org — the only shape allowed to write CRM rows. */
async function seedAgency(name: string, role: MemberRole = "admin") {
  const [org] = await db.insert(orgs).values({ name, slug: `${name}-${Date.now()}` }).returning();
  const rec = await seedRecruiter({ company: name });
  await db
    .update(recruiters)
    .set({ orgId: org.id, clientKind: "agency" })
    .where(eq(recruiters.id, rec.recruiterId));
  // Authorization reads the membership, not the session — production has one for every
  // recruiter, so a test without one would be exercising a state that cannot occur.
  await db.insert(memberships).values({ orgId: org.id, userId: rec.userId, role });
  return { orgId: org.id, role, ...rec };
}

const body = (url: string, payload: unknown) =>
  jsonRequest(`http://localhost${url}`, { method: "POST", body: payload });

describe("agency CRM — access control", () => {
  it("rejects an unauthenticated caller", async () => {
    const res = await createClient(body("/api/agency/clients", { name: "Acme" }));
    expect(res.status).toBe(401);
  });

  it("rejects a client-company recruiter (only agencies may write CRM rows)", async () => {
    const rec = await seedRecruiter({ company: "Lee Ming Construction" });
    // clientKind defaults to a non-agency value and orgId is null
    withSession({ userId: rec.userId, email: rec.email, role: "recruiter" });

    const res = await createClient(body("/api/agency/clients", { name: "Acme" }));
    expect(res.status).toBe(403);
    expect(await db.select().from(clients)).toHaveLength(0);
  });

  it("cannot attach a contact to another org's client", async () => {
    const a = await seedAgency("AgencyA");
    const b = await seedAgency("AgencyB");

    withSession({ userId: a.userId, email: a.email, role: "recruiter" });
    const created = await createClient(body("/api/agency/clients", { name: "A's client" }));
    const { client } = await created.json();

    // B is a perfectly valid agency — it just must not see A's rows.
    withSession({ userId: b.userId, email: b.email, role: "recruiter" });
    const res = await createContact(
      body("/api/agency/contacts", { clientId: client.id, name: "Mallory" })
    );

    expect(res.status).toBe(404);
    expect(await db.select().from(orgs)).toHaveLength(2);
  });
});

describe("agency CRM — data integrity", () => {
  it("refuses a duplicate client name within the org", async () => {
    const a = await seedAgency("AgencyA");
    withSession({ userId: a.userId, email: a.email, role: "recruiter" });

    expect((await createClient(body("/api/agency/clients", { name: "Giant" }))).status).toBe(201);
    const second = await createClient(body("/api/agency/clients", { name: "Giant" }));

    expect(second.status).toBe(409);
    expect(await db.select().from(clients)).toHaveLength(1);
  });

  it("lets two different orgs each have a client with the same name", async () => {
    const a = await seedAgency("AgencyA");
    const b = await seedAgency("AgencyB");

    withSession({ userId: a.userId, email: a.email, role: "recruiter" });
    expect((await createClient(body("/api/agency/clients", { name: "Giant" }))).status).toBe(201);
    withSession({ userId: b.userId, email: b.email, role: "recruiter" });
    expect((await createClient(body("/api/agency/clients", { name: "Giant" }))).status).toBe(201);

    expect(await db.select().from(clients)).toHaveLength(2);
  });

  it("a client order requires a client", async () => {
    const a = await seedAgency("AgencyA");
    withSession({ userId: a.userId, email: a.email, role: "recruiter" });

    const res = await createJobOrder(
      body("/api/agency/job-orders", { title: "Site Engineer", type: "client_order" })
    );
    expect(res.status).toBe(400);
  });

  it("derives a placement's client from its job order, ignoring anything the caller sends", async () => {
    const a = await seedAgency("AgencyA");
    withSession({ userId: a.userId, email: a.email, role: "recruiter" });

    const real = await (await createClient(body("/api/agency/clients", { name: "Real client" }))).json();
    const decoy = await (await createClient(body("/api/agency/clients", { name: "Decoy" }))).json();
    const order = await (
      await createJobOrder(
        body("/api/agency/job-orders", { clientId: real.client.id, title: "Site Engineer" })
      )
    ).json();
    const cand = await seedApplicant({ name: "Nguyen Van A" });

    const res = await createPlacement(
      body("/api/agency/placements", {
        candidateId: cand.applicantId,
        jobOrderId: order.jobOrder.id,
        // a caller trying to bill the placement to a different client
        clientId: decoy.client.id,
      })
    );
    expect(res.status).toBe(201);

    const [row] = await db.select().from(placements);
    expect(row.clientId).toBe(real.client.id);
  });

  it("refuses to place the same candidate on the same job order twice", async () => {
    const a = await seedAgency("AgencyA");
    withSession({ userId: a.userId, email: a.email, role: "recruiter" });

    const client = await (await createClient(body("/api/agency/clients", { name: "C" }))).json();
    const order = await (
      await createJobOrder(body("/api/agency/job-orders", { clientId: client.client.id, title: "Role" }))
    ).json();
    const cand = await seedApplicant({ name: "Duplicate" });
    const payload = { candidateId: cand.applicantId, jobOrderId: order.jobOrder.id };

    expect((await createPlacement(body("/api/agency/placements", payload))).status).toBe(201);
    expect((await createPlacement(body("/api/agency/placements", payload))).status).toBe(409);
    expect(await db.select().from(placements)).toHaveLength(1);
  });
});

describe("compliance documents — renewal keeps history", () => {
  async function seedDoc() {
    const a = await seedAgency("AgencyA");
    withSession({ userId: a.userId, email: a.email, role: "recruiter" });
    const cand = await seedApplicant({ name: "Le Van Duc" });
    const res = await createDoc(
      body("/api/agency/compliance", {
        candidateId: cand.applicantId,
        docType: "arc",
        docNumber: "AR900068",
        issuingAuthority: "NIA 移民署",
        expiryDate: "2026-07-23",
      })
    );
    const { document } = await res.json();
    return { agency: a, candidateId: cand.applicantId, docId: document.id as number };
  }

  it("supersedes the old record rather than overwriting it", async () => {
    const { docId } = await seedDoc();

    const res = await renewDoc(
      body(`/api/agency/compliance/${docId}/renew`, { expiryDate: "2027-07-23" }),
      { params: Promise.resolve({ id: String(docId) }) }
    );
    expect(res.status).toBe(201);

    const rows = await db.select().from(complianceDocuments);
    // both records survive — the question "was this worker covered in July?" stays answerable
    expect(rows).toHaveLength(2);

    const [old] = rows.filter((r) => r.id === docId);
    const [fresh] = rows.filter((r) => r.id !== docId);
    expect(old.status).toBe("superseded");
    expect(old.expiryDate).toBe("2026-07-23");
    expect(fresh.status).toBe("valid");
    expect(fresh.expiryDate).toBe("2027-07-23");
    // details the renewal did not restate carry over from the old record
    expect(fresh.docType).toBe("arc");
    expect(fresh.docNumber).toBe("AR900068");
    expect(fresh.candidateId).toBe(old.candidateId);
  });

  it("refuses to renew an already-superseded record", async () => {
    const { docId } = await seedDoc();
    const params = { params: Promise.resolve({ id: String(docId) }) };

    await renewDoc(body(`/api/agency/compliance/${docId}/renew`, { expiryDate: "2027-07-23" }), params);
    const again = await renewDoc(
      body(`/api/agency/compliance/${docId}/renew`, { expiryDate: "2028-07-23" }),
      params
    );

    expect(again.status).toBe(409);
    // no third row — the history must not fork into two "current" documents
    expect(await db.select().from(complianceDocuments)).toHaveLength(2);
  });

  it("cannot renew another org's document", async () => {
    const { docId } = await seedDoc();
    const b = await seedAgency("AgencyB");
    withSession({ userId: b.userId, email: b.email, role: "recruiter" });

    const res = await renewDoc(
      body(`/api/agency/compliance/${docId}/renew`, { expiryDate: "2030-01-01" }),
      { params: Promise.resolve({ id: String(docId) }) }
    );

    expect(res.status).toBe(404);
    const [row] = await db
      .select()
      .from(complianceDocuments)
      .where(and(eq(complianceDocuments.id, docId)));
    expect(row.status).toBe("valid");
  });

  it("rejects a malformed expiry date", async () => {
    const { docId } = await seedDoc();
    const res = await renewDoc(
      body(`/api/agency/compliance/${docId}/renew`, { expiryDate: "23/07/2027" }),
      { params: Promise.resolve({ id: String(docId) }) }
    );
    expect(res.status).toBe(400);
  });
});
