import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getMember, canMoveStage, isOrgManager } from "@/lib/ats-auth";
import { logAudit } from "@/lib/audit";
import {
  applications,
  pipelineStages,
  pipelineTemplates,
  applicationStageTransitions,
} from "@/lib/db/schema";

/**
 * PATCH /api/applications/:id  { stageId }
 * Moves a candidate to a new pipeline stage.
 *
 * Authorization (org + RBAC):
 *  - must be an org member with a stage-move role;
 *  - the target stage must belong to the member's org (a template stage);
 *  - tenant isolation: the application must belong to the member's org;
 *  - row ownership: non-managers may only move their own recruiter's applications.
 * Persists as an append-only stage transition (funnel/time-in-stage source of
 * truth) + an audit_log entry.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getMember();
  if (!member) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isInteger(applicationId)) {
    return NextResponse.json({ error: "Invalid application id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const stageId = Number((body as { stageId?: unknown })?.stageId);
  if (!Number.isInteger(stageId)) {
    return NextResponse.json({ error: "stageId must be an integer" }, { status: 400 });
  }

  if (!canMoveStage(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();

  // Target stage must be a real stage in THIS org's pipeline.
  const [targetStage] = await db
    .select({ id: pipelineStages.id, orgId: pipelineTemplates.orgId })
    .from(pipelineStages)
    .innerJoin(
      pipelineTemplates,
      eq(pipelineStages.templateId, pipelineTemplates.id)
    )
    .where(eq(pipelineStages.id, stageId))
    .limit(1);
  if (!targetStage || targetStage.orgId !== member.orgId) {
    return NextResponse.json({ error: "Invalid stage for this org" }, { status: 400 });
  }

  const [application] = await db
    .select({
      id: applications.id,
      recruiterId: applications.recruiterId,
      orgId: applications.orgId,
      stageId: applications.stageId,
    })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Tenant isolation + row ownership.
  if (application.orgId !== null && application.orgId !== member.orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isOrgManager(member.role) && application.recruiterId !== member.recruiterId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // No-op move — nothing to persist.
  if (application.stageId === stageId) {
    return NextResponse.json({ ok: true, id: applicationId, stageId });
  }

  // Update + append-only transition, atomically.
  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({ stageId, stageUpdatedAt: new Date() })
      .where(eq(applications.id, applicationId));
    await tx.insert(applicationStageTransitions).values({
      orgId: member.orgId,
      applicationId,
      fromStageId: application.stageId ?? null,
      toStageId: stageId,
      movedByUserId: member.userId,
    });
  });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await logAudit({
    orgId: member.orgId,
    actorUserId: member.userId,
    action: "move_stage",
    entityType: "application",
    entityId: applicationId,
    fieldNames: ["stage_id"],
    metadata: { from: application.stageId, to: stageId },
    ip,
  });

  return NextResponse.json({ ok: true, id: applicationId, stageId });
}
