import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, pipelineStages } from "@/lib/db";
import { requireAgency } from "@/lib/agency-auth";
import {
  activeStageCount,
  findOwnedStage,
  stageOccupancy,
} from "@/lib/pipeline-config";
import { parseJsonBody } from "@/lib/validation";
import { updateStageSchema } from "@/lib/validation-agency";

export const dynamic = "force-dynamic";

/** PATCH — rename a stage, or change what kind of step it represents. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAgency("pipeline:configure");
  if (!gate.ok) return gate.response;

  const stageId = Number((await params).id);
  if (!Number.isInteger(stageId)) {
    return NextResponse.json({ error: "Invalid stage id" }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, updateStageSchema);
  if (!parsed.ok) return parsed.response;

  const stage = await findOwnedStage(stageId, gate.actor.orgId);
  if (!stage || stage.archivedAt) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  await db
    .update(pipelineStages)
    .set({
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.stageKind !== undefined
        ? { stageKind: parsed.data.stageKind }
        : {}),
    })
    .where(eq(pipelineStages.id, stageId));

  return NextResponse.json({ ok: true });
}

/**
 * DELETE — retire a stage.
 *
 * This archives rather than deletes. `application_stage_transitions` is the append-only
 * record every funnel and time-in-stage report is built from and it references stage ids;
 * destroying a stage anyone ever moved through would take that history with it.
 *
 * Refused while candidates are still standing in the stage — archiving it would drop them
 * off the board while leaving the rows in the database, which is the kind of silent data
 * loss people discover weeks later.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAgency("pipeline:configure");
  if (!gate.ok) return gate.response;

  const stageId = Number((await params).id);
  if (!Number.isInteger(stageId)) {
    return NextResponse.json({ error: "Invalid stage id" }, { status: 400 });
  }

  const stage = await findOwnedStage(stageId, gate.actor.orgId);
  if (!stage || stage.archivedAt) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  const occupancy = (await stageOccupancy([stageId])).get(stageId) ?? 0;
  if (occupancy > 0) {
    return NextResponse.json(
      {
        error: `Move the ${occupancy} candidate${occupancy === 1 ? "" : "s"} in this stage somewhere else first.`,
        occupancy,
      },
      { status: 409 }
    );
  }

  // A board with no columns renders as nothing and cannot be recovered from the UI.
  if ((await activeStageCount(stage.templateId)) <= 1) {
    return NextResponse.json(
      { error: "A pipeline needs at least one stage." },
      { status: 409 }
    );
  }

  await db
    .update(pipelineStages)
    .set({ archivedAt: new Date() })
    .where(eq(pipelineStages.id, stageId));

  return NextResponse.json({ ok: true });
}
