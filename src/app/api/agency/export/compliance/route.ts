import { NextResponse } from "next/server";
import { and, asc, eq, ne } from "drizzle-orm";
import { applicantProfiles, complianceDocuments, db, users } from "@/lib/db";
import { getAgencyActor } from "@/lib/agency-auth";
import { csvResponse, datedFilename, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

/** Matches the dashboard's definition of "needs attention". */
const EXPIRING_SOON_DAYS = 60;

/**
 * GET /api/agency/export/compliance — every tracked document, as a spreadsheet.
 *
 * Deliberately not the dashboard's `attention` list, which holds only the expired and
 * expiring. An inspection asks to see the whole file, including the documents that are
 * fine; handing over only the problems answers a question nobody asked.
 *
 * Superseded revisions are excluded — they are history, and including them would make the
 * same person appear to hold two conflicting permits.
 */
export async function GET() {
  const actor = await getAgencyActor("compliance:read");
  if (!actor) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: complianceDocuments.id,
      candidateName: applicantProfiles.name,
      docType: complianceDocuments.docType,
      docNumber: complianceDocuments.docNumber,
      issuingAuthority: complianceDocuments.issuingAuthority,
      issueDate: complianceDocuments.issueDate,
      expiryDate: complianceDocuments.expiryDate,
      status: complianceDocuments.status,
      placementId: complianceDocuments.placementId,
      verifiedAt: complianceDocuments.verifiedAt,
      verifiedBy: users.name,
      notes: complianceDocuments.notes,
    })
    .from(complianceDocuments)
    .innerJoin(
      applicantProfiles,
      eq(complianceDocuments.candidateId, applicantProfiles.id)
    )
    .leftJoin(users, eq(complianceDocuments.verifiedByUserId, users.id))
    .where(
      and(
        eq(complianceDocuments.orgId, actor.orgId),
        ne(complianceDocuments.status, "superseded")
      )
    )
    // soonest expiry first: the order an auditor reads in
    .orderBy(asc(complianceDocuments.expiryDate));

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  /** Recomputed here rather than trusted from the column, which is only as fresh as the last write. */
  const currentStatus = (expiry: string | null): string => {
    if (!expiry) return "no expiry recorded";
    const date = new Date(`${expiry}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return "unknown";
    const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
    if (days < 0) return "expired";
    if (days <= EXPIRING_SOON_DAYS) return "expiring soon";
    return "valid";
  };

  const daysLeft = (expiry: string | null): number | null => {
    if (!expiry) return null;
    const date = new Date(`${expiry}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return null;
    return Math.round((date.getTime() - today.getTime()) / 86_400_000);
  };

  const csv = toCsv(
    [
      "Document ID",
      "Candidate",
      "Document Type",
      "Document Number",
      "Issuing Authority",
      "Issue Date",
      "Expiry Date",
      "Days Until Expiry",
      "Current Status",
      "Linked Placement",
      "Verified By",
      "Verified At",
      "Notes",
    ],
    rows.map((d) => [
      d.id,
      d.candidateName,
      d.docType,
      d.docNumber,
      d.issuingAuthority,
      d.issueDate,
      d.expiryDate,
      daysLeft(d.expiryDate),
      currentStatus(d.expiryDate),
      d.placementId,
      d.verifiedBy,
      d.verifiedAt,
      d.notes,
    ])
  );

  return csvResponse(datedFilename("compliance"), csv);
}
