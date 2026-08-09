import { and, asc, eq, isNull, sql } from "drizzle-orm";
import {
  applicantProfiles,
  clients,
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
export async function nextInvoiceNumber(orgId: number, year: number): Promise<string> {
  const prefix = `INV-${year}-`;
  const rows = await db
    .select({ number: invoices.number })
    .from(invoices)
    .where(and(eq(invoices.orgId, orgId), sql`${invoices.number} LIKE ${prefix + "%"}`));

  const highest = rows.reduce((max, row) => {
    const parsed = Number.parseInt(row.number.slice(prefix.length), 10);
    return Number.isFinite(parsed) && parsed > max ? parsed : max;
  }, 0);

  return `${prefix}${String(highest + 1).padStart(4, "0")}`;
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
    .where(and(eq(invoices.orgId, orgId), eq(invoiceLines.voided, false)));

  const iso = today.toISOString().slice(0, 10);
  const year = today.getUTCFullYear();

  const rows: InvoiceRow[] = invoiceRows.map((invoice) => {
    const lines = lineRows.filter((line) => line.invoiceId === invoice.id);
    return {
      ...invoice,
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

  const outstanding = rows
    .filter((row) => row.status === "issued")
    .reduce((sum, row) => sum + row.total, 0);

  const overdue = rows
    .filter((row) => row.status === "issued" && row.dueDate && row.dueDate < iso)
    .reduce((sum, row) => sum + row.total, 0);

  const paidThisYear = invoiceRows
    .filter((row) => row.status === "paid" && row.paidAt?.getUTCFullYear() === year)
    .reduce((sum, row) => sum + (row.paidAmount ?? row.total), 0);

  return {
    invoices: rows,
    billable: await getBillablePlacements(orgId),
    totals: { outstanding, overdue, paidThisYear },
  };
}

/** Recompute and persist an invoice's stored totals from its live lines. */
export async function refreshInvoiceTotals(invoiceId: number): Promise<InvoiceTotals> {
  const [invoice] = await db
    .select({ taxRateBp: invoices.taxRateBp })
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  const lines = await db
    .select({ amount: invoiceLines.amount })
    .from(invoiceLines)
    .where(and(eq(invoiceLines.invoiceId, invoiceId), eq(invoiceLines.voided, false)));

  const totals = computeTotals(
    lines.map((line) => line.amount),
    invoice?.taxRateBp ?? DEFAULT_TAX_RATE_BP
  );

  await db.update(invoices).set(totals).where(eq(invoices.id, invoiceId));
  return totals;
}

/** Statuses an invoice can still be edited in. */
export function isInvoiceEditable(status: string): boolean {
  return status === "draft";
}
