import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  applicantProfiles,
  clients,
  invoiceLines,
  invoices,
  jobOrders,
  memberships,
  orgs,
  placements,
  recruiters,
} from "@/lib/db/schema";
import { jsonRequest, seedRecruiter, withSession } from "./helpers";
import type { MemberRole } from "@/lib/ats-auth";
import { computeTotals, getBillingData, nextInvoiceNumber } from "@/lib/billing";
import {
  GET as listBilling,
  POST as createInvoice,
} from "@/app/api/agency/invoices/route";
import { POST as invoiceAction } from "@/app/api/agency/invoices/[id]/route";

let seq = 0;

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

async function seedPlacement(orgId: number, feeAmount: number | null, name = "Placed Person") {
  const [client] = await db
    .insert(clients)
    .values({ orgId, name: `Client${seq++}`, industry: "Construction" })
    .returning();
  const [order] = await db
    .insert(jobOrders)
    .values({ orgId, clientId: client.id, title: "Site Engineer" })
    .returning();
  const [candidate] = await db
    .insert(applicantProfiles)
    .values({
      name,
      email: `b-${seq++}-${Date.now()}@test.dev`,
      cvLink: "https://example.com/cv",
      pipaConsent: true,
    })
    .returning({ id: applicantProfiles.id });
  const [placement] = await db
    .insert(placements)
    .values({
      orgId,
      candidateId: candidate.id,
      jobOrderId: order.id,
      clientId: client.id,
      status: "started",
      startDate: "2026-06-15",
      salary: 38000,
      feeAmount,
    })
    .returning({ id: placements.id });
  return { clientId: client.id, placementId: placement.id, candidateName: name };
}

const post = (payload: unknown) =>
  jsonRequest("http://localhost/api/agency/invoices", { method: "POST", body: payload });
const ctx = (id: number) => ({ params: Promise.resolve({ id: String(id) }) });
const act = (id: number, payload: unknown) =>
  invoiceAction(
    jsonRequest(`http://localhost/api/agency/invoices/${id}`, { method: "POST", body: payload }),
    ctx(id)
  );

describe("billing — the arithmetic", () => {
  it("applies tax to the subtotal, not line by line", () => {
    // Rounding each line then summing gives 3, rounding the sum gives 2. The client's own
    // accounts do the second, so this must too.
    expect(computeTotals([15, 15, 15], 500)).toEqual({
      subtotal: 45,
      taxAmount: 2,
      total: 47,
    });
  });

  it("computes 5% business tax exactly on realistic fees", () => {
    expect(computeTotals([45600, 40800], 500)).toEqual({
      subtotal: 86400,
      taxAmount: 4320,
      total: 90720,
    });
  });

  it("handles an empty invoice without producing NaN", () => {
    expect(computeTotals([], 500)).toEqual({ subtotal: 0, taxAmount: 0, total: 0 });
  });
});

describe("billing — invoice numbers", () => {
  it("starts at 0001 and increments within the year", async () => {
    const a = await seedAgency();
    expect(await nextInvoiceNumber(a.orgId, 2026)).toBe("INV-2026-0001");

    const { clientId, placementId } = await seedPlacement(a.orgId, 45600);
    await createInvoice(post({ clientId, placementIds: [placementId] }));

    const next = await nextInvoiceNumber(a.orgId, new Date().getUTCFullYear());
    expect(next).toMatch(/-0002$/);
  });

  it("numbers are per-org, so two agencies do not collide", async () => {
    const a = await seedAgency();
    expect(await nextInvoiceNumber(a.orgId, 2026)).toBe("INV-2026-0001");
    const b = await seedAgency();
    expect(await nextInvoiceNumber(b.orgId, 2026)).toBe("INV-2026-0001");
  });
});

describe("billing — raising an invoice", () => {
  it("takes the amount from the placement, not from the caller", async () => {
    const a = await seedAgency();
    const { clientId, placementId, candidateName } = await seedPlacement(a.orgId, 45600);

    const res = await createInvoice(
      // a caller-supplied amount is simply not part of the contract
      post({ clientId, placementIds: [placementId] })
    );
    expect(res.status).toBe(201);
    const { invoice } = await res.json();
    expect(invoice.subtotal).toBe(45600);
    expect(invoice.taxAmount).toBe(2280);
    expect(invoice.total).toBe(47880);

    const [line] = await db
      .select()
      .from(invoiceLines)
      .where(eq(invoiceLines.invoiceId, invoice.id));
    expect(line.amount).toBe(45600);
    expect(line.description).toContain(candidateName);
  });

  it("refuses to bill the same placement twice", async () => {
    const a = await seedAgency();
    const { clientId, placementId, candidateName } = await seedPlacement(a.orgId, 45600);
    expect((await createInvoice(post({ clientId, placementIds: [placementId] }))).status).toBe(201);

    const second = await createInvoice(post({ clientId, placementIds: [placementId] }));
    expect(second.status).toBe(409);
    // the message names who, rather than leaking a constraint name
    expect((await second.json()).error).toContain(candidateName);
  });

  it("refuses a placement with no fee recorded", async () => {
    const a = await seedAgency();
    const { clientId, placementId } = await seedPlacement(a.orgId, null, "No Fee");
    const res = await createInvoice(post({ clientId, placementIds: [placementId] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/no fee/i);
  });

  it("refuses to bill one client for another's placement", async () => {
    const a = await seedAgency();
    const first = await seedPlacement(a.orgId, 45600);
    const second = await seedPlacement(a.orgId, 40800);

    const res = await createInvoice(
      post({ clientId: first.clientId, placementIds: [first.placementId, second.placementId] })
    );
    expect(res.status).toBe(400);
    expect(await db.select().from(invoices)).toHaveLength(0);
  });

  it("cannot reach another org's placements", async () => {
    const theirs = await seedAgency();
    const t = await seedPlacement(theirs.orgId, 45600);

    const mine = await seedAgency();
    await withSession({ userId: mine.userId, email: mine.email, role: "recruiter" });

    const res = await createInvoice(
      post({ clientId: t.clientId, placementIds: [t.placementId] })
    );
    // the client lookup is org-scoped, so it is simply not found
    expect(res.status).toBe(404);
  });
});

describe("billing — the lifecycle", () => {
  async function draft() {
    const a = await seedAgency();
    const { clientId, placementId } = await seedPlacement(a.orgId, 45600);
    const { invoice } = await (
      await createInvoice(post({ clientId, placementIds: [placementId], dueDate: "2026-09-30" }))
    ).json();
    return { ...a, clientId, placementId, invoiceId: invoice.id as number };
  }

  it("issues, then records payment", async () => {
    const { invoiceId } = await draft();
    expect((await act(invoiceId, { action: "issue" })).status).toBe(200);

    let [row] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    expect(row.status).toBe("issued");
    expect(row.issueDate).toBeTruthy();

    expect((await act(invoiceId, { action: "pay" })).status).toBe(200);
    [row] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    expect(row.status).toBe("paid");
    // defaults to the full amount when none is given
    expect(row.paidAmount).toBe(47880);
  });

  it("records a part payment as what actually arrived", async () => {
    const { invoiceId } = await draft();
    await act(invoiceId, { action: "issue" });
    await act(invoiceId, { action: "pay", paidAmount: 40000 });

    const [row] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    expect(row.paidAmount).toBe(40000);
  });

  it("cannot pay an invoice that was never issued", async () => {
    const { invoiceId } = await draft();
    expect((await act(invoiceId, { action: "pay" })).status).toBe(409);
  });

  it("requires a reason to void, and refuses to void a paid invoice", async () => {
    const { invoiceId } = await draft();
    expect((await act(invoiceId, { action: "void" })).status).toBe(400);

    await act(invoiceId, { action: "issue" });
    await act(invoiceId, { action: "pay" });

    const res = await act(invoiceId, { action: "void", voidReason: "wrong client" });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/credit note/i);
  });

  it("voiding frees the placement to be billed again", async () => {
    const { invoiceId, clientId, placementId } = await draft();
    expect(
      (await act(invoiceId, { action: "void", voidReason: "wrong rate applied" })).status
    ).toBe(200);

    // the record survives, marked void
    const [row] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    expect(row.status).toBe("void");
    expect(row.voidReason).toBe("wrong rate applied");

    // and the corrected invoice can be raised
    const again = await createInvoice(post({ clientId, placementIds: [placementId] }));
    expect(again.status).toBe(201);
  });
});

describe("billing — what the money screen answers", () => {
  it("separates outstanding from overdue", async () => {
    const a = await seedAgency();
    const soon = await seedPlacement(a.orgId, 45600, "Not Yet Due");
    const late = await seedPlacement(a.orgId, 40800, "Overdue");

    const one = await (
      await createInvoice(
        post({ clientId: soon.clientId, placementIds: [soon.placementId], dueDate: "2026-12-31" })
      )
    ).json();
    const two = await (
      await createInvoice(
        post({ clientId: late.clientId, placementIds: [late.placementId], dueDate: "2026-01-01" })
      )
    ).json();
    await act(one.invoice.id, { action: "issue" });
    await act(two.invoice.id, { action: "issue" });

    const { totals } = await getBillingData(a.orgId, new Date("2026-06-01T00:00:00Z"));
    expect(totals.outstanding).toBe(47880 + 42840);
    // only the one past its due date
    expect(totals.overdue).toBe(42840);
  });

  it("lists placements that are billable, and drops them once billed", async () => {
    const a = await seedAgency();
    const { clientId, placementId } = await seedPlacement(a.orgId, 45600);

    let data = await getBillingData(a.orgId);
    expect(data.billable.map((b) => b.placementId)).toEqual([placementId]);

    await createInvoice(post({ clientId, placementIds: [placementId] }));
    data = await getBillingData(a.orgId);
    expect(data.billable).toHaveLength(0);
  });

  it("flags a placement that fell off after it was invoiced", async () => {
    const a = await seedAgency();
    const { clientId, placementId, candidateName } = await seedPlacement(a.orgId, 45600);
    const { invoice } = await (
      await createInvoice(post({ clientId, placementIds: [placementId] }))
    ).json();
    await act(invoice.id, { action: "issue" });

    // they leave inside the guarantee, after the client was already billed
    await db
      .update(placements)
      .set({ status: "fell_off", endDate: "2026-07-01", endReason: "Returned home" })
      .where(eq(placements.id, placementId));

    const data = await getBillingData(a.orgId);
    const row = data.invoices.find((i) => i.id === invoice.id)!;
    // the agency has billed a fee it may now have to credit
    expect(row.fellOffAfterBilling).toEqual([candidateName]);
  });
});

describe("billing — who may bill", () => {
  it("a recruiter can see billing but cannot raise an invoice", async () => {
    const a = await seedAgency("recruiter");
    const { clientId, placementId } = await seedPlacement(a.orgId, 45600);

    expect((await listBilling()).status).toBe(200);
    expect((await createInvoice(post({ clientId, placementIds: [placementId] }))).status).toBe(403);
  });

  it("an interviewer cannot even see it", async () => {
    await seedAgency("interviewer");
    expect((await listBilling()).status).toBe(403);
  });

  it("an account manager can", async () => {
    const a = await seedAgency("account_manager");
    const { clientId, placementId } = await seedPlacement(a.orgId, 45600);
    expect((await createInvoice(post({ clientId, placementIds: [placementId] }))).status).toBe(201);
  });
});
