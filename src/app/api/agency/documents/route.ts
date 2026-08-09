import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { applicantProfiles, complianceDocuments, db, documents } from "@/lib/db";
import { clientIp, requireAgency } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import {
  getDocumentStorage,
  isDocumentStorageConfigured,
  newStorageKey,
} from "@/lib/document-storage";
import {
  ALLOWED_UPLOAD_TYPES,
  DOCUMENT_KINDS,
  MAX_DOCUMENT_BYTES,
  capabilityForKind,
  type DocumentKind,
} from "@/lib/documents";

export const dynamic = "force-dynamic";

/** GET ?candidateId= — the documents held for one candidate. */
export async function GET(req: NextRequest) {
  const candidateId = Number(req.nextUrl.searchParams.get("candidateId"));
  if (!Number.isInteger(candidateId)) {
    return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
  }

  const gate = await requireAgency("candidate:read");
  if (!gate.ok) return gate.response;

  const rows = await db
    .select({
      id: documents.id,
      kind: documents.kind,
      filename: documents.filename,
      contentType: documents.contentType,
      sizeBytes: documents.sizeBytes,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(
      and(
        eq(documents.orgId, gate.actor.orgId),
        eq(documents.candidateId, candidateId),
        isNull(documents.deletedAt)
      )
    )
    .orderBy(desc(documents.createdAt));

  return NextResponse.json({ documents: rows });
}

/** POST — multipart upload of one document for one candidate. */
export async function POST(req: NextRequest) {
  // Authenticate before touching the body, so an unauthorised request never causes us to
  // read a 10MB upload off the wire.
  const gate = await requireAgency("candidate:read");
  if (!gate.ok) return gate.response;

  if (!isDocumentStorageConfigured()) {
    return NextResponse.json(
      { error: "Document storage is not configured on this deployment." },
      { status: 503 }
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = String(form?.get("kind") ?? "");
  const candidateId = Number(form?.get("candidateId"));
  // Optional: the tracked compliance record this scan belongs to.
  const complianceDocumentIdRaw = form?.get("complianceDocumentId");
  const complianceDocumentId = complianceDocumentIdRaw
    ? Number(complianceDocumentIdRaw)
    : null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!DOCUMENT_KINDS.includes(kind as DocumentKind)) {
    return NextResponse.json({ error: "Unknown document kind" }, { status: 400 });
  }
  if (!Number.isInteger(candidateId)) {
    return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
  }

  // Filing a work permit is a compliance act; storing a CV is not. Only re-check when the
  // kind actually demands more than the candidate:read already established above.
  const needed = capabilityForKind(kind, true);
  if (needed !== "candidate:read") {
    const stricter = await requireAgency(needed);
    if (!stricter.ok) return stricter.response;
  }

  const extension = ALLOWED_UPLOAD_TYPES.get(file.type);
  if (!extension) {
    return NextResponse.json(
      { error: "Only PDF, JPEG, PNG and WebP files are accepted." },
      { status: 415 }
    );
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json({ error: "File is larger than 10MB." }, { status: 413 });
  }

  // The candidate must exist. Documents are indexed by org, but a candidate id from
  // another tenant would otherwise create a row pointing at a stranger.
  const [candidate] = await db
    .select({ id: applicantProfiles.id })
    .from(applicantProfiles)
    .where(eq(applicantProfiles.id, candidateId))
    .limit(1);
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  // Trust the measured length, not the declared one.
  if (bytes.byteLength > MAX_DOCUMENT_BYTES) {
    return NextResponse.json({ error: "File is larger than 10MB." }, { status: 413 });
  }

  const storageKey = newStorageKey(kind, extension);
  await getDocumentStorage().put(storageKey, bytes, file.type);

  const [created] = await db
    .insert(documents)
    .values({
      orgId: gate.actor.orgId,
      candidateId,
      kind: kind as DocumentKind,
      // The candidate's filename is display-only and never becomes part of a path.
      filename: file.name.slice(0, 200),
      contentType: file.type,
      sizeBytes: bytes.byteLength,
      storageKey,
      uploadedByUserId: gate.actor.userId,
    })
    .returning({ id: documents.id });

  // Attach the scan to the compliance record it evidences. Scoped by org so a stray id
  // cannot point one tenant's permit row at another tenant's file.
  if (complianceDocumentId && Number.isInteger(complianceDocumentId)) {
    await db
      .update(complianceDocuments)
      .set({ documentId: created.id })
      .where(
        and(
          eq(complianceDocuments.id, complianceDocumentId),
          eq(complianceDocuments.orgId, gate.actor.orgId)
        )
      );
  }

  await logAudit({
    orgId: gate.actor.orgId,
    actorUserId: gate.actor.userId,
    action: "document.upload",
    entityType: "document",
    entityId: created.id,
    // Names and metadata only — never the bytes, and never the candidate's own filename.
    metadata: { kind, sizeBytes: bytes.byteLength, candidateId, complianceDocumentId },
    ip: clientIp(req),
  });

  return NextResponse.json({ document: { id: created.id } }, { status: 201 });
}
