import { NextRequest, NextResponse } from "next/server";

import { authorizeApplication } from "@/lib/ats-auth";
import { logAudit } from "@/lib/audit";
import { finish } from "@/lib/interview/service";
import { latestForApplication } from "@/lib/interview/service";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

/**
 * GET /api/applications/:id/ai-interview — the interview report for one
 * application, for the recruiter who owns it.
 *
 * This is the only place `lookingFor` and the planted false-premise detail leave
 * the database, and `authorizeApplication` is what keeps them there: the same
 * tenant + ownership check the stage-move and scorecard routes use.
 *
 * It will also grade an interview that finished without one. The last answer
 * grades inline, but that request is the longest in the feature and a timeout
 * would otherwise leave a completed interview with no report and no way to get
 * one. Reading the report is the natural moment to notice.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isInteger(applicationId)) {
    return NextResponse.json({ error: "Invalid application id" }, { status: 400 });
  }

  const authz = await authorizeApplication(applicationId);
  if ("error" in authz) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  let view = await latestForApplication(applicationId, authz.member.orgId);
  if (!view) return NextResponse.json({ interview: null });

  if (!view.report && view.status !== "invited" && view.status !== "in_progress") {
    try {
      await finish(view.id, { completed: view.status === "completed" });
      view = await latestForApplication(applicationId, authz.member.orgId);
    } catch (error) {
      console.error("[ai-interview] late grade", error);
    }
  }

  await logAudit({
    orgId: authz.member.orgId,
    actorUserId: authz.member.userId,
    action: "ai_interview_report_viewed",
    entityType: "application",
    entityId: applicationId,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  return NextResponse.json({ interview: view });
}
