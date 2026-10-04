import { NextRequest, NextResponse } from "next/server";
import { requireAgency, clientIp } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import { revokeApiKey } from "@/lib/api-keys";

/**
 * Revoke a key. Immediate: `resolveApiKeyActor` re-reads the row on every request, so a
 * revoked key stops working on the next call rather than at the end of some cache window.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAgency("member:invite");
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.actor;

  const keyId = Number((await params).id);
  if (!Number.isInteger(keyId) || keyId < 1) {
    return NextResponse.json({ error: "Invalid key id" }, { status: 400 });
  }

  // Scoped to the caller's org inside revokeApiKey, so an id from another tenant reads as
  // "no such key" rather than confirming it exists.
  const result = await revokeApiKey(orgId, keyId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await logAudit({
    orgId,
    actorUserId: userId,
    action: "revoke",
    entityType: "api_key",
    entityId: keyId,
    ip: clientIp(req),
  });

  return NextResponse.json({ revoked: result.data.id });
}
