import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { applicantProfiles, complianceDocuments } from "@/lib/db/schema";
import { requireAgency, clientIp } from "@/lib/agency-auth";
import { parseJsonBody } from "@/lib/validation";
import { createComplianceDocSchema } from "@/lib/validation-agency";
import { logAudit } from "@/lib/audit";

/** Candidates the org can attach documents to, for the form's picker. */
export async function GET() {
  const gate = await requireAgency("compliance:read");
  if (!gate.ok) return gate.response;

  const rows = await getDb()
    .select({ id: applicantProfiles.id, name: applicantProfiles.name })
    .from(applicantProfiles)
    .orderBy(applicantProfiles.name);

  return NextResponse.json({ candidates: rows });
}

export async function POST(req: NextRequest) {
  const gate = await requireAgency("compliance:write");
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.actor;

  const parsed = await parseJsonBody(req, createComplianceDocSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const db = getDb();
  const [candidate] = await db
    .select({ id: applicantProfiles.id })
    .from(applicantProfiles)
    .where(eq(applicantProfiles.id, body.candidateId))
    .limit(1);
  if (!candidate) return NextResponse.json({ error: "Unknown candidate" }, { status: 404 });

  const [row] = await db
    .insert(complianceDocuments)
    .values({
      orgId,
      candidateId: body.candidateId,
      placementId: body.placementId ?? null,
      docType: body.docType,
      docNumber: body.docNumber,
      issuingAuthority: body.issuingAuthority,
      issueDate: body.issueDate ?? null,
      expiryDate: body.expiryDate ?? null,
      notes: body.notes,
      status: "valid",
      verifiedByUserId: userId,
      verifiedAt: new Date(),
    })
    .returning({ id: complianceDocuments.id });

  await logAudit({
    orgId,
    actorUserId: userId,
    action: "create",
    entityType: "compliance_document",
    entityId: row.id,
    fieldNames: Object.keys(body),
    // docType is a category, not PII, and it is what makes the trail readable later.
    metadata: { docType: body.docType },
    ip: clientIp(req),
  });

  return NextResponse.json({ document: row }, { status: 201 });
}

/** Correct a document in place (a typo in the number, a wrong issuer). */
export async function PATCH(req: NextRequest) {
  const gate = await requireAgency("compliance:write");
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.actor;

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const parsed = await parseJsonBody(req, createComplianceDocSchema.partial());
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const [row] = await getDb()
    .update(complianceDocuments)
    .set({ ...body, verifiedByUserId: userId, verifiedAt: new Date() })
    .where(and(eq(complianceDocuments.id, id), eq(complianceDocuments.orgId, orgId)))
    .returning({ id: complianceDocuments.id });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await logAudit({
    orgId,
    actorUserId: userId,
    action: "update",
    entityType: "compliance_document",
    entityId: id,
    fieldNames: Object.keys(body),
    ip: clientIp(req),
  });

  return NextResponse.json({ document: row });
}
