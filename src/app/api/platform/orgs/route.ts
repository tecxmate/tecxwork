import { desc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { memberships, orgs } from "@/lib/db/schema";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/agency-auth";
import { createOrg, planCatalog } from "@/lib/provisioning";
import { parseJsonBody } from "@/lib/validation";
import { createOrgSchema } from "@/lib/validation-provisioning";

/**
 * Platform-owner tenant administration.
 *
 * Onboarding is sales-led: nobody creates their own workspace, so these routes are gated on
 * the platform admin role (`users.role === "admin"`) rather than on any org membership.
 * That is a different axis from the tenant RBAC in `permissions.ts` — an org admin runs
 * their workspace, a platform admin decides which workspaces exist.
 */

/** Every tenant with its commercial state and seats filled. */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getDb()
    .select({
      id: orgs.id,
      name: orgs.name,
      slug: orgs.slug,
      kind: orgs.kind,
      status: orgs.status,
      plan: orgs.plan,
      seatLimit: orgs.seatLimit,
      trialEndsAt: orgs.trialEndsAt,
      billingEmail: orgs.billingEmail,
      createdAt: orgs.createdAt,
      memberCount: sql<number>`(
        select count(*)::int from ${memberships} where ${memberships.orgId} = ${orgs.id}
      )`,
    })
    .from(orgs)
    .orderBy(desc(orgs.createdAt));

  return NextResponse.json({ orgs: rows, plans: planCatalog() });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(req, createOrgSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const result = await createOrg({
    name: body.name,
    slug: body.slug,
    kind: body.kind,
    plan: body.plan,
    seatLimit: body.seatLimit,
    billingEmail: body.billingEmail ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await logAudit({
    orgId: result.data.id,
    actorUserId: session.userId,
    action: "create",
    entityType: "org",
    entityId: result.data.id,
    fieldNames: Object.keys(body),
    metadata: { slug: result.data.slug, plan: result.data.plan, seatLimit: result.data.seatLimit },
    ip: clientIp(req),
  });

  return NextResponse.json({ org: result.data }, { status: 201 });
}

/**
 * Deliberately no DELETE. A workspace holds placements, invoices and compliance evidence
 * that outlive the relationship; closing one is `status: "cancelled"` via PATCH on
 * ./[id]/route.ts, which stops access without destroying the record an audit would ask for.
 */
