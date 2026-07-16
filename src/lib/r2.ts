import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 storage (S3-compatible).
 *
 * Replaces Vercel Blob for image uploads. R2 is exposed over the S3 API at
 * https://<account-id>.r2.cloudflarestorage.com and served publicly from
 * R2_PUBLIC_BASE_URL (an r2.dev subdomain or a custom domain bound to the
 * bucket). Uploaded objects are immutable (unique keys), so we cache them hard.
 */

const CACHE_CONTROL = "public, max-age=31536000, immutable";

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
}

function readConfig(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucket ||
    !publicBaseUrl
  ) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl };
}

/** True when every R2 env var required for uploads is present. */
export function isR2Configured(): boolean {
  return readConfig() !== null;
}

/**
 * The hostname images are served from (e.g. "pub-xxx.r2.dev" or a custom
 * domain). Used by the upload allow-list and next.config remote patterns.
 * Returns null when R2_PUBLIC_BASE_URL is unset or malformed.
 */
export function r2PublicHost(): string | null {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) return null;
  try {
    return new URL(base).hostname;
  } catch {
    return null;
  }
}

let client: S3Client | null = null;

function getClient(config: R2Config): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return client;
}

/**
 * Uploads a file to R2 under `key` and returns its public URL.
 * Throws if R2 is not configured.
 */
export async function uploadToR2(
  key: string,
  file: File,
  contentType: string
): Promise<{ url: string }> {
  const config = readConfig();
  if (!config) {
    throw new Error("R2 storage is not configured.");
  }

  const body = Buffer.from(await file.arrayBuffer());

  await getClient(config).send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: body.byteLength,
      CacheControl: CACHE_CONTROL,
    })
  );

  const base = config.publicBaseUrl.replace(/\/+$/, "");
  return { url: `${base}/${key}` };
}
