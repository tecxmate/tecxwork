import { and, asc, eq, isNull, sql } from "drizzle-orm";
import {
  applicantProfiles,
  clients,
  creditNotes,
  db,
  invoiceLines,
  invoices,
  placements,
} from "@/lib/db";

/**
 * Invoicing arithmetic and the queries behind the billing screen.
 *
 * All amounts are whole TWD integers, matching how placements already store fees. Tax is
 * held in basis points so 5% 營業稅 is exact integer arithmetic — floats accumulate a cent
 * of drift per line, and an invoice that disagrees with itself by a dollar is one nobody
 * trusts.
 */

/**
 * How a client's placement fee is calculated.
 *
 * Whole units, no floats: a fee is money, and a rate expressed as 1.2 stored as a float
 * eventually produces a fee ending in .00000001.
 */
export const FEE_BASES = ["months_salary", "percent_annual"] as const;
export type FeeBasis = (typeof FEE_BASES)[number];

export type FeeRate = { basis: FeeBasis; value: number };

/**
 * The fee for a placement at the client's agreed rate.
 *
 * - `months_salary`: value is hundredths of a month, so 120 means 1.2 months' salary —
 *   the Taiwan convention and what every existing fee in the data follows.
 * - `percent_annual`: value is whole percent of the first year, so 20 means 20% of
 *   twelve months.
 *
 * Returns null when no rate is agreed, which keeps the fee a manual number rather than
 * inventing one — a wrong fee that looks computed is worse than an empty field.
 */
export function computeFee(monthlySalary: number, rate: FeeRate | null): number | null {
  if (!rate || !Number.isFinite(monthlySalary) || monthlySalary <= 0) return null;
  if (!Number.isFinite(rate.value) || rate.value <= 0) return null;

  if (rate.basis === "months_salary") {
    return Math.round((monthlySalary * rate.value) / 100);
  }
  return Math.round((monthlySalary * 12 * rate.value) / 100);
}

/** Plain-language description of a rate, so the number on screen is explainable. */
export function describeFeeRate(rate: FeeRate | null): string | null {
  if (!rate?.value) return null;
  if (rate.basis === "months_salary") {
    const months = rate.value / 100;
    return `${months} ${months === 1 ? "month" : "months"} of salary`;
  }
  return `${rate.value}% of first-year salary`;
}

/** Taiwan business tax. */
export const DEFAULT_TAX_RATE_BP = 500;

export type InvoiceTotals = {
  subtotal: number;
  taxAmount: number;
  total: number;
};

/**
 * Tax on the whole subtotal, not per line.
 *
 * Rounding each line and summing gives a different answer from rounding the sum, and the
 * client's own accounts will compute it the second way.
 */
export function computeTotals(lineAmounts: number[], taxRateBp: number): InvoiceTotals {
  const subtotal = lineAmounts.reduce((sum, amount) => sum + amount, 0);
  const taxAmount = Math.round((subtotal * taxRateBp) / 10_000);
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

/**
 * The next invoice number for an org, as `INV-YYYY-NNNN`.
 *
 * Sequential within the year and derived from what already exists, so a gap never appears
 * silently — accountants read a gap in an invoice sequence as a missing document.
 */
function nextInSequence(existing: string[], prefix: string): string {
  const highest = existing.reduce((max, value) => {
    const parsed = Number.parseInt(value.slice(prefix.length), 10);
    return Number.isFinite(parsed) && parsed > max ? parsed : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(4, "0")}`;
}

export async function nextInvoiceNumber(orgId: number, year: number): Promise<string> {
  const prefix = `INV-${year}-`;
  const rows = await db
    .select({ number: invoices.number })
    .from(invoices)
    .where(and(eq(invoices.orgId, orgId), sql`${invoices.number} LIKE ${prefix + "%"}`));
  return nextInSequence(rows.map((r) => r.number), prefix);
}

/** Credit notes have their own sequence — sharing one with invoices would confuse both. */
export async function nextCreditNoteNumber(orgId: number, year: number): Promise<string> {
  const prefix = `CN-${year}-`;
  const rows = await db
    .select({ number: creditNotes.number })
    .from(creditNotes)
    .where(and(eq(creditNotes.orgId, orgId), sql`${creditNotes.number} LIKE ${prefix + "%"}`));
  return nextInSequence(rows.map((r) => r.number), prefix);
}

/**
 * How much of an invoice has not yet been credited.
 *
 * The ceiling on a new credit note: crediting more than was billed would turn an invoice
 * into a payment owed to the client.
 */
export async function creditableRemaining(invoiceId: number): Promise<number> {
  const [invoice] = await db
    .select({ total: invoices.total })
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);
  if (!invoice) return 0;

  const credited = await db
    .select({ total: creditNotes.total })
    .from(creditNotes)
    .where(eq(creditNotes.invoiceId, invoiceId));

  return invoice.total - credited.reduce((sum, c) => sum + c.total, 0);
}

export type BillablePlacement = {
  placementId: number;
  candidateName: string;
  clientId: number;
  clientName: string;
  feeAmount: number;
  startDate: string | null;
};

/**
 * Placements with a fee that has not been billed on a live invoice.
 *
 * This is the list the whole feature exists for: before it, the only way to know what was
 * unbilled was to read every placement and remember which had been invoiced.
 */
export async function getBillablePlacements(orgId: number): Promise<BillablePlacement[]> {
  const rows = await db
    .select({
      placementId: placements.id,
      candidateName: applicantProfiles.name,
      clientId: placements.clientId,
      clientName: clients.name,
      feeAmount: placements.feeAmount,
      startDate: placements.startDate,
      billedLine: invoiceLines.id,
    })
    .from(placements)
    .innerJoin(applicantProfiles, eq(placements.candidateId, applicantProfiles.id))
    .innerJoin(clients, eq(placements.clientId, clients.id))
    // A voided line does not count as billed — that is the point of voiding.
    .leftJoin(
      invoiceLines,
      and(eq(invoiceLines.placementId, placements.id), eq(invoiceLines.voided, false))
    )
    .where(and(eq(placements.orgId, orgId), isNull(placements.endDate)))
    .orderBy(asc(placements.startDate));

  return rows
    .filter((row) => row.billedLine === null && row.feeAmount && row.clientId)
    .map((row) => ({
      placementId: row.placementId,
      candidateName: row.candidateName,
      clientId: row.clientId!,
      clientName: row.clientName,
      feeAmount: row.feeAmount!,
      startDate: row.startDate,
    }));
}

export type InvoiceRow = {
  id: number;
  number: string;
  clientName: string;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number | null;
  lines: { description: string; amount: number; placementId: number | null }[];
  /** Placements on this invoice that have since fallen off — the clawback exposure. */
  fellOffAfterBilling: string[];
  /** Credit notes raised against this invoice. */
  credits: { number: string; total: number; reason: string; issueDate: string }[];
  /** Billed minus credited — what the client actually owes. */
  netTotal: number;
};

export type BillingData = {
  invoices: InvoiceRow[];
  billable: BillablePlacement[];
  totals: { outstanding: number; overdue: number; paidThisYear: number };
};

export async function getBillingData(orgId: number, today = new Date()): Promise<BillingData> {
  const invoiceRows = await db
    .select({
      id: invoices.id,
      number: invoices.number,
      clientName: clients.name,
      status: invoices.status,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      currency: invoices.currency,
      subtotal: invoices.subtotal,
      taxAmount: invoices.taxAmount,
      total: invoices.total,
      paidAmount: invoices.paidAmount,
      paidAt: invoices.paidAt,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.orgId, orgId))
    .orderBy(asc(invoices.number));

  const lineRows = await db
    .select({
      invoiceId: invoiceLines.invoiceId,
      description: invoiceLines.description,
      amount: invoiceLines.amount,
      placementId: invoiceLines.placementId,
      placementEndDate: placements.endDate,
      placementStatus: placements.status,
      candidateName: applicantProfiles.name,
    })
    .from(invoiceLines)
    .innerJoin(invoices, eq(invoiceLines.invoiceId, invoices.id))
    .leftJoin(placements, eq(invoiceLines.placementId, placements.id))
    .leftJoin(applicantProfiles, eq(placements.candidateId, applicantProfiles.id))
    // Not filtered on `voided`: that flag exists so the partial unique index frees a
    // placement to be re-billed, not to hide history. An invoice that was voided still
    // shows the lines it was raised with — its status already says it was voided.
    .where(eq(invoices.orgId, orgId));

  const creditRows = await db
    .select({
      invoiceId: creditNotes.invoiceId,
      number: creditNotes.number,
      total: creditNotes.total,
      reason: creditNotes.reason,
      issueDate: creditNotes.issueDate,
    })
    .from(creditNotes)
    .where(eq(creditNotes.orgId, orgId));

  const iso = today.toISOString().slice(0, 10);
  const year = today.getUTCFullYear();

  const rows: InvoiceRow[] = invoiceRows.map((invoice) => {
    const lines = lineRows.filter((line) => line.invoiceId === invoice.id);
    const credits = creditRows.filter((credit) => credit.invoiceId === invoice.id);
    const credited = credits.reduce((sum, credit) => sum + credit.total, 0);
    return {
      ...invoice,
      credits: credits.map(({ number, total, reason, issueDate }) => ({
        number,
        total,
        reason,
        issueDate,
      })),
      netTotal: invoice.total - credited,
      lines: lines.map((line) => ({
        description: line.description,
        amount: line.amount,
        placementId: line.placementId,
      })),
      // Billed, then the person left. The agency has invoiced a fee it may have to credit.
      fellOffAfterBilling: lines
        .filter((line) => line.placementStatus === "fell_off")
        .map((line) => line.candidateName ?? "a candidate"),
    };
  });

  // Net of credits: a fully credited invoice is not money anyone is waiting for.
  const outstanding = rows
    .filter((row) => row.status === "issued")
    .reduce((sum, row) => sum + row.netTotal, 0);

  const overdue = rows
    .filter((row) => row.status === "issued" && row.dueDate && row.dueDate < iso)
    .reduce((sum, row) => sum + row.netTotal, 0);

  const paidThisYear = invoiceRows
    .filter((row) => row.status === "paid" && row.paidAt?.getUTCFullYear() === year)
    .reduce((sum, row) => sum + (row.paidAmount ?? row.total), 0);

  return {
    invoices: rows,
    billable: await getBillablePlacements(orgId),
    totals: { outstanding, overdue, paidThisYear },
  };
}


/** Statuses an invoice can still be edited in. */
export function isInvoiceEditable(status: string): boolean {
  return status === "draft";
}
