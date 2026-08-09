import { and, asc, count, eq, inArray, isNull } from "drizzle-orm";
import {
  applications,
  db,
  pipelineStages,
  pipelineTemplates,
  submissions,
} from "@/lib/db";

/**
 * Reading and changing the shape of an org's hiring pipeline.
 *
 * `pipeline_stages` was read in four places and written in none, so the process was
 * whatever the seed script inserted. The rules below are what make it safe to change
 * while candidates are moving through it.
 */

export type StageRow = {
  id: number;
  name: string;
  stageKind: string;
  sortOrder: number;
  /** Candidates currently sitting in this stage — what makes retiring it unsafe. */
  occupancy: number;
};

/** The org's default template, created on demand so a new org is never stageless. */
export async function getDefaultTemplateId(orgId: number): Promise<number> {
  const [existing] = await db
    .select({ id: pipelineTemplates.id })
    .from(pipelineTemplates)
    .where(
      and(eq(pipelineTemplates.orgId, orgId), eq(pipelineTemplates.isDefault, true))
    )
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(pipelineTemplates)
    .values({ orgId, name: "Standard placement", isDefault: true })
    .returning({ id: pipelineTemplates.id });
  return created.id;
}

/** Active stages in board order, each with the number of candidates standing in it. */
export async function listStages(orgId: number): Promise<StageRow[]> {
  const templateId = await getDefaultTemplateId(orgId);

  const rows = await db
    .select({
      id: pipelineStages.id,
      name: pipelineStages.name,
      stageKind: pipelineStages.stageKind,
      sortOrder: pipelineStages.sortOrder,
    })
    .from(pipelineStages)
    .where(
      and(eq(pipelineStages.templateId, templateId), isNull(pipelineStages.archivedAt))
    )
    .orderBy(asc(pipelineStages.sortOrder));

  const occupancy = await stageOccupancy(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, occupancy: occupancy.get(r.id) ?? 0 }));
}

/**
 * How many live records point at each stage.
 *
 * Both tables count: an application is a candidate on the board, and a submission is one
 * already sent to a client. Retiring a stage holding either would make those rows
 * unreachable in the UI while still existing in the database.
 */
export async function stageOccupancy(stageIds: number[]): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  if (stageIds.length === 0) return result;

  // Scoped to the stages asked about rather than grouping the whole table: these are the
  // two largest tables in the product and the caller only ever needs one template's worth.
  const [apps, subs] = await Promise.all([
    db
      .select({ stageId: applications.stageId, n: count() })
      .from(applications)
      .where(inArray(applications.stageId, stageIds))
      .groupBy(applications.stageId),
    db
      .select({ stageId: submissions.stageId, n: count() })
      .from(submissions)
      .where(inArray(submissions.stageId, stageIds))
      .groupBy(submissions.stageId),
  ]);

  for (const row of [...apps, ...subs]) {
    if (row.stageId == null) continue;
    result.set(row.stageId, (result.get(row.stageId) ?? 0) + Number(row.n));
  }
  return result;
}

/**
 * Confirm a stage belongs to the caller's org before touching it.
 *
 * Stage ids are small integers and arrive from the client, so without this a member of one
 * agency could rename or retire another agency's stages.
 */
export async function findOwnedStage(
  stageId: number,
  orgId: number
): Promise<{ id: number; templateId: number; archivedAt: Date | null } | null> {
  const [row] = await db
    .select({
      id: pipelineStages.id,
      templateId: pipelineStages.templateId,
      archivedAt: pipelineStages.archivedAt,
    })
    .from(pipelineStages)
    .innerJoin(
      pipelineTemplates,
      eq(pipelineStages.templateId, pipelineTemplates.id)
    )
    .where(and(eq(pipelineStages.id, stageId), eq(pipelineTemplates.orgId, orgId)))
    .limit(1);
  return row ?? null;
}

/** Count of active stages, used to refuse emptying the board entirely. */
export async function activeStageCount(templateId: number): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(pipelineStages)
    .where(
      and(eq(pipelineStages.templateId, templateId), isNull(pipelineStages.archivedAt))
    );
  return Number(row?.n ?? 0);
}

/** Next position at the end of the board. */
export async function nextSortOrder(templateId: number): Promise<number> {
  const rows = await db
    .select({ sortOrder: pipelineStages.sortOrder })
    .from(pipelineStages)
    .where(eq(pipelineStages.templateId, templateId));
  return rows.reduce((max, r) => Math.max(max, r.sortOrder + 1), 0);
}

/** Stage ids that may legitimately appear in a reorder, i.e. active ones in this template. */
export async function activeStageIds(templateId: number): Promise<number[]> {
  const rows = await db
    .select({ id: pipelineStages.id })
    .from(pipelineStages)
    .where(
      and(eq(pipelineStages.templateId, templateId), isNull(pipelineStages.archivedAt))
    );
  return rows.map((r) => r.id);
}
