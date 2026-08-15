import { NextRequest, NextResponse } from "next/server";
import { requireAgency, clientIp } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import { changeMemberRole, getTeam, removeMember } from "@/lib/members";
import { parseJsonBody } from "@/lib/validation";
import {
  removeMemberSchema,
  updateMemberRoleSchema,
} from "@/lib/validation-provisioning";

/** The workspace's people, pending invitations, and seat budget. */
export async function GET() {
  const gate = await requireAgency("member:invite");
  if (!gate.ok) return gate.response;

  return NextResponse.json(await getTeam(gate.actor.orgId));
}

export async function PATCH(req: NextRequest) {
  const gate = await requireAgency("member:invite");
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.actor;

  const parsed = await parseJsonBody(req, updateMemberRoleSchema);
  if (!parsed.ok) return parsed.response;

  const result = await changeMemberRole(orgId, parsed.data.userId, parsed.data.role);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await logAudit({
    orgId,
    actorUserId: userId,
    action: "update",
    entityType: "membership",
    entityId: parsed.data.userId,
    fieldNames: ["role"],
    metadata: { role: parsed.data.role },
    ip: clientIp(req),
  });

  return NextResponse.json({ member: result.data });
}

/**
 * Remove a member, releasing their seat.
 *
 * Scoped to the caller's org inside `removeMember`, so a user id from another tenant reads
 * as "not a member" rather than confirming that the account exists.
 */
export async function DELETE(req: NextRequest) {
  const gate = await requireAgency("member:invite");
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.actor;

  const parsed = await parseJsonBody(req, removeMemberSchema);
  if (!parsed.ok) return parsed.response;

  const result = await removeMember(orgId, parsed.data.userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await logAudit({
    orgId,
    actorUserId: userId,
    action: "remove",
    entityType: "membership",
    entityId: parsed.data.userId,
    ip: clientIp(req),
  });

  return NextResponse.json({ removed: result.data.userId });
}
