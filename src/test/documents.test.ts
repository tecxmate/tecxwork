import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  applicantProfiles,
  auditLog,
  documents,
  memberships,
  orgs,
  recruiters,
} from "@/lib/db/schema";
import { NextRequest } from "next/server";
import { seedRecruiter, withSession } from "./helpers";
import type { MemberRole } from "@/lib/ats-auth";
import {
  __setDocumentStorage,
  LocalDocumentStorage,
  newStorageKey,
  type DocumentStorage,
} from "@/lib/document-storage";
import { capabilityForKind } from "@/lib/documents";
import {
  GET as listDocuments,
  POST as uploadDocument,
} from "@/app/api/agency/documents/route";
import {
  DELETE as removeDocument,
  GET as downloadDocument,
} from "@/app/api/agency/documents/[id]/route";

let seq = 0;

/** In-memory backend — the storage interface is three methods precisely so this is easy. */
class MemoryStorage implements DocumentStorage {
  readonly files = new Map<string, Buffer>();
  async put(key: string, bytes: Buffer) {
    this.files.set(key, bytes);
  }
  async get(key: string) {
    const found = this.files.get(key);
    if (!found) throw new Error("not found");
    return found;
  }
  async remove(key: string) {
    this.files.delete(key);
  }
}

let storage: MemoryStorage;
beforeEach(() => {
  storage = new MemoryStorage();
  __setDocumentStorage(storage);
});
afterAll(() => __setDocumentStorage(null));

async function seedAgency(role: MemberRole = "admin") {
  const [org] = await db
    .insert(orgs)
    .values({ name: `Org${seq}`, slug: `org-${seq++}-${Date.now()}` })
    .returning();
  const rec = await seedRecruiter({ company: "Agency" });
  await db
    .update(recruiters)
    .set({ orgId: org.id, clientKind: "agency" })
    .where(eq(recruiters.id, rec.recruiterId));
  await db.insert(memberships).values({ orgId: org.id, userId: rec.userId, role });
  await withSession({ userId: rec.userId, email: rec.email, role: "recruiter" });
  return { orgId: org.id, ...rec };
}

async function seedCandidate() {
  const [row] = await db
    .insert(applicantProfiles)
    .values({
      name: "Nguyễn Thị Mai",
      email: `c-${seq++}-${Date.now()}@test.dev`,
      cvLink: "https://example.com/cv",
      pipaConsent: true,
    })
    .returning({ id: applicantProfiles.id });
  return row.id;
}

/** A multipart upload request, the way a browser sends one. */
function uploadRequest(opts: {
  candidateId: number;
  kind: string;
  bytes?: Buffer;
  filename?: string;
  type?: string;
}) {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(opts.bytes ?? Buffer.from("%PDF-1.4 fake"))], {
    type: opts.type ?? "application/pdf",
  });
  form.set("file", blob, opts.filename ?? "cv.pdf");
  form.set("kind", opts.kind);
  form.set("candidateId", String(opts.candidateId));
  return new Request("http://localhost/api/agency/documents", {
    method: "POST",
    body: form,
  }) as unknown as Parameters<typeof uploadDocument>[0];
}

const ctx = (id: number) => ({ params: Promise.resolve({ id: String(id) }) });
const bare = (method: string) =>
  new Request("http://localhost/x", { method }) as unknown as Parameters<
    typeof downloadDocument
  >[0];

async function upload(candidateId: number, kind = "cv", extra = {}) {
  const res = await uploadDocument(uploadRequest({ candidateId, kind, ...extra }));
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

describe("documents — custody", () => {
  it("stores the bytes and indexes them against the candidate", async () => {
    const a = await seedAgency();
    const candidateId = await seedCandidate();

    const { status, body } = await upload(candidateId, "cv");
    expect(status).toBe(201);

    const [row] = await db.select().from(documents).where(eq(documents.id, body.document.id));
    expect(row.orgId).toBe(a.orgId);
    expect(row.candidateId).toBe(candidateId);
    expect(row.kind).toBe("cv");
    expect(row.sizeBytes).toBeGreaterThan(0);
    // the bytes really reached storage, under the row's key
    expect(storage.files.has(row.storageKey)).toBe(true);
  });

  it("streams the exact bytes back on download", async () => {
    await seedAgency();
    const candidateId = await seedCandidate();
    const content = Buffer.from("%PDF-1.4 the actual document body");
    const { body } = await upload(candidateId, "cv", { bytes: content });

    const res = await downloadDocument(bare("GET"), ctx(body.document.id));
    expect(res.status).toBe(200);
    expect(Buffer.from(await res.arrayBuffer()).equals(content)).toBe(true);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  it("never lets a document be cached or content-sniffed", async () => {
    await seedAgency();
    const candidateId = await seedCandidate();
    const { body } = await upload(candidateId, "cv");

    const res = await downloadDocument(bare("GET"), ctx(body.document.id));
    // a shared campus machine must not keep a copy of someone's passport
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("lists a candidate's documents without exposing storage keys", async () => {
    await seedAgency();
    const candidateId = await seedCandidate();
    await upload(candidateId, "cv");

    const res = await listDocuments(
      new NextRequest(`http://localhost/api/agency/documents?candidateId=${candidateId}`)
    );
    const { documents: rows } = await res.json();
    expect(rows).toHaveLength(1);
    // the key is the only thing standing between a URL and the bytes; it never leaves the server
    expect(JSON.stringify(rows)).not.toContain("storageKey");
  });
});

describe("documents — tenant isolation", () => {
  it("another org cannot download the document", async () => {
    await seedAgency();
    const candidateId = await seedCandidate();
    const { body } = await upload(candidateId, "cv");

    const other = await seedAgency();
    await withSession({ userId: other.userId, email: other.email, role: "recruiter" });

    const res = await downloadDocument(bare("GET"), ctx(body.document.id));
    expect(res.status).toBe(404);
  });

  it("another org cannot delete it either", async () => {
    await seedAgency();
    const candidateId = await seedCandidate();
    const { body } = await upload(candidateId, "cv");

    const other = await seedAgency();
    await withSession({ userId: other.userId, email: other.email, role: "recruiter" });

    expect((await removeDocument(bare("DELETE"), ctx(body.document.id))).status).toBe(404);
  });
});

describe("documents — a permit is not a CV", () => {
  it("routes each kind to the capability that matches what it is", () => {
    expect(capabilityForKind("cv", false)).toBe("candidate:read");
    expect(capabilityForKind("arc", false)).toBe("compliance:read");
    expect(capabilityForKind("work_permit", true)).toBe("compliance:write");
    expect(capabilityForKind("passport", true)).toBe("compliance:write");
  });

  it("a hiring manager can read a CV but not an ARC scan", async () => {
    // Seed the ARC as an admin, then come back as a hiring manager.
    const admin = await seedAgency("admin");
    const candidateId = await seedCandidate();
    const cv = (await upload(candidateId, "cv")).body.document.id;
    const arc = (await upload(candidateId, "arc")).body.document.id;

    // same org, different role
    await db
      .update(memberships)
      .set({ role: "hiring_manager" })
      .where(eq(memberships.userId, admin.userId));

    expect((await downloadDocument(bare("GET"), ctx(cv))).status).toBe(200);
    // hiring_manager holds no compliance capability at all
    expect((await downloadDocument(bare("GET"), ctx(arc))).status).toBe(403);
  });

  it("a coordinator may file a work permit, a hiring manager may not", async () => {
    const a = await seedAgency("coordinator");
    const candidateId = await seedCandidate();
    expect((await upload(candidateId, "work_permit")).status).toBe(201);

    await db
      .update(memberships)
      .set({ role: "hiring_manager" })
      .where(eq(memberships.userId, a.userId));
    expect((await upload(candidateId, "work_permit")).status).toBe(403);
  });
});

describe("documents — what may be uploaded", () => {
  it("refuses a file type that could execute when opened", async () => {
    await seedAgency();
    const candidateId = await seedCandidate();
    for (const type of ["image/svg+xml", "text/html", "application/x-msdownload"]) {
      const res = await upload(candidateId, "cv", { type, filename: "x" });
      expect(res.status).toBe(415);
    }
  });

  it("refuses a file over the size limit", async () => {
    await seedAgency();
    const candidateId = await seedCandidate();
    const huge = Buffer.alloc(11 * 1024 * 1024, 0x41);
    expect((await upload(candidateId, "cv", { bytes: huge })).status).toBe(413);
  });

  it("refuses an unknown document kind", async () => {
    await seedAgency();
    const candidateId = await seedCandidate();
    expect((await upload(candidateId, "blackmail")).status).toBe(400);
  });

  it("refuses a candidate that does not exist", async () => {
    await seedAgency();
    expect((await upload(999_999, "cv")).status).toBe(404);
  });
});

describe("documents — storage keys", () => {
  it("does not derive the key from the filename or the candidate", () => {
    const key = newStorageKey("arc", "pdf");
    expect(key).toMatch(/^arc\/[0-9a-f]{48}\.pdf$/);
    // two uploads of the same document never collide
    expect(newStorageKey("arc", "pdf")).not.toBe(key);
  });

  it("refuses a key that tries to climb out of the storage root", async () => {
    const local = new LocalDocumentStorage("/tmp/doc-root-test");
    await expect(local.get("../../etc/passwd")).rejects.toThrow(/Invalid storage key/);
  });
});

describe("documents — the audit trail", () => {
  it("records who viewed whose papers, without storing the papers", async () => {
    const a = await seedAgency();
    const candidateId = await seedCandidate();
    const { body } = await upload(candidateId, "arc");
    await downloadDocument(bare("GET"), ctx(body.document.id));

    const rows = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityId, body.document.id));

    const actions = rows.map((r) => r.action);
    expect(actions).toContain("document.upload");
    expect(actions).toContain("document.view");

    const view = rows.find((r) => r.action === "document.view")!;
    expect(view.actorUserId).toBe(a.userId);
    expect(view.orgId).toBe(a.orgId);
    expect(view.metadata).toMatchObject({ kind: "arc", candidateId });
    // the trail carries names and ids, never content
    expect(JSON.stringify(view.metadata)).not.toContain("PDF");
  });
});

describe("documents — removal", () => {
  it("soft-deletes so the record of what was relied on survives", async () => {
    await seedAgency();
    const candidateId = await seedCandidate();
    const { body } = await upload(candidateId, "cv");

    expect((await removeDocument(bare("DELETE"), ctx(body.document.id))).status).toBe(200);

    const [row] = await db.select().from(documents).where(eq(documents.id, body.document.id));
    expect(row.deletedAt).not.toBeNull();
    // gone from the UI...
    expect((await downloadDocument(bare("GET"), ctx(body.document.id))).status).toBe(404);
    // ...but the bytes are still there, because erasure is a separate deliberate act
    expect(storage.files.has(row.storageKey)).toBe(true);
  });
});

describe("documents — storage not configured", () => {
  it("says so plainly rather than failing mid-upload", async () => {
    __setDocumentStorage(null);
    const previous = process.env.DOCUMENT_STORAGE_PATH;
    delete process.env.DOCUMENT_STORAGE_PATH;

    await seedAgency();
    const candidateId = await seedCandidate();
    expect((await upload(candidateId, "cv")).status).toBe(503);

    if (previous) process.env.DOCUMENT_STORAGE_PATH = previous;
  });
});
