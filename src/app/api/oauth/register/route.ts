import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerClient } from "@/lib/oauth";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/agency-auth";
import { parseJsonBody } from "@/lib/validation";

/**
 * Dynamic client registration (RFC 7591).
 *
 * Deliberately unauthenticated — an MCP client registers before any human is involved, and
 * requiring a credential here would mean an administrator in the loop, which is the friction
 * the whole OAuth flow exists to remove.
 *
 * That is safe because registering grants nothing: a fresh client can reach no data until a
 * signed-in member approves a scope at the consent screen. Rate limited per IP because an
 * open endpoint that writes rows is otherwise a way to fill a table.
 */
const registerSchema = z.object({
  client_name: z.string().trim().min(1).max(200),
  redirect_uris: z.array(z.string()).min(1).max(10),
  /** RFC 7591; we only support the code grant, so anything else is refused. */
  grant_types: z.array(z.string()).optional(),
  token_endpoint_auth_method: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req) ?? "unknown";
  const limited = await rateLimit(ip, "auth", "oauth-register");
  if (!limited.success) {
    return NextResponse.json(
      { error: "temporarily_unavailable", error_description: "Too many registrations." },
      { status: 429 }
    );
  }

  const parsed = await parseJsonBody(req, registerSchema);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "invalid_client_metadata", error_description: "Invalid registration request." },
      { status: 400 }
    );
  }
  const body = parsed.data;

  if (body.grant_types?.some((g) => g !== "authorization_code" && g !== "refresh_token")) {
    return NextResponse.json(
      {
        error: "invalid_client_metadata",
        error_description: "Only authorization_code and refresh_token are supported.",
      },
      { status: 400 }
    );
  }

  const result = await registerClient({
    name: body.client_name,
    redirectUris: body.redirect_uris,
    wantsSecret: body.token_endpoint_auth_method === "client_secret_post",
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, error_description: result.description },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      client_id: result.data.clientId,
      ...(result.data.clientSecret ? { client_secret: result.data.clientSecret } : {}),
      client_name: body.client_name,
      redirect_uris: body.redirect_uris,
      grant_types: ["authorization_code", "refresh_token"],
      token_endpoint_auth_method: result.data.clientSecret ? "client_secret_post" : "none",
    },
    { status: 201 }
  );
}
