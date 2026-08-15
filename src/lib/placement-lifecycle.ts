import { and, eq, inArray, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  applicantProfiles,
  clients,
  complianceDocuments,
  jobOrders,
  placements,
} from "@/lib/db/schema";
import { complianceWindow } from "@/lib/compliance-window";

/** placed/started are live; completed/fell_off are history. */
export const ACTIVE_STATUSES = ["placed", "started"] as const;

export type PlacementRow = {
  id: number;
  candidateId: number;
  candidateName: string;
  clientName: string | null;
  position: string;
  status: string;
  startDate: string | null;
  probationUntil: string | null;
  guaranteeUntil: string | null;
  endDate: string | null;
  endReason: string | null;
  salary: number | null;
  feeAmount: number | null;
  /** Days until the guarantee expires. Negative once it has passed, null if not set. */
  guaranteeDaysLeft: number | null;
  inGuarantee: boolean;
  docStatus: "none" | "valid" | "expiring" | "expired";
  soonestDocExpiry: string | null;
};

export type PlacementLifecycle = {
  rows: PlacementRow[];
  totals: {
    active: number;
    inGuarantee: number;
    /** Live placements whose paperwork has expired or is about to — the legal exposure. */
    docRisk: number;
    fellOff: number;
    /** Fee still at risk of clawback, i.e. sitting inside a guarantee window. */
    feeAtRisk: number;
  };
};

function daysBetween(fromIso: string, to: Date): number {
  const from = new Date(`${fromIso}T00:00:00Z`);
  if (Number.isNaN(from.getTime())) return 0;
  return Math.round((from.getTime() - to.getTime()) / 86_400_000);
}

/**
 * The placement lifecycle: who is live, who is still inside the guarantee window, and whose
 * documents lapse while they are on a client site.
 *
 * That last join is the point of the screen. Compliance already tracked document expiry and
 * placements already tracked who was working where, but nothing connected them — so
 * "this worker's permit expires in 10 days AND we are still liable for them" was a question
 * the system could not answer, which is precisely the question that costs money.
 */
export async function getPlacementLifecycle(orgId: number): Promise<PlacementLifecycle> {
  const db = getDb();

  const rows = await db
    .select({
      id: placements.id,
      candidateId: placements.candidateId,
      candidateName: applicantProfiles.name,
      clientName: clients.name,
      position: jobOrders.title,
      status: placements.status,
      startDate: placements.startDate,
      probationUntil: placements.probationUntil,
      guaranteeUntil: placements.guaranteeUntil,
      endDate: placements.endDate,
      endReason: placements.endReason,
      salary: placements.salary,
      feeAmount: placements.feeAmount,
    })
    .from(placements)
    .innerJoin(applicantProfiles, eq(placements.candidateId, applicantProfiles.id))
    .innerJoin(jobOrders, eq(placements.jobOrderId, jobOrders.id))
    .leftJoin(clients, eq(placements.clientId, clients.id))
    .where(eq(placements.orgId, orgId));

  const ids = rows.map((r) => r.id);
  const docRows = ids.length
    ? await db
        .select({
          placementId: complianceDocuments.placementId,
          expiryDate: complianceDocuments.expiryDate,
        })
        .from(complianceDocuments)
        .where(
          and(
            inArray(complianceDocuments.placementId, ids),
            ne(complianceDocuments.status, "superseded")
          )
        )
    : [];

  const { today, cutoff: soon } = complianceWindow();

  const rank = { none: -1, valid: 0, expiring: 1, expired: 2 } as const;
  const docBy = new Map<number, { status: PlacementRow["docStatus"]; soonest: string | null }>();
  for (const d of docRows) {
    if (d.placementId == null) continue;
    let status: PlacementRow["docStatus"] = "valid";
    if (d.expiryDate) {
      const when = new Date(`${d.expiryDate}T00:00:00Z`);
      if (!Number.isNaN(when.getTime())) {
        if (when < today) status = "expired";
        else if (when <= soon) status = "expiring";
      }
    }
    const cur = docBy.get(d.placementId) ?? { status: "none" as const, soonest: null };
    docBy.set(d.placementId, {
      // worst document decides — one lapsed permit is the exposure regardless of the rest
      status: rank[status] > rank[cur.status] ? status : cur.status,
      soonest:
        d.expiryDate && (!cur.soonest || d.expiryDate < cur.soonest)
          ? d.expiryDate
          : cur.soonest,
    });
  }

  const out: PlacementRow[] = rows.map((r) => {
    const doc = docBy.get(r.id) ?? { status: "none" as const, soonest: null };
    const daysLeft = r.guaranteeUntil ? daysBetween(r.guaranteeUntil, today) : null;
    const isActive = (ACTIVE_STATUSES as readonly string[]).includes(r.status);
    return {
      ...r,
      guaranteeDaysLeft: daysLeft,
      inGuarantee: isActive && daysLeft !== null && daysLeft >= 0,
      docStatus: doc.status,
      soonestDocExpiry: doc.soonest,
    };
  });

  // soonest guarantee expiry first, so the top of the list is what needs attention
  out.sort((a, b) => {
    if (a.inGuarantee !== b.inGuarantee) return a.inGuarantee ? -1 : 1;
    const av = a.guaranteeDaysLeft ?? 9999;
    const bv = b.guaranteeDaysLeft ?? 9999;
    return av - bv;
  });

  const active = out.filter((r) => (ACTIVE_STATUSES as readonly string[]).includes(r.status));
  return {
    rows: out,
    totals: {
      active: active.length,
      inGuarantee: out.filter((r) => r.inGuarantee).length,
      docRisk: active.filter((r) => r.docStatus === "expired" || r.docStatus === "expiring")
        .length,
      fellOff: out.filter((r) => r.status === "fell_off").length,
      feeAtRisk: out
        .filter((r) => r.inGuarantee)
        .reduce((sum, r) => sum + (r.feeAmount ?? 0), 0),
    },
  };
}
