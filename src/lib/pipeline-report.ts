import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getRecruiterFromSession } from "@/lib/auth";
import {
  recruiters,
  pipelineTemplates,
  pipelineStages,
  applications,
  applicantProfiles,
  jobOpenings,
  applicationStageTransitions,
  placements,
} from "@/lib/db/schema";
import type { StageKind } from "@/lib/pipeline-types";

export type FunnelRow = {
  stageKind: StageKind;
  name: string;
  count: number;
  avgDays: number;
};

export type AgingRow = {
  candidateName: string;
  jobTitle: string;
  stageKind: StageKind;
  days: number;
};

export type PipelineReport = {
  metrics: {
    candidates: number;
    placements: number;
    placementRate: number; // 0..1
    avgDaysInStage: number;
  };
  funnel: FunnelRow[];
  aging: AgingRow[];
};

const TERMINAL: ReadonlySet<string> = new Set(["placed", "rejected", "started", "onboarding"]);

/**
 * Agency pipeline analytics: current funnel distribution, average days in each
 * stage, placement metrics, and an aging list of candidates stuck longest in an
 * active stage. Derives "days in stage" from the append-only transition log.
 * Agency-only (returns null otherwise).
 */
export async function getPipelineReport(): Promise<PipelineReport | null> {
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

  const [stageRows, apps, trans, placeRows] = await Promise.all([
    db
      .select({
        id: pipelineStages.id,
        name: pipelineStages.name,
        stageKind: pipelineStages.stageKind,
        sortOrder: pipelineStages.sortOrder,
      })
      .from(pipelineStages)
      .innerJoin(pipelineTemplates, eq(pipelineStages.templateId, pipelineTemplates.id))
      .where(
        and(
          eq(pipelineTemplates.orgId, orgId),
          eq(pipelineTemplates.isDefault, true),
          isNull(pipelineStages.archivedAt)
        )
      )
      .orderBy(pipelineStages.sortOrder),
    db
      .select({
        id: applications.id,
        stageId: applications.stageId,
        createdAt: applications.createdAt,
        candidateName: applicantProfiles.name,
        jobTitle: jobOpenings.title,
      })
      .from(applications)
      .innerJoin(applicantProfiles, eq(applications.applicantId, applicantProfiles.id))
      .innerJoin(jobOpenings, eq(applications.jobOpeningId, jobOpenings.id))
      .where(eq(applications.orgId, orgId)),
    db
      .select({
        applicationId: applicationStageTransitions.applicationId,
        toStageId: applicationStageTransitions.toStageId,
        movedAt: applicationStageTransitions.movedAt,
      })
      .from(applicationStageTransitions)
      .where(eq(applicationStageTransitions.orgId, orgId)),
    db.select({ id: placements.id }).from(placements).where(eq(placements.orgId, orgId)),
  ]);

  const now = Date.now();
  const DAY = 86_400_000;

  // Entry time into each app's CURRENT stage = latest transition into that stage.
  const enteredAt = new Map<number, number>();
  for (const t of trans) {
    const app = apps.find((a) => a.id === t.applicationId);
    if (!app || t.toStageId !== app.stageId || !t.movedAt) continue;
    const ms = new Date(t.movedAt).getTime();
    const prev = enteredAt.get(t.applicationId);
    if (prev === undefined || ms > prev) enteredAt.set(t.applicationId, ms);
  }
  const daysInStage = (app: (typeof apps)[number]): number => {
    const entered = enteredAt.get(app.id) ?? new Date(app.createdAt).getTime();
    return Math.max(0, Math.floor((now - entered) / DAY));
  };

  // Funnel: count + avg days per stage.
  const byStage = new Map<number, { count: number; totalDays: number }>();
  for (const a of apps) {
    if (a.stageId == null) continue;
    const cur = byStage.get(a.stageId) ?? { count: 0, totalDays: 0 };
    cur.count += 1;
    cur.totalDays += daysInStage(a);
    byStage.set(a.stageId, cur);
  }
  const funnel: FunnelRow[] = stageRows.map((s) => {
    const agg = byStage.get(s.id) ?? { count: 0, totalDays: 0 };
    return {
      stageKind: s.stageKind as StageKind,
      name: s.name,
      count: agg.count,
      avgDays: agg.count ? Math.round(agg.totalDays / agg.count) : 0,
    };
  });

  const stageKindById = new Map(stageRows.map((s) => [s.id, s.stageKind as StageKind]));
  const aging: AgingRow[] = apps
    .filter((a) => {
      const k = a.stageId != null ? stageKindById.get(a.stageId) : undefined;
      return k != null && !TERMINAL.has(k);
    })
    .map((a) => ({
      candidateName: a.candidateName,
      jobTitle: a.jobTitle,
      stageKind: (a.stageId != null ? stageKindById.get(a.stageId)! : "sourced") as StageKind,
      days: daysInStage(a),
    }))
    .sort((x, y) => y.days - x.days)
    .slice(0, 10);

  const totalDays = apps.reduce((sum, a) => sum + daysInStage(a), 0);
  return {
    metrics: {
      candidates: apps.length,
      placements: placeRows.length,
      placementRate: apps.length ? placeRows.length / apps.length : 0,
      avgDaysInStage: apps.length ? Math.round(totalDays / apps.length) : 0,
    },
    funnel,
    aging,
  };
}
