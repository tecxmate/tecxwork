import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getRecruiterFromSession } from "@/lib/auth";
import {
  clients,
  jobOrders,
  submissions,
  placements,
  recruiters,
  pipelineStages,
  complianceDocuments,
  applicantProfiles,
} from "@/lib/db/schema";
import { complianceWindow } from "@/lib/compliance-window";

export type ComplianceStatus = "expired" | "expiring_soon" | "valid";

export type ComplianceDocRow = {
  id: number;
  candidateId: number;
  candidateName: string;
  docType: string;
  docNumber: string | null;
  issuingAuthority: string | null;
  expiryDate: string | null;
  status: ComplianceStatus;
  /** The stored scan, when one has been collected. */
  documentId: number | null;
};

export type CrmClientRow = {
  id: number;
  name: string;
  industry: string;
  jobOrders: number;
  submissions: number;
  placements: number;
};

export type AgencyCrm = {
  clients: CrmClientRow[];
  totals: { clients: number; jobOrders: number; submissions: number; placements: number };
  byStage: { kind: string; count: number }[];
  compliance: {
    total: number;
    expired: number;
    expiringSoon: number;
    attention: ComplianceDocRow[]; // expired + expiring, soonest first
  };
};

/**
 * Agency CRM roll-up (clients → job orders → submissions → placements), scoped
 * to the logged-in AGENCY recruiter's org. Returns null for non-agency
 * recruiters (the caller redirects them away).
 */
export async function getAgencyCrm(): Promise<AgencyCrm | null> {
  const auth = await getRecruiterFromSession();
  if (!auth) return null;

  const db = getDb();
  const [me] = await db
    .select({ clientKind: recruiters.clientKind, orgId: recruiters.orgId })
    .from(recruiters)
    .where(eq(recruiters.id, auth.recruiterId))
    .limit(1);
  if (!me || me.clientKind !== "agency" || me.orgId == null) return null;
  const orgId = me.orgId;

  const [clientRows, orderRows, subRows, placeRows] = await Promise.all([
    db
      .select({ id: clients.id, name: clients.name, industry: clients.industry })
      .from(clients)
      .where(eq(clients.orgId, orgId)),
    db
      .select({ id: jobOrders.id, clientId: jobOrders.clientId })
      .from(jobOrders)
      .where(eq(jobOrders.orgId, orgId)),
    db
      .select({
        id: submissions.id,
        jobOrderId: submissions.jobOrderId,
        stageKind: pipelineStages.stageKind,
      })
      .from(submissions)
      .leftJoin(pipelineStages, eq(submissions.stageId, pipelineStages.id))
      .where(eq(submissions.orgId, orgId)),
    db
      .select({ id: placements.id, clientId: placements.clientId })
      .from(placements)
      .where(eq(placements.orgId, orgId)),
  ]);

  const clientByOrder = new Map(orderRows.map((o) => [o.id, o.clientId]));
  const ordersByClient = new Map<number, number>();
  for (const o of orderRows) {
    if (o.clientId != null)
      ordersByClient.set(o.clientId, (ordersByClient.get(o.clientId) ?? 0) + 1);
  }
  const subsByClient = new Map<number, number>();
  const stageCounts = new Map<string, number>();
  for (const s of subRows) {
    const cid = clientByOrder.get(s.jobOrderId);
    if (cid != null) subsByClient.set(cid, (subsByClient.get(cid) ?? 0) + 1);
    if (s.stageKind) stageCounts.set(s.stageKind, (stageCounts.get(s.stageKind) ?? 0) + 1);
  }
  const placeByClient = new Map<number, number>();
  for (const p of placeRows) {
    if (p.clientId != null)
      placeByClient.set(p.clientId, (placeByClient.get(p.clientId) ?? 0) + 1);
  }

  const clientsOut: CrmClientRow[] = clientRows
    .map((c) => ({
      id: c.id,
      name: c.name,
      industry: c.industry,
      jobOrders: ordersByClient.get(c.id) ?? 0,
      submissions: subsByClient.get(c.id) ?? 0,
      placements: placeByClient.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.submissions - a.submissions || b.jobOrders - a.jobOrders);

  // Compliance documents — expiry status computed live (no cron).
  const docRows = await db
    .select({
      id: complianceDocuments.id,
      candidateId: complianceDocuments.candidateId,
      candidateName: applicantProfiles.name,
      docType: complianceDocuments.docType,
      docNumber: complianceDocuments.docNumber,
      issuingAuthority: complianceDocuments.issuingAuthority,
      expiryDate: complianceDocuments.expiryDate,
      documentId: complianceDocuments.documentId,
    })
    .from(complianceDocuments)
    .innerJoin(
      applicantProfiles,
      eq(complianceDocuments.candidateId, applicantProfiles.id)
    )
    .where(
      and(
        eq(complianceDocuments.orgId, orgId),
        ne(complianceDocuments.status, "superseded")
      )
    );

  const { today, cutoff: soonCutoff } = complianceWindow();
  const docStatus = (expiry: string | null): ComplianceStatus => {
    if (!expiry) return "valid";
    const d = new Date(`${expiry}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return "valid";
    if (d < today) return "expired";
    if (d <= soonCutoff) return "expiring_soon";
    return "valid";
  };
  const docsWithStatus: ComplianceDocRow[] = docRows.map((r) => ({
    id: r.id,
    candidateId: r.candidateId,
    candidateName: r.candidateName,
    docType: r.docType,
    docNumber: r.docNumber,
    issuingAuthority: r.issuingAuthority,
    expiryDate: r.expiryDate,
    status: docStatus(r.expiryDate),
    documentId: r.documentId,
  }));
  const attention = docsWithStatus
    .filter((d) => d.status !== "valid")
    .sort((a, b) => (a.expiryDate ?? "").localeCompare(b.expiryDate ?? ""));

  return {
    clients: clientsOut,
    totals: {
      clients: clientRows.length,
      jobOrders: orderRows.length,
      submissions: subRows.length,
      placements: placeRows.length,
    },
    byStage: [...stageCounts.entries()].map(([kind, count]) => ({ kind, count })),
    compliance: {
      total: docsWithStatus.length,
      expired: docsWithStatus.filter((d) => d.status === "expired").length,
      expiringSoon: docsWithStatus.filter((d) => d.status === "expiring_soon").length,
      attention,
    },
  };
}
