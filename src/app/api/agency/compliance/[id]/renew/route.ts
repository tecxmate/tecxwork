import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { complianceDocuments } from "@/lib/db/schema";
import { requireAgency, clientIp } from "@/lib/agency-auth";
import { parseJsonBody } from "@/lib/validation";
import { renewComplianceDocSchema } from "@/lib/validation-agency";
import { logAudit } from "@/lib/audit";

/**
 * Renew a document: mark the old row superseded and insert the new one.
 *
 * Deliberately NOT an update of the expiry date in place. "Was this worker covered on
 * 1 August?" is a question a labour inspector can ask a year later, and overwriting the row
 * destroys the only record that could answer it. The list view shows the current document;
 * the history stays behind it.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAgency();
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.actor;

  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const parsed = await parseJsonBody(req, renewComplianceDocSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const db = getDb();

  const result = await db.transaction(async (tx) => {
    const [old] = await tx
      .select()
      .from(complianceDocuments)
      .where(and(eq(complianceDocuments.id, id), eq(complianceDocuments.orgId, orgId)))
      .limit(1);
    if (!old) return null;

    // Renewing an already-superseded row would fork the history into two "current"
    // documents, which is exactly the ambiguity this design exists to avoid.
    if (old.status === "superseded") {
      return { conflict: "This document has already been renewed." as const };
    }

    await tx
      .update(complianceDocuments)
      .set({ status: "superseded" })
      .where(eq(complianceDocuments.id, id));

    const [fresh] = await tx
      .insert(complianceDocuments)
      .values({
        orgId,
        candidateId: old.candidateId,
        placementId: old.placementId,
        docType: old.docType,
        docNumber: body.docNumber ?? old.docNumber,
        issuingAuthority: body.issuingAuthority ?? old.issuingAuthority,
        issueDate: body.issueDate ?? null,
        expiryDate: body.expiryDate,
        notes: body.notes,
        status: "valid",
        verifiedByUserId: userId,
        verifiedAt: new Date(),
      })
      .returning({ id: complianceDocuments.id, expiryDate: complianceDocuments.expiryDate });

    return { fresh, docType: old.docType };
  });

  if (result === null) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ("conflict" in result) {
    return NextResponse.json({ error: result.conflict }, { status: 409 });
  }

  await logAudit({
    orgId,
    actorUserId: userId,
    action: "renew",
    entityType: "compliance_document",
    entityId: result.fresh.id,
    fieldNames: Object.keys(body),
    metadata: { docType: result.docType, supersededId: id },
    ip: clientIp(req),
  });

  return NextResponse.json({ document: result.fresh }, { status: 201 });
}
