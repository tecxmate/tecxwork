import { and, desc, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireAgency, clientIp } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { orgInvites, users } from "@/lib/db/schema";
import { buildInviteUrl, sendOrgInviteEmail } from "@/lib/email";
import { inviteMember, seatsUsed } from "@/lib/provisioning";
import { getTenantById } from "@/lib/tenant";
import { parseJsonBody } from "@/lib/validation";
import { createInviteSchema } from "@/lib/validation-provisioning";

/** Human-readable role names for the invitation email. */
const ROLE_LABELS: Record<string, string> = {
  admin: "an administrator",
  account_manager: "an account manager",
  recruiter: "a recruiter",
  hiring_manager: "a hiring manager",
  interviewer: "an interviewer",
  coordinator: "a coordinator",
  viewer: "a viewer",
};

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

  const org = await getTenantById(orgId);
  const [inviter] = await getDb()
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const sent = await sendOrgInviteEmail({
    email: body.email,
    orgName: org?.name ?? "your workspace",
    orgSlug: org?.slug ?? "",
    roleLabel: ROLE_LABELS[body.role] ?? body.role,
    inviterName: inviter?.name ?? null,
    token: result.data.token,
    expiresAt: result.data.expiresAt,
  });

  return NextResponse.json(
    {
      invite: {
        id: result.data.id,
        expiresAt: result.data.expiresAt,
        emailSent: sent,
        // The raw token exists in exactly one place once the email is away, and only its
        // hash is stored. It is returned here ONLY when the send failed — otherwise an
        // admin whose mail bounced would have no way to pass the link on, and the
        // alternative (revoke and re-invite) burns a seat round trip for a mail outage.
        ...(sent ? {} : { token: result.data.token, url: buildInviteUrl(org?.slug ?? "", result.data.token) }),
      },
    },
    { status: 201 }
  );
}
