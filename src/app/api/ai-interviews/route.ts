import { NextRequest, NextResponse } from "next/server";

import { authorizeApplication } from "@/lib/ats-auth";
import { logAudit } from "@/lib/audit";
import { interviewerConfigured } from "@/lib/interview/engine";
import { createInvite } from "@/lib/interview/service";

/**
 * POST /api/ai-interviews  { applicationId }
 * Issues the candidate's interview link for one application.
 *
 * The response carries the token, which is the credential. It is returned to
 * the recruiter who asked for it and written to the audit trail by application
 * id only — never the token itself, because the audit log is readable by more
 * people than should be able to take a candidate's interview for them.
 */
export async function POST(req: NextRequest) {
  if (!interviewerConfigured()) {
    return NextResponse.json(
      { error: "The AI interviewer is not configured on this deployment." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const applicationId = Number((body as { applicationId?: unknown })?.applicationId);
  if (!Number.isInteger(applicationId)) {
    return NextResponse.json({ error: "applicationId must be an integer" }, { status: 400 });
  }

  const authz = await authorizeApplication(applicationId);
  if ("error" in authz) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  try {
    const { token, reused } = await createInvite({
      applicationId,
      orgId: authz.member.orgId,
      userId: authz.member.userId,
    });

    await logAudit({
      orgId: authz.member.orgId,
      actorUserId: authz.member.userId,
      action: reused ? "ai_interview_link_reused" : "ai_interview_invited",
      entityType: "application",
      entityId: applicationId,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });

    return NextResponse.json({ path: `/interview/${token}`, reused });
  } catch (error) {
    console.error("[ai-interview] invite", error);
    return NextResponse.json({ error: "Could not create the interview." }, { status: 500 });
  }
}
