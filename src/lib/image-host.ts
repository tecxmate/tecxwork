import { r2PublicHost } from "@/lib/r2";

/**
 * Allow-list for image URLs stored in the DB (homepage / page images).
 *
 * Accepts the R2 public host (new uploads) and the legacy Vercel Blob host so
 * images uploaded before the R2 migration keep validating and rendering.
 */
const LEGACY_BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

export function isAllowedImageHost(hostname: string): boolean {
  if (hostname.endsWith(LEGACY_BLOB_HOST_SUFFIX)) return true;
  const r2Host = r2PublicHost();
  return r2Host !== null && hostname === r2Host;
}

/** Validates that a string is an https URL served from an allowed host. */
export function isAllowedImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && isAllowedImageHost(url.hostname);
  } catch {
    return false;
  }
}
