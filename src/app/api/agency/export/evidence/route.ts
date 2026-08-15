import { NextResponse } from "next/server";
import { and, countDistinct, eq, sql } from "drizzle-orm";
import {
  applicantProfiles,
  applicationStageTransitions,
  auditLog,
  complianceDocuments,
  creditNotes,
  db,
  invoiceLines,
  invoices,
  offers,
  placements,
} from "@/lib/db";
import { getAgencyActor } from "@/lib/agency-auth";
import { can } from "@/lib/permissions";
import { csvResponse, datedFilename, toCsv, type CsvValue } from "@/lib/csv";

/**
 * The forward horizon this pack reports document expiries over.
 *
 * Deliberately wider than the dashboard's operational "expiring soon" window, and
 * deliberately not that constant: an evaluation asks how much renewal work is coming, not
 * what needs doing this month. The row label is built from this number so the figure and
 * the words describing it cannot drift apart.
 */
const EVALUATION_HORIZON_DAYS = 90;

export const dynamic = "force-dynamic";

const count = sql<number>`count(*)`.mapWith(Number);

/**
 * GET /api/agency/export/evidence — the 評鑑 evidence summary.
 *
 * Licensed agencies (私立就業服務機構) sit a periodic MOL evaluation: a scored audit of
 * service records, fee transparency, document management and accountability. Most of the
 * evidence it asks for is data this system already captures as a side effect of doing the
 * work — placements, stage transitions, the fee/invoice chain, document expiries, the
 * audit log. This export assembles those into one dated summary sheet.
 *
 * Aggregates only, no names and no per-row amounts: the summary answers "does the agency
 * keep these records, and how completely?" — the itemised evidence behind any number here
 * is the corresponding detailed export (placements, fees, compliance), pulled on request.
 *
 * Spans commercial and compliance records, so it requires BOTH invoice:read and
 * compliance:read rather than either alone — the pack is exactly the union of the two.
 */
export async function GET() {
  const actor = await getAgencyActor("compliance:read");
  if (!actor || !can(actor.role, "invoice:read")) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }
  const orgId = actor.orgId;

  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + EVALUATION_HORIZON_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const [
    placementsByStatus,
    [transitions],
    [offersAgg],
    [feeAgg],
    [billedAgg],
    invoicesByStatus,
    [creditAgg],
    [docsAgg],
    [auditAgg],
    [consentAgg],
  ] = await Promise.all([
    db
      .select({ status: placements.status, n: count })
      .from(placements)
      .where(eq(placements.orgId, orgId))
      .groupBy(placements.status),
    db
      .select({ n: count })
      .from(applicationStageTransitions)
      .where(eq(applicationStageTransitions.orgId, orgId)),
    db.select({ n: count }).from(offers).where(eq(offers.orgId, orgId)),
    db
      .select({
        total: count,
        withFee: sql<number>`count(*) filter (where ${placements.feeAmount} is not null)`.mapWith(
          Number
        ),
      })
      .from(placements)
      .where(eq(placements.orgId, orgId)),
    // Separate joined query, NOT a correlated exists in the projection above: columns
    // interpolated into sql`` render unqualified, so the correlation silently collapses
    // into a self-comparison. (See docs/wiki/topics/drizzle-sql-gotchas.md.)
    db
      .select({ n: countDistinct(invoiceLines.placementId) })
      .from(invoiceLines)
      .innerJoin(placements, eq(invoiceLines.placementId, placements.id))
      .where(and(eq(placements.orgId, orgId), eq(invoiceLines.voided, false))),
    db
      .select({ status: invoices.status, n: count })
      .from(invoices)
      .where(eq(invoices.orgId, orgId))
      .groupBy(invoices.status),
    db.select({ n: count }).from(creditNotes).where(eq(creditNotes.orgId, orgId)),
    db
      .select({
        total: count,
        withArtifact: sql<number>`count(*) filter (where ${complianceDocuments.documentId} is not null or ${complianceDocuments.fileId} is not null)`.mapWith(
          Number
        ),
        expired: sql<number>`count(*) filter (where ${complianceDocuments.expiryDate} < ${today})`.mapWith(
          Number
        ),
        expiring90: sql<number>`count(*) filter (where ${complianceDocuments.expiryDate} >= ${today} and ${complianceDocuments.expiryDate} <= ${horizon})`.mapWith(
          Number
        ),
        noExpiry: sql<number>`count(*) filter (where ${complianceDocuments.expiryDate} is null)`.mapWith(
          Number
        ),
      })
      .from(complianceDocuments)
      .where(eq(complianceDocuments.orgId, orgId)),
    db
      .select({
        entries: count,
        actors: sql<number>`count(distinct ${auditLog.actorUserId})`.mapWith(Number),
        earliest: sql<string | null>`min(${auditLog.createdAt})::date::text`,
      })
      .from(auditLog)
      .where(eq(auditLog.orgId, orgId)),
    db
      .select({
        placedCandidates: sql<number>`count(distinct ${placements.candidateId})`.mapWith(Number),
        consented: sql<number>`count(distinct ${placements.candidateId}) filter (where ${applicantProfiles.pipaConsent} = true)`.mapWith(
          Number
        ),
      })
      .from(placements)
      .innerJoin(applicantProfiles, eq(placements.candidateId, applicantProfiles.id))
      .where(eq(placements.orgId, orgId)),
  ]);

  const rows: CsvValue[][] = [["Report", "Generated", today, ""]];
  const add = (section: string, metric: string, value: CsvValue, notes = "") =>
    rows.push([section, metric, value, notes]);

  add("Service records", "Placements — total", feeAgg.total);
  for (const s of placementsByStatus) add("Service records", `Placements — ${s.status}`, s.n);
  add(
    "Service records",
    "Pipeline stage transitions logged",
    transitions.n,
    "Append-only; each move records who and when"
  );
  add("Service records", "Offers recorded", offersAgg.n, "Terms, authoriser and response");

  add("Fee transparency", "Placements with a recorded fee", feeAgg.withFee);
  add("Fee transparency", "Placements billed via invoice", billedAgg.n);
  for (const s of invoicesByStatus) add("Fee transparency", `Invoices — ${s.status}`, s.n);
  add("Fee transparency", "Credit notes issued", creditAgg.n, "Own numbered sequence");
  add(
    "Fee transparency",
    "Worker-charged fees recorded",
    0,
    "Structural: fees attach to client invoices only; no schema path bills a candidate"
  );

  add("Document management", "Compliance documents tracked", docsAgg.total);
  add("Document management", "With stored artifact", docsAgg.withArtifact);
  add("Document management", "Expired", docsAgg.expired);
  add(
    "Document management",
    `Expiring within ${EVALUATION_HORIZON_DAYS} days`,
    docsAgg.expiring90
  );
  add("Document management", "No expiry recorded", docsAgg.noExpiry);

  add("Accountability", "Audit log entries", auditAgg.entries);
  add("Accountability", "Distinct acting users", auditAgg.actors);
  add("Accountability", "Earliest audit entry", auditAgg.earliest ?? "");
  add("Accountability", "Placed candidates", consentAgg.placedCandidates);
  add(
    "Accountability",
    "Placed candidates with PIPA consent",
    consentAgg.consented,
    "Consent recorded on the candidate profile"
  );

  const csv = toCsv(["Section", "Metric", "Value", "Notes"], rows);
  return csvResponse(datedFilename("evaluation-evidence"), csv);
}
