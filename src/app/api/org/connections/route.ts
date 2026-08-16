import { NextRequest, NextResponse } from "next/server";
import { requireAgency, clientIp } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import { listGrants, revokeGrant } from "@/lib/oauth";
import { can } from "@/lib/permissions";

/**
 * Connected applications — the screen the consent copy promises.
 *
 * "You can revoke this at any time from your workspace settings" is a sentence on the OAuth
 * consent page. Without this route it would be false, and a false promise on a consent
 * screen is worse than no promise at all.
 *
 * **Who sees what.** Anyone sees the applications *they* connected, because a person who
 * approved a grant must be able to withdraw it without needing an administrator. Holders of
 * `member:invite` see every grant in the workspace, because an application reading the
 * workspace's data is the workspace's business, not only the granter's — the same reasoning
 * that puts API keys behind that capability.
 *
 * There is no capability argument on the gate, so the requirement is only "an active member
 * of an active, in-plan workspace". That is deliberate: revoking access is never a
 * privileged action, and gating it would strand exactly the people who most need it.
 */
export async function GET() {
  const gate = await requireAgency();
  if (!gate.ok) return gate.response;
  const { orgId, userId, role } = gate.actor;

  const all = await listGrants(orgId);
  const visible = can(role, "member:invite")
    ? all
    : all.filter((grant) => grant.userId === userId);

  return NextResponse.json({
    connections: visible.map((grant) => ({
      clientId: grant.clientId,
      clientName: grant.clientName,
      userId: grant.userId,
      userName: grant.userName,
      userEmail: grant.userEmail,
      scopes: grant.scopes,
      grantedAt: grant.grantedAt.toISOString(),
      expiresAt: grant.expiresAt.toISOString(),
      /** Whether this viewer may revoke it — the button follows the server's rule. */
      revocable: grant.userId === userId || can(role, "member:invite"),
    })),
  });
}

/**
 * Revoke one connection. Immediate: `resolveOAuthActor` re-reads the row on every request,
 * so the application's next call fails rather than its next hour.
 */
export async function DELETE(req: NextRequest) {
  const gate = await requireAgency();
  if (!gate.ok) return gate.response;
  const { orgId, userId, role } = gate.actor;

  let body: { clientId?: unknown; userId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const clientId = typeof body.clientId === "string" ? body.clientId : "";
  // Omitted means "mine" — the common case, and the one that needs no privilege.
  const targetUserId =
    typeof body.userId === "number" && Number.isInteger(body.userId)
      ? body.userId
      : userId;

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }
  if (targetUserId !== userId && !can(role, "member:invite")) {
    return NextResponse.json(
      { error: "Only an administrator can revoke someone else's connection." },
      { status: 403 }
    );
  }

  // Scoped to the caller's org, so a client id from another tenant revokes nothing and
  // reports the same success — it cannot be used to probe whether that grant exists.
  await revokeGrant(orgId, targetUserId, clientId);

  await logAudit({
    orgId,
    actorUserId: userId,
    action: "revoke",
    entityType: "oauth_grant",
    entityId: targetUserId,
    ip: clientIp(req),
  });

  return NextResponse.json({ revoked: clientId });
}
