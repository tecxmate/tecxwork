import { NextRequest, NextResponse } from "next/server";
import { protectedResourceMetadata } from "@/lib/oauth-metadata";

/**
 * RFC 9728. Tells a client which authorization server guards `/api/mcp`, so a 401 there can
 * be turned into a sign-in rather than a dead end.
 *
 * Describes the host it was fetched from, for the same reason as the authorization-server
 * document: the `/api/mcp` 401 points here using the host the request arrived on, so
 * answering with a different origin would make one flow contradict itself.
 */
export function GET(req: NextRequest) {
  return NextResponse.json(protectedResourceMetadata(req.headers.get("host")), {
    headers: { "Cache-Control": "public, max-age=3600", Vary: "Host" },
  });
}
