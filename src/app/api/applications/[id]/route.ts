import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getMember, canMoveStage, isOrgManager } from "@/lib/ats-auth";
import { logAudit } from "@/lib/audit";
import { applications } from "@/lib/db/schema";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/pipeline-types";

function isStage(v: unknown): v is PipelineStage {
  return typeof v === "string" && (PIPELINE_STAGES as readonly string[]).includes(v);
}

/**
 * PATCH /api/applications/:id  { stage }
 * Moves a candidate to a new ATS pipeline stage.
 *
 * Authorization (org + RBAC):
 *  - must be an org member with a stage-move role;
 *  - tenant isolation: the application must belong to the member's org;
 *  - row ownership: non-managers may only move their own recruiter's applications
 *    (org managers — admin / account_manager, e.g. the agency — may move any).
 * Every move writes an append-only audit_log entry.
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

  const stage = (body as { stage?: unknown })?.stage;
  if (!isStage(stage)) {
    return NextResponse.json(
      { error: `stage must be one of: ${PIPELINE_STAGES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!canMoveStage(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();

  const [application] = await db
    .select({
      id: applications.id,
      recruiterId: applications.recruiterId,
      orgId: applications.orgId,
      stage: applications.stage,
    })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Tenant isolation — never touch another org's data.
  if (application.orgId !== null && application.orgId !== member.orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Row ownership — non-managers only move their own recruiter's applications.
  if (!isOrgManager(member.role) && application.recruiterId !== member.recruiterId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [updated] = await db
    .update(applications)
    .set({ stage, stageUpdatedAt: new Date() })
    .where(eq(applications.id, applicationId))
    .returning({ id: applications.id, stage: applications.stage });
  if (!updated) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await logAudit({
    orgId: member.orgId,
    actorUserId: member.userId,
    action: "move_stage",
    entityType: "application",
    entityId: application.id,
    fieldNames: ["stage"],
    metadata: { from: application.stage, to: stage },
    ip,
  });

  return NextResponse.json({ ok: true, id: updated.id, stage: updated.stage });
}
