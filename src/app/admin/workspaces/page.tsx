import { desc, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { memberships, orgs } from "@/lib/db/schema";
import { planCatalog } from "@/lib/provisioning";
import { WorkspacesConsole } from "./workspaces-console";

/**
 * Platform-owner tenant administration.
 *
 * The proxy already keeps non-admins out of /admin, but that is an optimistic redirect and
 * not the boundary — this page loads customer commercial data, so it re-checks server-side.
 */
export default async function WorkspacesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login");

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
      memberCount: sql<number>`(
        select count(*)::int from ${memberships} where ${memberships.orgId} = ${orgs.id}
      )`,
    })
    .from(orgs)
    .orderBy(desc(orgs.createdAt));

  return (
    <WorkspacesConsole
      initialWorkspaces={rows.map((row) => ({
        ...row,
        trialEndsAt: row.trialEndsAt ? row.trialEndsAt.toISOString() : null,
      }))}
      plans={planCatalog()}
    />
  );
}
