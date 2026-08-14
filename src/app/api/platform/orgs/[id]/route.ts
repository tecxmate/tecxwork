import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/agency-auth";
import { seatsUsed, updateOrgPlan } from "@/lib/provisioning";
import { getTenantById } from "@/lib/tenant";
import { parseJsonBody } from "@/lib/validation";
import { updateOrgSchema } from "@/lib/validation-provisioning";

/** One tenant's commercial state — the closest thing to a billing screen the platform has. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = Number((await params).id);
  if (!Number.isInteger(orgId) || orgId < 1) {
    return NextResponse.json({ error: "Invalid workspace id" }, { status: 400 });
  }

  const org = await getTenantById(orgId);
  if (!org) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  return NextResponse.json({ org, seatsUsed: await seatsUsed(orgId) });
}

/**
 * Change plan, seats, status or trial end.
 *
 * This is where every commercial decision lands, and with no payment processor wired it is
 * also the whole billing system: an upgrade is a plan write, a non-payment is
 * `status: "suspended"`, a churn is `status: "cancelled"`. When a gateway does arrive it
 * calls the same function on webhook receipt.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = Number((await params).id);
  if (!Number.isInteger(orgId) || orgId < 1) {
    return NextResponse.json({ error: "Invalid workspace id" }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, updateOrgSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const result = await updateOrgPlan(orgId, {
    plan: body.plan,
    seatLimit: body.seatLimit,
    status: body.status,
    billingEmail: body.billingEmail,
    trialEndsAt:
      body.trialEndsAt === undefined
        ? undefined
        : body.trialEndsAt === null
          ? null
          : new Date(body.trialEndsAt),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await logAudit({
    orgId,
    actorUserId: session.userId,
    action: "update",
    entityType: "org",
    entityId: orgId,
    fieldNames: Object.keys(body),
    metadata: { plan: result.data.plan, seatLimit: result.data.seatLimit, status: result.data.status },
    ip: clientIp(req),
  });

  return NextResponse.json({ org: result.data });
}
