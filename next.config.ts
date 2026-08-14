import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

// Legacy Vercel Blob host (images uploaded before the R2 migration) plus the
// R2 public host derived from R2_PUBLIC_BASE_URL. Both are kept so existing and
// new images render through next/image.
const remotePatterns: RemotePattern[] = [
  {
    protocol: "https",
    hostname: "*.public.blob.vercel-storage.com",
  },
];

if (process.env.R2_PUBLIC_BASE_URL) {
  try {
    remotePatterns.push({
      protocol: "https",
      hostname: new URL(process.env.R2_PUBLIC_BASE_URL).hostname,
    });
  } catch {
    // Ignore a malformed R2_PUBLIC_BASE_URL — uploads will surface the misconfig.
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
