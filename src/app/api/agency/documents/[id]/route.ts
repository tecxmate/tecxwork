import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db, documents } from "@/lib/db";
import { clientIp, requireAgency } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import { getDocumentStorage, isDocumentStorageConfigured } from "@/lib/document-storage";
import { capabilityForKind } from "@/lib/documents";

export const dynamic = "force-dynamic";

/**
 * GET — stream one document back to an authorised viewer.
 *
 * The bytes are proxied rather than redirected to a storage URL. That costs a little
 * bandwidth and buys the two things that matter for an ARC scan: the permission check
 * happens on every single read, and every read leaves an audit row. A presigned URL would
 * be a bearer token that keeps working for whoever it gets forwarded to.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const documentId = Number((await params).id);
  if (!Number.isInteger(documentId)) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  const gate = await requireAgency();
  if (!gate.ok) return gate.response;

  const [doc] = await db
    .select({
      id: documents.id,
      kind: documents.kind,
      filename: documents.filename,
      contentType: documents.contentType,
      storageKey: documents.storageKey,
      candidateId: documents.candidateId,
    })
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        // Tenant scoping is in the query, not a later comparison: another org's document
        // is simply not found.
        eq(documents.orgId, gate.actor.orgId),
        isNull(documents.deletedAt)
      )
    )
    .limit(1);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // An ARC needs compliance:read; a CV needs candidate:read. Checked after the row is
  // fetched because the required capability depends on what the document turned out to be.
  const capability = capabilityForKind(doc.kind, false);
  const authorized = await requireAgency(capability);
  if (!authorized.ok) return authorized.response;

  if (!isDocumentStorageConfigured()) {
    return NextResponse.json(
      { error: "Document storage is not configured on this deployment." },
      { status: 503 }
    );
  }

  let bytes: Buffer;
  try {
    bytes = await getDocumentStorage().get(doc.storageKey);
  } catch {
    // The row exists but the object does not — a real failure worth surfacing rather than
    // returning an empty file that looks like a corrupt download.
    console.error(
      JSON.stringify({
        level: "error",
        message: "document bytes missing from storage",
        documentId: doc.id,
      })
    );
    return NextResponse.json({ error: "Document could not be retrieved" }, { status: 502 });
  }

  // Who looked at whose papers, and when. This is the record an inspection or a PIPA
  // subject-access request is answered from.
  await logAudit({
    orgId: gate.actor.orgId,
    actorUserId: gate.actor.userId,
    action: "document.view",
    entityType: "document",
    entityId: doc.id,
    metadata: { kind: doc.kind, candidateId: doc.candidateId },
    ip: clientIp(req),
  });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": doc.contentType,
      // `inline` so a CV opens in the browser's viewer; the filename is quoted and
      // stripped of quotes and newlines so it cannot break out of the header.
      "Content-Disposition": `inline; filename="${doc.filename.replace(/["\r\n]/g, "")}"`,
      // Never let a shared machine's browser or an intermediary keep a copy.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/**
 * DELETE — soft-delete a document.
 *
 * The row stays: a document relied on during a placement is part of the record even after
 * it is superseded. Erasing the bytes is a separate, deliberate PIPA operation.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const documentId = Number((await params).id);
  if (!Number.isInteger(documentId)) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  const gate = await requireAgency();
  if (!gate.ok) return gate.response;

  const [doc] = await db
    .select({ id: documents.id, kind: documents.kind })
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.orgId, gate.actor.orgId),
        isNull(documents.deletedAt)
      )
    )
    .limit(1);

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const authorized = await requireAgency(capabilityForKind(doc.kind, true));
  if (!authorized.ok) return authorized.response;

  await db
    .update(documents)
    .set({ deletedAt: new Date() })
    .where(eq(documents.id, documentId));

  await logAudit({
    orgId: gate.actor.orgId,
    actorUserId: gate.actor.userId,
    action: "document.delete",
    entityType: "document",
    entityId: doc.id,
    metadata: { kind: doc.kind },
    ip: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
