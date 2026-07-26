import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getRecruiterFromSession } from "@/lib/auth";
import { applications, recruiters } from "@/lib/db/schema";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/pipeline-types";

function isStage(v: unknown): v is PipelineStage {
  return typeof v === "string" && (PIPELINE_STAGES as readonly string[]).includes(v);
}

/**
 * PATCH /api/applications/:id  { stage }
 * Moves a candidate to a new ATS pipeline stage.
 *
 * Authorization: must be a recruiter. A normal recruiter may only move
 * applications to their OWN job openings; an "agency" recruiter may move any
 * (they manage the whole cross-client placement pipeline).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getRecruiterFromSession();
  if (!auth) {
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

  const db = getDb();

  const [application] = await db
    .select({ id: applications.id, recruiterId: applications.recruiterId })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const [me] = await db
    .select({ clientKind: recruiters.clientKind })
    .from(recruiters)
    .where(eq(recruiters.id, auth.recruiterId))
    .limit(1);
  const isAgency = me?.clientKind === "agency";

  if (!isAgency && application.recruiterId !== auth.recruiterId) {
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

  return NextResponse.json({ ok: true, id: updated.id, stage: updated.stage });
}
