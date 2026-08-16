import { NextRequest, NextResponse } from "next/server";
import { getAgencyActor } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/agency-auth";
import { getClient, isAcceptableRedirect, issueAuthCode } from "@/lib/oauth";
import { isSupportedScope } from "@/lib/oauth-metadata";
import { capabilitiesFor, type Capability } from "@/lib/permissions";

/**
 * Approval — the POST target of the consent form.
 *
 * Everything is re-checked here rather than trusted from the form. The hidden fields on a
 * page are attacker-controlled input like any other, and a consent screen that trusts its
 * own form is a consent screen that can be forged into granting scopes nobody saw.
 */
export async function POST(req: NextRequest) {
  // Cross-site forgery check, before anything reads the session. This is the one form POST
  // in the app that grants access, and PKCE does not help here: an attacker who forges this
  // request generated the verifier themselves, so a code issued to their client is a code
  // they can spend.
  //
  // The session cookie is `SameSite=Lax`, which already stops a cross-site form POST from
  // carrying it. This is not redundant with that. Lax treats every subdomain of the same
  // registrable domain as same-site, and this product puts a tenant on each subdomain — so
  // "same-site" is a wider circle here than in a single-domain app, and the check that
  // matters is same-*origin*.
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 403 });
  }

  const actor = await getAgencyActor();
  if (!actor) {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  const form = new URLSearchParams(await req.text());
  const clientId = form.get("client_id") ?? "";
  const redirectUri = form.get("redirect_uri") ?? "";
  const state = form.get("state") ?? "";
  const codeChallenge = form.get("code_challenge") ?? "";
  const requested = (form.get("scope") ?? "").split(/\s+/).filter(Boolean);

  const client = await getClient(clientId);
  if (!client) {
    return NextResponse.json({ error: "invalid_client" }, { status: 400 });
  }
  // Re-validated: this is the value that decides where a credential is delivered.
  if (!client.redirectUris.includes(redirectUri) || !isAcceptableRedirect(redirectUri)) {
    return NextResponse.json({ error: "invalid_redirect_uri" }, { status: 400 });
  }

  // Re-intersected with what this member holds, for the same reason.
  const held = capabilitiesFor(actor.role);
  const scopes = requested
    .filter(isSupportedScope)
    .filter((s) => held.includes(s as Capability)) as Capability[];

  if (scopes.length === 0) {
    return NextResponse.json({ error: "invalid_scope" }, { status: 400 });
  }

  const result = await issueAuthCode({
    clientId,
    orgId: actor.orgId,
    userId: actor.userId,
    scopes,
    redirectUri,
    codeChallenge,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, error_description: result.description },
      { status: 400 }
    );
  }

  await logAudit({
    orgId: actor.orgId,
    actorUserId: actor.userId,
    action: "oauth_consent",
    entityType: "oauth_client",
    fieldNames: ["scopes"],
    metadata: { clientId, scopes },
    ip: clientIp(req),
  });

  const target = new URL(redirectUri);
  target.searchParams.set("code", result.data.code);
  if (state) target.searchParams.set("state", state);

  // 303 so the browser follows with GET rather than re-POSTing to the client.
  return NextResponse.redirect(target.toString(), { status: 303 });
}

/**
 * Did this POST come from a page on this exact origin?
 *
 * Browsers send `Origin` on every POST and `Sec-Fetch-Site` on every request, so a forged
 * submission from another page announces itself. Hosts are compared rather than full
 * origins because the deployment sits behind a proxy that can terminate TLS — comparing
 * schemes would reject honest requests whose internal URL is `http` while the browser saw
 * `https`.
 *
 * A request carrying neither header is allowed: those are non-browser callers (curl, a
 * test), which are not the threat — CSRF needs a victim's browser and its cookies.
 */
function sameOrigin(req: NextRequest): boolean {
  // `same-site` is deliberately refused alongside `cross-site`: a tenant subdomain is
  // same-site with the app and must not be able to submit this form.
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;

  const origin = req.headers.get("origin");
  if (!origin) return true;
  if (origin === "null") return false; // a sandboxed iframe or a `data:` document

  try {
    return new URL(origin).host === (req.headers.get("host") ?? new URL(req.url).host);
  } catch {
    return false;
  }
}
