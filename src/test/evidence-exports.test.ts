import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  applicantProfiles,
  clients,
  complianceDocuments,
  creditNotes,
  invoiceLines,
  invoices,
  jobOrders,
  memberships,
  orgs,
  placements,
  recruiters,
} from "@/lib/db/schema";
import type { MemberRole } from "@/lib/ats-auth";
import { seedRecruiter, withSession } from "./helpers";
import { GET as exportFees } from "@/app/api/agency/export/fees/route";
import { GET as exportEvidence } from "@/app/api/agency/export/evidence/route";

/**
 * The two audit-facing exports: the RBA Employer-Pays fee trail and the MOL 評鑑
 * evidence summary. Both are read by outsiders (a brand auditor, an MOL evaluator),
 * which is why the tests pin exact claims — a wrong number in an audit artifact is
 * worse than a crash.
 */

let seq = 9000;

async function seedAgency(role: MemberRole = "admin") {
  const [org] = await db
    .insert(orgs)
    .values({ name: `EvOrg${seq}`, slug: `ev-org-${seq++}-${Date.now()}` })
    .returning();
  const rec = await seedRecruiter({ company: "Evidence Agency" });
  await db
    .update(recruiters)
    .set({ orgId: org.id, clientKind: "agency" })
    .where(eq(recruiters.id, rec.recruiterId));
  await db.insert(memberships).values({ orgId: org.id, userId: rec.userId, role });
  await withSession({ userId: rec.userId, email: rec.email, role: "recruiter" });
  return { orgId: org.id, ...rec };
}

async function seedPlacement(
  orgId: number,
  opts: { fee?: number | null; salary?: number; name?: string; rate?: { basis: string; value: number } } = {}
) {
  const [client] = await db
    .insert(clients)
    .values({
      orgId,
      name: `EvClient${seq++}`,
      industry: "Electronics",
      feeBasis: opts.rate?.basis,
      feeValue: opts.rate?.value,
    })
    .returning();
  const [order] = await db
    .insert(jobOrders)
    .values({ orgId, clientId: client.id, title: "Line Operator" })
    .returning();
  const [candidate] = await db
    .insert(applicantProfiles)
    .values({
      name: opts.name ?? "Nguyễn Văn Evidence",
      email: `ev-${seq++}-${Date.now()}@test.dev`,
      cvLink: "https://example.com/cv",
      nationality: "Vietnamese",
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
      startDate: "2026-07-01",
      salary: opts.salary ?? 38000,
      feeAmount: opts.fee === undefined ? 45600 : opts.fee,
    })
    .returning({ id: placements.id });
  return { clientId: client.id, placementId: placement.id, candidateId: candidate.id };
}

async function seedInvoiceFor(
  orgId: number,
  clientId: number,
  placementId: number,
  opts: { amount?: number; voided?: boolean; status?: "draft" | "issued" | "paid" | "void" } = {}
) {
  const amount = opts.amount ?? 45600;
  const tax = Math.round(amount * 0.05);
  const [inv] = await db
    .insert(invoices)
    .values({
      orgId,
      clientId,
      number: `INV-2026-${String(seq++).slice(-4)}`,
      status: opts.status ?? "issued",
      issueDate: "2026-07-10",
      subtotal: amount,
      taxAmount: tax,
      total: amount + tax,
    })
    .returning();
  await db.insert(invoiceLines).values({
    invoiceId: inv.id,
    placementId,
    description: "Placement fee",
    amount,
    voided: opts.voided ?? false,
  });
  return inv;
}

/**
 * Minimal RFC-4180 line parser. Strings are quoted but numbers are NOT (toCsv leaves
 * them bare so spreadsheets can sum them), so a split-on-quotes shortcut misparses any
 * row containing a number. Fixtures contain no embedded newlines, so per-line is safe.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else cur += ch;
  }
  fields.push(cur);
  return fields;
}

function parseCsv(text: string): string[][] {
  return text.trim().split("\r\n").map(parseCsvLine);
}

describe("employer-pays fee export", () => {
  it("itemises a billed placement down to the invoice, months-of-salary and credits", async () => {
    const agency = await seedAgency();
    const { clientId, placementId } = await seedPlacement(agency.orgId, {
      fee: 45600,
      salary: 38000,
      rate: { basis: "months_salary", value: 120 },
    });
    const inv = await seedInvoiceFor(agency.orgId, clientId, placementId, {
      amount: 45600,
      status: "paid",
    });
    await db.insert(creditNotes).values({
      orgId: agency.orgId,
      invoiceId: inv.id,
      number: `CN-2026-${String(seq++).slice(-4)}`,
      issueDate: "2026-07-20",
      subtotal: 1000,
      taxAmount: 50,
      total: 1050,
      reason: "Negotiated adjustment",
    });

    const res = await exportFees();
    expect(res.status).toBe(200);
    const rows = parseCsv(await res.text());
    const row = rows.find((r) => r[0] === String(placementId));
    expect(row).toBeDefined();
    const col = (name: string) => row![rows[0].indexOf(name)];

    expect(col("Candidate")).toBe("Nguyễn Văn Evidence");
    expect(col("Monthly Salary")).toBe("38000");
    expect(col("Placement Fee")).toBe("45600");
    // 45600 / 38000 — the number an RBA auditor benchmarks.
    expect(col("Fee In Months Of Salary")).toBe("1.2");
    expect(col("Client Agreed Rate")).toBe("1.2 months of salary");
    expect(col("Fee Charged To")).toBe("employer (client)");
    expect(col("Worker-Charged Fees Recorded")).toBe("0");
    expect(col("Invoice Number")).toBe(inv.number);
    expect(col("Invoice Status")).toBe("paid");
    expect(col("Invoice Total (incl. tax)")).toBe("47880");
    expect(col("Credited Total")).toBe("1050");
    expect(col("Net Billed")).toBe(String(47880 - 1050));
  });

  it("shows an unbilled placement with empty invoice columns, not a fabricated zero", async () => {
    const agency = await seedAgency();
    const { placementId } = await seedPlacement(agency.orgId, { fee: null });

    const res = await exportFees();
    const rows = parseCsv(await res.text());
    const row = rows.find((r) => r[0] === String(placementId))!;
    const col = (name: string) => row[rows[0].indexOf(name)];

    expect(col("Placement Fee")).toBe("");
    expect(col("Invoice Number")).toBe("");
    // Net Billed empty rather than 0: "nothing billed" and "billed zero" are different claims.
    expect(col("Net Billed")).toBe("");
    // The structural columns still hold — they are about the system, not the row.
    expect(col("Worker-Charged Fees Recorded")).toBe("0");
  });

  it("attributes credits to their own invoice, never a neighbour's", async () => {
    // Guards the drizzle unqualified-identifier gotcha: an uncorrelated credit subquery
    // passes on fresh serial IDs by coincidence, and only a second invoice exposes it.
    const agency = await seedAgency();
    const a = await seedPlacement(agency.orgId, { name: "Placement A" });
    const b = await seedPlacement(agency.orgId, { name: "Placement B" });
    await seedInvoiceFor(agency.orgId, a.clientId, a.placementId, {});
    const invB = await seedInvoiceFor(agency.orgId, b.clientId, b.placementId, {});
    await db.insert(creditNotes).values({
      orgId: agency.orgId,
      invoiceId: invB.id,
      number: `CN-2026-${String(seq++).slice(-4)}`,
      issueDate: "2026-07-21",
      subtotal: 951,
      taxAmount: 48,
      total: 999,
      reason: "Correction on B only",
    });

    const res = await exportFees();
    const rows = parseCsv(await res.text());
    const credited = (pid: number) =>
      rows.find((r) => r[0] === String(pid))![rows[0].indexOf("Credited Total")];
    expect(credited(a.placementId)).toBe("0");
    expect(credited(b.placementId)).toBe("999");
  });

  it("ignores a voided invoice line — that fee is not part of the live money trail", async () => {
    const agency = await seedAgency();
    const { clientId, placementId } = await seedPlacement(agency.orgId, {});
    await seedInvoiceFor(agency.orgId, clientId, placementId, { voided: true, status: "void" });

    const res = await exportFees();
    const rows = parseCsv(await res.text());
    const row = rows.find((r) => r[0] === String(placementId))!;
    expect(row[rows[0].indexOf("Invoice Number")]).toBe("");
  });

  it("is scoped to the actor's org", async () => {
    const other = await seedAgency();
    const { placementId: foreign } = await seedPlacement(other.orgId, {});
    await seedAgency(); // second org, session now belongs here

    const res = await exportFees();
    const rows = parseCsv(await res.text());
    expect(rows.find((r) => r[0] === String(foreign))).toBeUndefined();
  });

  it("refuses a role without invoice:read", async () => {
    await seedAgency("hiring_manager");
    const res = await exportFees();
    expect(res.status).toBe(403);
  });
});

describe("evaluation evidence export", () => {
  it("aggregates service, fee, document and accountability records for the org", async () => {
    const agency = await seedAgency();
    const p1 = await seedPlacement(agency.orgId, {});
    await seedPlacement(agency.orgId, { fee: null, name: "Trần Thị Unbilled" });
    await seedInvoiceFor(agency.orgId, p1.clientId, p1.placementId, {});
    await db.insert(complianceDocuments).values([
      {
        orgId: agency.orgId,
        candidateId: p1.candidateId,
        docType: "arc" as const,
        expiryDate: "2020-01-01", // long expired
      },
      {
        orgId: agency.orgId,
        candidateId: p1.candidateId,
        docType: "work_permit" as const,
        expiryDate: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
      },
    ]);

    const res = await exportEvidence();
    expect(res.status).toBe(200);
    const rows = parseCsv(await res.text());
    const metric = (name: string) => rows.find((r) => r[1] === name)?.[2];

    expect(metric("Placements — total")).toBe("2");
    expect(metric("Placements with a recorded fee")).toBe("1");
    expect(metric("Placements billed via invoice")).toBe("1");
    expect(metric("Invoices — issued")).toBe("1");
    expect(metric("Compliance documents tracked")).toBe("2");
    expect(metric("Expired")).toBe("1");
    expect(metric("Expiring within 90 days")).toBe("1");
    expect(metric("Worker-charged fees recorded")).toBe("0");
    expect(metric("Placed candidates")).toBe("2");
    expect(metric("Placed candidates with PIPA consent")).toBe("2");
  });

  it("contains no candidate names — aggregates only", async () => {
    const agency = await seedAgency();
    await seedPlacement(agency.orgId, { name: "Lê Văn Secret" });

    const res = await exportEvidence();
    const text = await res.text();
    expect(text).not.toContain("Lê Văn Secret");
  });

  it("requires compliance:read AND invoice:read together", async () => {
    // coordinator: compliance yes, invoice no.
    await seedAgency("coordinator");
    expect((await exportEvidence()).status).toBe(403);
    // hiring_manager: neither.
    await seedAgency("hiring_manager");
    expect((await exportEvidence()).status).toBe(403);
    // viewer: both — the oversight role this pack exists for.
    await seedAgency("viewer");
    expect((await exportEvidence()).status).toBe(200);
  });
});
