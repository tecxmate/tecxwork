import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, pipelineStages } from "@/lib/db";
import { requireAgency } from "@/lib/agency-auth";
import {
  activeStageIds,
  getDefaultTemplateId,
  listStages,
  nextSortOrder,
} from "@/lib/pipeline-config";
import { parseJsonBody } from "@/lib/validation";
import { createStageSchema, reorderStagesSchema } from "@/lib/validation-agency";

export const dynamic = "force-dynamic";

/** GET — the org's stages in board order, with how many candidates stand in each. */
export async function GET() {
  const gate = await requireAgency("pipeline:configure");
  if (!gate.ok) return gate.response;

  return NextResponse.json({ stages: await listStages(gate.actor.orgId) });
}

/** POST — add a stage to the end of the board. */
export async function POST(req: NextRequest) {
  const gate = await requireAgency("pipeline:configure");
  if (!gate.ok) return gate.response;

  const parsed = await parseJsonBody(req, createStageSchema);
  if (!parsed.ok) return parsed.response;

  const templateId = await getDefaultTemplateId(gate.actor.orgId);
  const [created] = await db
    .insert(pipelineStages)
    .values({
      templateId,
      name: parsed.data.name,
      stageKind: parsed.data.stageKind,
      sortOrder: await nextSortOrder(templateId),
    })
    .returning({ id: pipelineStages.id });

  return NextResponse.json({ stage: { id: created.id } }, { status: 201 });
}

/**
 * PATCH — reorder the board.
 *
 * The request must name every active stage exactly once. A partial list would leave the
 * unnamed stages at whatever position they held, which for a drag-and-drop board means the
 * order the user sees afterwards would not be the order they arranged.
 */
export async function PATCH(req: NextRequest) {
  const gate = await requireAgency("pipeline:configure");
  if (!gate.ok) return gate.response;

  const parsed = await parseJsonBody(req, reorderStagesSchema);
  if (!parsed.ok) return parsed.response;
  const { order } = parsed.data;

  const templateId = await getDefaultTemplateId(gate.actor.orgId);
  const owned = await activeStageIds(templateId);

  const sameSet =
    order.length === owned.length &&
    new Set(order).size === order.length &&
    order.every((id) => owned.includes(id));

  if (!sameSet) {
    // Also the tenant check: an id from another org can never be in `owned`.
    return NextResponse.json(
      { error: "Order must list each of this pipeline's stages exactly once." },
      { status: 400 }
    );
  }

  // One statement per stage, inside a transaction: a half-applied reorder would leave the
  // board in an order nobody chose.
  await db.transaction(async (tx) => {
    for (const [index, id] of order.entries()) {
      await tx
        .update(pipelineStages)
        .set({ sortOrder: index })
        .where(eq(pipelineStages.id, id));
    }
  });

  return NextResponse.json({ ok: true });
}
