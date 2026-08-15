import { NextRequest, NextResponse } from "next/server";
import { requireAgency, clientIp } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import { revokeInvite } from "@/lib/provisioning";

/** Withdraw a pending invitation, releasing its seat. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAgency("member:invite");
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.actor;

  const inviteId = Number((await params).id);
  if (!Number.isInteger(inviteId) || inviteId < 1) {
    return NextResponse.json({ error: "Invalid invitation id" }, { status: 400 });
  }

  // Scoped to the caller's org inside revokeInvite, so an id from another tenant reads as
  // "no pending invitation" rather than revealing that it exists.
  const result = await revokeInvite(orgId, inviteId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await logAudit({
    orgId,
    actorUserId: userId,
    action: "revoke",
    entityType: "org_invite",
    entityId: inviteId,
    ip: clientIp(req),
  });

  return NextResponse.json({ revoked: result.data.id });
}
