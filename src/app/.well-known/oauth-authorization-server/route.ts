import { NextRequest, NextResponse } from "next/server";
import { authorizationServerMetadata } from "@/lib/oauth-metadata";

/**
 * RFC 8414 discovery. A client is given one URL and finds everything else from here, which
 * is what makes "paste this and press Connect" work.
 *
 * The document describes the host it was fetched from, because every tenant has its own
 * subdomain and a client checks that the issuer matches where it looked. `Vary: Host` so a
 * cache never serves one tenant's document to another.
 */
export function GET(req: NextRequest) {
  return NextResponse.json(authorizationServerMetadata(req.headers.get("host")), {
    headers: {
      // Public, non-secret, and read on every connection attempt.
      "Cache-Control": "public, max-age=3600",
      Vary: "Host",
    },
  });
}
