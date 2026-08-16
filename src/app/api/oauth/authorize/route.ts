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
