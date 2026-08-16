import { NextResponse } from "next/server";
import { protectedResourceMetadata } from "@/lib/oauth-metadata";

/**
 * RFC 9728. Tells a client which authorization server guards `/api/mcp`, so a 401 there can
 * be turned into a sign-in rather than a dead end.
 */
export function GET() {
  return NextResponse.json(protectedResourceMetadata(), {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
