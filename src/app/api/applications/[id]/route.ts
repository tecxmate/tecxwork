import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/pipeline-types";

function isStage(v: unknown): v is PipelineStage {
  return typeof v === "string" && (PIPELINE_STAGES as readonly string[]).includes(v);
}

/**
 * PATCH /api/applications/:id  { stage }
 * Moves a candidate to a new ATS pipeline stage (demo — no strict auth gate).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const db = getDb();
  const [updated] = await db
    .update(applications)
    .set({ stage, stageUpdatedAt: new Date() })
    .where(eq(applications.id, applicationId))
    .returning({ id: applications.id, stage: applications.stage });

  if (!updated) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id: updated.id, stage: updated.stage });
}
