import { NextResponse } from "next/server";
import { authorizationServerMetadata } from "@/lib/oauth-metadata";

/**
 * RFC 8414 discovery. A client is given one URL and finds everything else from here, which
 * is what makes "paste this and press Connect" work.
 */
export function GET() {
  return NextResponse.json(authorizationServerMetadata(), {
    headers: {
      // Public, non-secret, and read on every connection attempt.
      "Cache-Control": "public, max-age=3600",
    },
  });
}
