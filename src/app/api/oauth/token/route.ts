import { NextRequest, NextResponse } from "next/server";
import { clientIp } from "@/lib/agency-auth";
import { exchangeAuthCode, refreshTokens } from "@/lib/oauth";
import { rateLimit } from "@/lib/rate-limit";

/**
 * The token endpoint.
 *
 * Takes `application/x-www-form-urlencoded`, as the spec requires — an MCP client will send
 * a form, not JSON, and accepting only JSON here is a common reason a connector silently
 * fails to complete.
 *
 * Errors use OAuth's own codes (`invalid_grant`, `invalid_client`) rather than this app's
 * shapes, because the client is a library that switches on them.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req) ?? "unknown";
  // Brute-forcing a code or a refresh token is the attack this endpoint faces.
  const limited = await rateLimit(ip, "auth", "oauth-token");
  if (!limited.success) {
    return NextResponse.json(
      { error: "temporarily_unavailable", error_description: "Too many attempts." },
      { status: 429 }
    );
  }

  let form: URLSearchParams;
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      // Tolerated because some clients send it, even though the spec says form-encoded.
      form = new URLSearchParams(Object.entries(await req.json()));
    } else {
      form = new URLSearchParams(await req.text());
    }
  } catch {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Unreadable request body." },
      { status: 400 }
    );
  }

  const grantType = form.get("grant_type");
  const clientId = form.get("client_id");
  if (!clientId) {
    return NextResponse.json(
      { error: "invalid_client", error_description: "client_id is required." },
      { status: 400 }
    );
  }

  if (grantType === "authorization_code") {
    const result = await exchangeAuthCode({
      code: form.get("code") ?? "",
      clientId,
      clientSecret: form.get("client_secret"),
      redirectUri: form.get("redirect_uri") ?? "",
      codeVerifier: form.get("code_verifier") ?? "",
    });
    return tokenResponse(result);
  }

  if (grantType === "refresh_token") {
    const result = await refreshTokens({
      refreshToken: form.get("refresh_token") ?? "",
      clientId,
    });
    return tokenResponse(result);
  }

  return NextResponse.json(
    {
      error: "unsupported_grant_type",
      error_description: "Only authorization_code and refresh_token are supported.",
    },
    { status: 400 }
  );
}

type Result = Awaited<ReturnType<typeof exchangeAuthCode>>;

function tokenResponse(result: Result): NextResponse {
  if (!result.ok) {
    // 400 for everything, per RFC 6749 §5.2 — a 401 here invites clients to retry with
    // different client credentials, which is not the problem.
    return NextResponse.json(
      { error: result.error, error_description: result.description },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      access_token: result.data.accessToken,
      token_type: "Bearer",
      expires_in: result.data.expiresIn,
      refresh_token: result.data.refreshToken,
      scope: result.data.scopes.join(" "),
    },
    // Tokens must never be cached, by anything, anywhere.
    { status: 200, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } }
  );
}
