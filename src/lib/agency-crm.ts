import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getRecruiterFromSession } from "@/lib/auth";
import {
  clients,
  jobOrders,
  submissions,
  placements,
  recruiters,
  pipelineStages,
} from "@/lib/db/schema";

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

  return {
    clients: clientsOut,
    totals: {
      clients: clientRows.length,
      jobOrders: orderRows.length,
      submissions: subRows.length,
      placements: placeRows.length,
    },
    byStage: [...stageCounts.entries()].map(([kind, count]) => ({ kind, count })),
  };
}
