import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { authorizeApplication, isOrgManager } from "@/lib/ats-auth";
import { logAudit } from "@/lib/audit";
import { applicantProfiles } from "@/lib/db/schema";

/**
 * POST /api/applications/:id/erase-candidate
 * Right-to-erasure: anonymize the candidate's PII in place (keeps the row for
 * referential integrity + non-PII aggregates). Org managers only. Audited.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isInteger(applicationId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const auth = await authorizeApplication(applicationId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!isOrgManager(auth.member.role)) {
    return NextResponse.json(
      { error: "Only org managers can erase candidate data" },
      { status: 403 }
    );
  }

  const db = getDb();
  const candidateId = auth.app.applicantId;

  await db
    .update(applicantProfiles)
    .set({
      name: "已刪除 Erased",
      email: `erased-${candidateId}@redacted.invalid`,
      phone: "",
      cvLink: "",
      linkedinUrl: "",
      portfolioUrl: "",
      avatarUrl: "",
      description: "",
      skills: [],
      anonymizedAt: new Date(),
    })
    .where(eq(applicantProfiles.id, candidateId));

  const ip = _req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await logAudit({
    orgId: auth.member.orgId,
    actorUserId: auth.member.userId,
    action: "erasure",
    entityType: "candidate",
    entityId: candidateId,
    ip,
  });

  return NextResponse.json({ ok: true, anonymizedAt: new Date().toISOString() });
}
