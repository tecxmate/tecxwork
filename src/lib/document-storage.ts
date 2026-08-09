import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Where document bytes live.
 *
 * Deliberately three methods. Everything that makes documents *safe* — permission checks,
 * audit entries, tenant scoping — lives in the route above this, so a storage backend only
 * has to move bytes. Adding R2, S3 or Vercel Blob later is one file implementing this
 * interface and one line in `getDocumentStorage`.
 *
 * Note what is NOT here: any notion of a public URL. Documents are streamed through the
 * app, never linked to directly. A presigned URL is a bearer token that works for anyone
 * who gets it — and URLs get pasted into chat threads. Proxying costs a little bandwidth
 * and buys a permission check and an audit row on every single read.
 */
export interface DocumentStorage {
  put(key: string, bytes: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}

/**
 * An unguessable storage key.
 *
 * Never derived from the candidate's filename or id: keys must not leak who a document
 * belongs to, and two candidates uploading "cv.pdf" must not collide.
 */
export function newStorageKey(kind: string, extension: string): string {
  const safeKind = kind.replace(/[^a-z_]/g, "") || "other";
  const safeExt = extension.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  const random = randomBytes(24).toString("hex");
  return safeExt ? `${safeKind}/${random}.${safeExt}` : `${safeKind}/${random}`;
}

/**
 * Local filesystem storage.
 *
 * Real storage for a single-machine deployment, and the driver the tests run against. On
 * serverless this is not durable across invocations, which is why `getDocumentStorage`
 * refuses it in production unless a path is explicitly configured.
 */
export class LocalDocumentStorage implements DocumentStorage {
  constructor(private readonly root: string) {}

  /** Resolve inside the root, refusing any key that tries to climb out of it. */
  private resolve(key: string): string {
    const full = path.resolve(this.root, key);
    const root = path.resolve(this.root);
    if (full !== root && !full.startsWith(root + path.sep)) {
      throw new Error("Invalid storage key");
    }
    return full;
  }

  async put(key: string, bytes: Buffer): Promise<void> {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, bytes);
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }

  async remove(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }
}

let cached: DocumentStorage | null = null;

/**
 * The configured backend.
 *
 * `DOCUMENT_STORAGE_PATH` selects local disk. When a hosted backend is added it is
 * selected here by its own env vars, ahead of the local fallback.
 *
 * Throws rather than falling back silently: a document upload that appears to succeed and
 * quietly writes to a container filesystem that vanishes on the next deploy is worse than
 * a clear error at the boundary.
 */
export function getDocumentStorage(): DocumentStorage {
  if (cached) return cached;

  const localPath = process.env.DOCUMENT_STORAGE_PATH;
  if (localPath) {
    cached = new LocalDocumentStorage(localPath);
    return cached;
  }

  throw new Error(
    "Document storage is not configured. Set DOCUMENT_STORAGE_PATH, or add a hosted " +
      "storage driver in getDocumentStorage()."
  );
}

/** True when documents can actually be stored — routes surface a 503 rather than failing mid-upload. */
export function isDocumentStorageConfigured(): boolean {
  return cached !== null || Boolean(process.env.DOCUMENT_STORAGE_PATH);
}

/** Test seam: lets a test install an in-memory backend without touching env vars. */
export function __setDocumentStorage(storage: DocumentStorage | null): void {
  cached = storage;
}
