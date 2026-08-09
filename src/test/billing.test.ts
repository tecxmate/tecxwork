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
import {
  computeFee,
  computeTotals,
  describeFeeRate,
  creditableRemaining,
  getBillingData,
  nextCreditNoteNumber,
  nextInvoiceNumber,
} from "@/lib/billing";
import {
  GET as listBilling,
  POST as createInvoice,
} from "@/app/api/agency/invoices/route";
import { POST as invoiceAction } from "@/app/api/agency/invoices/[id]/route";
import { POST as createCreditNote } from "@/app/api/agency/invoices/[id]/credit-notes/route";
import { POST as createPlacement } from "@/app/api/agency/placements/route";

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

describe("billing — credit notes", () => {
  async function issuedInvoice() {
    const a = await seedAgency();
    const { clientId, placementId, candidateName } = await seedPlacement(a.orgId, 45600);
    const { invoice } = await (
      await createInvoice(post({ clientId, placementIds: [placementId] }))
    ).json();
    await act(invoice.id, { action: "issue" });
    return { ...a, invoiceId: invoice.id as number, placementId, candidateName };
  }

  const credit = (invoiceId: number, payload: unknown) =>
    createCreditNote(
      jsonRequest(`http://localhost/api/agency/invoices/${invoiceId}/credit-notes`, {
        method: "POST",
        body: payload,
      }),
      ctx(invoiceId)
    );

  it("credits an issued invoice and nets off what is owed", async () => {
    const { invoiceId, orgId } = await issuedInvoice();

    const res = await credit(invoiceId, { subtotal: 45600, reason: "Fell off in week 3" });
    expect(res.status).toBe(201);
    const { creditNote } = await res.json();
    // tax follows the invoice's rate, so the credit reverses exactly what was charged
    expect(creditNote.total).toBe(47880);
    expect(creditNote.number).toMatch(/^CN-\d{4}-0001$/);

    const data = await getBillingData(orgId);
    const row = data.invoices.find((i) => i.id === invoiceId)!;
    expect(row.netTotal).toBe(0);
    expect(row.credits[0].reason).toBe("Fell off in week 3");
    // a fully credited invoice is not money anyone is waiting for
    expect(data.totals.outstanding).toBe(0);
  });

  it("supports a partial credit", async () => {
    const { invoiceId, orgId } = await issuedInvoice();
    await credit(invoiceId, { subtotal: 22800, reason: "Half the fee, goodwill" });

    const row = (await getBillingData(orgId)).invoices.find((i) => i.id === invoiceId)!;
    expect(row.netTotal).toBe(47880 - 23940);
  });

  it("refuses to credit more than was billed", async () => {
    const { invoiceId } = await issuedInvoice();
    const res = await credit(invoiceId, { subtotal: 50000, reason: "too much" });
    expect(res.status).toBe(409);
    // crediting past the invoice would turn it into money owed to the client
    expect((await res.json()).error).toMatch(/more than remains/i);
  });

  it("refuses a second credit that would exceed the remainder", async () => {
    const { invoiceId } = await issuedInvoice();
    expect((await credit(invoiceId, { subtotal: 40000, reason: "most of it" })).status).toBe(201);
    expect((await credit(invoiceId, { subtotal: 10000, reason: "the rest" })).status).toBe(409);
  });

  it("requires a reason", async () => {
    const { invoiceId } = await issuedInvoice();
    expect((await credit(invoiceId, { subtotal: 1000, reason: "   " })).status).toBe(400);
  });

  it("refuses to credit a draft — that is what voiding is for", async () => {
    const a = await seedAgency();
    const { clientId, placementId } = await seedPlacement(a.orgId, 45600);
    const { invoice } = await (
      await createInvoice(post({ clientId, placementIds: [placementId] }))
    ).json();

    const res = await credit(invoice.id, { subtotal: 1000, reason: "wrong" });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/void it instead/i);
  });

  it("can credit a PAID invoice, which is the case voiding cannot handle", async () => {
    const { invoiceId } = await issuedInvoice();
    await act(invoiceId, { action: "pay" });
    expect((await credit(invoiceId, { subtotal: 45600, reason: "Left in guarantee" })).status).toBe(201);
  });

  it("uses its own number sequence, separate from invoices", async () => {
    const { orgId } = await issuedInvoice();
    expect(await nextCreditNoteNumber(orgId, 2026)).toBe("CN-2026-0001");
    // the invoice sequence is untouched by credit notes
    expect(await nextInvoiceNumber(orgId, new Date().getUTCFullYear())).toMatch(/-0002$/);
  });

  it("reports what is still creditable", async () => {
    const { invoiceId } = await issuedInvoice();
    expect(await creditableRemaining(invoiceId)).toBe(47880);
    await credit(invoiceId, { subtotal: 20000, reason: "partial" });
    expect(await creditableRemaining(invoiceId)).toBe(47880 - 21000);
  });

  it("cannot credit another org's invoice", async () => {
    const { invoiceId } = await issuedInvoice();
    const other = await seedAgency();
    await withSession({ userId: other.userId, email: other.email, role: "recruiter" });
    expect((await credit(invoiceId, { subtotal: 1000, reason: "nope" })).status).toBe(404);
  });
});

describe("billing — the fee rate", () => {
  it("computes a multiple of monthly salary, the Taiwan convention", () => {
    // 1.2 months on a 38,000 salary is the 45,600 already in the data.
    expect(computeFee(38000, { basis: "months_salary", value: 120 })).toBe(45600);
    expect(computeFee(34000, { basis: "months_salary", value: 120 })).toBe(40800);
  });

  it("computes a percentage of the first year", () => {
    expect(computeFee(38000, { basis: "percent_annual", value: 20 })).toBe(91200);
  });

  it("rounds to whole currency rather than carrying a fraction", () => {
    // 1.15 months of 33,333 is 38,332.95 — a fee must be a whole number of dollars.
    expect(computeFee(33333, { basis: "months_salary", value: 115 })).toBe(38333);
  });

  it("returns null when no rate is agreed, rather than inventing one", () => {
    // A wrong fee that looks computed is worse than an empty field.
    expect(computeFee(38000, null)).toBeNull();
    expect(computeFee(38000, { basis: "months_salary", value: 0 })).toBeNull();
  });

  it("returns null for a missing or nonsensical salary", () => {
    expect(computeFee(0, { basis: "months_salary", value: 120 })).toBeNull();
    expect(computeFee(-5000, { basis: "months_salary", value: 120 })).toBeNull();
  });

  it("describes the rate in words, so the number on screen is explainable", () => {
    expect(describeFeeRate({ basis: "months_salary", value: 120 })).toBe("1.2 months of salary");
    expect(describeFeeRate({ basis: "months_salary", value: 100 })).toBe("1 month of salary");
    expect(describeFeeRate({ basis: "percent_annual", value: 20 })).toBe(
      "20% of first-year salary"
    );
    expect(describeFeeRate(null)).toBeNull();
  });
});

describe("billing — a placement picks up the client's rate", () => {
  async function agencyWithRate(basis: string | null, value: number | null) {
    const a = await seedAgency();
    const [client] = await db
      .insert(clients)
      .values({
        orgId: a.orgId,
        name: `Rated${seq++}`,
        industry: "Construction",
        feeBasis: basis,
        feeValue: value,
      })
      .returning();
    const [order] = await db
      .insert(jobOrders)
      .values({ orgId: a.orgId, clientId: client.id, title: "Site Engineer" })
      .returning();
    const [candidate] = await db
      .insert(applicantProfiles)
      .values({
        name: "Rate Test",
        email: `r-${seq++}-${Date.now()}@test.dev`,
        cvLink: "https://example.com/cv",
        pipaConsent: true,
      })
      .returning({ id: applicantProfiles.id });
    return { ...a, clientId: client.id, jobOrderId: order.id, candidateId: candidate.id };
  }

  const place = (payload: unknown) =>
    createPlacement(
      jsonRequest("http://localhost/api/agency/placements", { method: "POST", body: payload })
    );

  it("computes the fee from the rate when none is given", async () => {
    const a = await agencyWithRate("months_salary", 120);
    const res = await place({
      candidateId: a.candidateId,
      jobOrderId: a.jobOrderId,
      salary: 38000,
    });
    expect(res.status).toBe(201);

    const [row] = await db.select().from(placements).where(eq(placements.orgId, a.orgId));
    expect(row.feeAmount).toBe(45600);
  });

  it("an explicit fee still wins, because not every deal follows the rate", async () => {
    const a = await agencyWithRate("months_salary", 120);
    await place({
      candidateId: a.candidateId,
      jobOrderId: a.jobOrderId,
      salary: 38000,
      feeAmount: 30000,
    });

    const [row] = await db.select().from(placements).where(eq(placements.orgId, a.orgId));
    expect(row.feeAmount).toBe(30000);
  });

  it("leaves the fee empty when the client has no agreed rate", async () => {
    const a = await agencyWithRate(null, null);
    await place({ candidateId: a.candidateId, jobOrderId: a.jobOrderId, salary: 38000 });

    const [row] = await db.select().from(placements).where(eq(placements.orgId, a.orgId));
    // Better an empty field than a fee nobody agreed to.
    expect(row.feeAmount).toBeNull();
  });

  it("leaves the fee empty when there is no salary to compute from", async () => {
    const a = await agencyWithRate("months_salary", 120);
    await place({ candidateId: a.candidateId, jobOrderId: a.jobOrderId });

    const [row] = await db.select().from(placements).where(eq(placements.orgId, a.orgId));
    expect(row.feeAmount).toBeNull();
  });
});
