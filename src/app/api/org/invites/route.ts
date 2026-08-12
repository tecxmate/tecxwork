import { and, desc, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAgency, clientIp } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { orgInvites } from "@/lib/db/schema";
import { inviteMember, seatsUsed } from "@/lib/provisioning";
import { getTenantById } from "@/lib/tenant";
import { parseJsonBody } from "@/lib/validation";
import { createInviteSchema } from "@/lib/validation-provisioning";

/**
 * Seat management inside a workspace.
 *
 * The platform provisions the org and its first admin; from here the customer runs their
 * own team. `member:invite` is admin-only (see permissions.ts) because every invitation
 * consumes a contracted seat.
 */

/** Pending invitations plus the seat budget, which is what the screen actually needs. */
export async function GET() {
  const gate = await requireAgency("member:invite");
  if (!gate.ok) return gate.response;
  const { orgId } = gate.actor;

  const rows = await getDb()
    .select({
      id: orgInvites.id,
      email: orgInvites.email,
      role: orgInvites.role,
      expiresAt: orgInvites.expiresAt,
      createdAt: orgInvites.createdAt,
    })
    .from(orgInvites)
    .where(
      and(
        eq(orgInvites.orgId, orgId),
        isNull(orgInvites.acceptedAt),
        isNull(orgInvites.revokedAt)
      )
    )
    .orderBy(desc(orgInvites.createdAt));

  const org = await getTenantById(orgId);

  return NextResponse.json({
    invites: rows,
    seats: {
      limit: org?.seatLimit ?? 0,
      used: await seatsUsed(orgId),
    },
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAgency("member:invite");
  if (!gate.ok) return gate.response;
  const { orgId, userId } = gate.actor;

  const parsed = await parseJsonBody(req, createInviteSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const result = await inviteMember({
    orgId,
    email: body.email,
    role: body.role,
    invitedByUserId: userId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // The email address is the field name, never the value — the audit trail deliberately
  // holds no PII so that a later erasure never has to rewrite it.
  await logAudit({
    orgId,
    actorUserId: userId,
    action: "create",
    entityType: "org_invite",
    entityId: result.data.id,
    fieldNames: ["email", "role"],
    metadata: { role: body.role },
    ip: clientIp(req),
  });

  return NextResponse.json(
    {
      invite: {
        id: result.data.id,
        expiresAt: result.data.expiresAt,
        // Returned once and never retrievable again: only its hash is stored. The caller
        // puts this in the invitation link.
        token: result.data.token,
      },
    },
    { status: 201 }
  );
}
