import type { Capability } from "@/lib/permissions";

/** Document kinds the product understands. */
export const DOCUMENT_KINDS = [
  "cv",
  "arc",
  "work_permit",
  "passport",
  "diploma",
  "contract",
  "other",
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

/**
 * What a browser may upload. An allow-list, never a deny-list: the risk is a file that
 * renders as active content when opened, so SVG and HTML are absent on purpose.
 */
export const ALLOWED_UPLOAD_TYPES = new Map<string, string>([
  ["application/pdf", "pdf"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

/** 10MB. A scanned ARC or a CV is well under this; anything larger is a mistake. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

const COMPLIANCE_KINDS = new Set<string>(["arc", "work_permit", "passport"]);

/**
 * A CV is candidate data; an ARC or work permit is compliance data. Different roles read
 * them, so the capability a document needs depends on what the document is.
 *
 * There is no separate candidate-write capability: attaching a CV to a candidate you can
 * already see is the same bar as seeing them, and inventing a capability that exactly one
 * route checks would be matrix bloat rather than a real distinction. Filing a work permit
 * is different — that is a compliance act with legal weight, so it needs compliance:write.
 */
export function capabilityForKind(kind: string, write: boolean): Capability {
  if (!COMPLIANCE_KINDS.has(kind)) return "candidate:read";
  return write ? "compliance:write" : "compliance:read";
}
