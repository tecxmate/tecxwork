import { NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import {
  applicantProfiles,
  clients,
  creditNotes,
  db,
  invoiceLines,
  invoices,
  jobOrders,
  placements,
} from "@/lib/db";
import { getAgencyActor } from "@/lib/agency-auth";
import { describeFeeRate, FEE_BASES, type FeeBasis } from "@/lib/billing";
import { csvResponse, datedFilename, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

/**
 * GET /api/agency/export/fees — the Employer-Pays fee trail, per placement.
 *
 * RBA-member brands audit their tier-1 suppliers against the Employer Pays Principle:
 * zero recruitment fees charged to the worker, with the employer-side money reconciled
 * to documents. This export is that trail. Each row is one placement: who was placed,
 * what the employer was charged, and the invoice/credit chain behind the number.
 *
 * Two constant columns carry the structural facts rather than per-row judgement:
 *
 *  - "Fee Charged To" is always `employer (client)`: fees in this system attach to a
 *    client company — `invoice_lines` reaches money only through a client invoice, and
 *    no schema path exists from a fee to a candidate.
 *  - "Worker-Charged Fees Recorded" is always 0, and it is worded "recorded" on
 *    purpose: the export proves the system holds no worker-charged fee, not that no
 *    cash ever moved outside it. An auditor should read it as exactly that.
 *
 * Fee In Months Of Salary is the number RBA auditors actually benchmark (fees are
 * measured in months of wages), so it is computed here rather than left to a
 * spreadsheet formula.
 */
export async function GET() {
  const actor = await getAgencyActor("invoice:read");
  if (!actor) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }

  const rows = await db
    .select({
      placementId: placements.id,
      status: placements.status,
      startDate: placements.startDate,
      salary: placements.salary,
      feeAmount: placements.feeAmount,
      candidateName: applicantProfiles.name,
      nationality: applicantProfiles.nationality,
      clientName: clients.name,
      feeBasis: clients.feeBasis,
      feeValue: clients.feeValue,
      position: jobOrders.title,
      invoiceId: invoices.id,
      invoiceNumber: invoices.number,
      invoiceStatus: invoices.status,
      invoiceIssueDate: invoices.issueDate,
      invoiceTotal: invoices.total,
      paidAt: invoices.paidAt,
      paidAmount: invoices.paidAmount,
    })
    .from(placements)
    .innerJoin(applicantProfiles, eq(placements.candidateId, applicantProfiles.id))
    .innerJoin(jobOrders, eq(placements.jobOrderId, jobOrders.id))
    .leftJoin(clients, eq(placements.clientId, clients.id))
    // Only the live line: a voided line's fee is either re-raised (a new live line) or
    // genuinely unbilled, and either way the voided one is not part of the money trail.
    .leftJoin(
      invoiceLines,
      and(eq(invoiceLines.placementId, placements.id), eq(invoiceLines.voided, false))
    )
    .leftJoin(invoices, eq(invoiceLines.invoiceId, invoices.id))
    .where(eq(placements.orgId, actor.orgId))
    .orderBy(asc(placements.id));

  // Credit totals per invoice, grouped separately. NOT a correlated subquery in the
  // projection: a column interpolated into a sql`` fragment renders as an UNQUALIFIED
  // identifier, so `${creditNotes.invoiceId} = ${invoices.id}` becomes
  // `"invoice_id" = "id"` — both resolving inside credit_notes, silently uncorrelated.
  // (See docs/wiki/topics/drizzle-sql-gotchas.md.)
  const creditRows = await db
    .select({
      invoiceId: creditNotes.invoiceId,
      total: sql<number>`sum(${creditNotes.total})`.mapWith(Number),
    })
    .from(creditNotes)
    .where(eq(creditNotes.orgId, actor.orgId))
    .groupBy(creditNotes.invoiceId);
  const creditedByInvoice = new Map(creditRows.map((c) => [c.invoiceId, c.total]));

  const csv = toCsv(
    [
      "Placement ID",
      "Candidate",
      "Nationality",
      "Client",
      "Position",
      "Placement Status",
      "Start Date",
      "Monthly Salary",
      "Placement Fee",
      "Fee In Months Of Salary",
      "Client Agreed Rate",
      "Fee Charged To",
      "Worker-Charged Fees Recorded",
      "Invoice Number",
      "Invoice Status",
      "Invoice Issue Date",
      "Invoice Total (incl. tax)",
      "Paid At",
      "Paid Amount",
      "Credited Total",
      "Net Billed",
    ],
    rows.map((r) => {
      const isKnownBasis = FEE_BASES.includes(r.feeBasis as FeeBasis);
      const rate =
        isKnownBasis && r.feeValue
          ? describeFeeRate({ basis: r.feeBasis as FeeBasis, value: r.feeValue })
          : null;
      const feeMonths =
        r.feeAmount != null && r.salary ? Math.round((r.feeAmount / r.salary) * 100) / 100 : null;
      const credited = r.invoiceId != null ? (creditedByInvoice.get(r.invoiceId) ?? 0) : null;
      return [
        r.placementId,
        r.candidateName,
        r.nationality,
        r.clientName,
        r.position,
        r.status,
        r.startDate,
        r.salary,
        r.feeAmount,
        feeMonths,
        rate,
        "employer (client)",
        0,
        r.invoiceNumber,
        r.invoiceStatus,
        r.invoiceIssueDate,
        r.invoiceTotal,
        r.paidAt,
        r.paidAmount,
        // Credit columns are invoice-level: a credit note attaches to the invoice, and
        // pretending it can be attributed to one line would invent precision.
        credited,
        r.invoiceTotal != null && credited != null ? r.invoiceTotal - credited : null,
      ];
    })
  );

  return csvResponse(datedFilename("employer-pays-fees"), csv);
}
