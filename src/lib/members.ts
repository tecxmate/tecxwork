import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { memberships, orgInvites, orgs, recruiters, users } from "@/lib/db/schema";
import type { MemberRole } from "@/lib/ats-auth";
import { seatsUsed, type ProvisionResult } from "@/lib/provisioning";

/**
 * Who is in a workspace, and the operations on that list.
 *
 * Actor-free like `provisioning.ts` — every function takes the org it acts on rather than
 * reading a session, so the same code serves a route, a script, a test, or a connector.
 */

export type MemberRow = {
  userId: number;
  name: string;
  email: string;
  role: MemberRole;
  joinedAt: Date;
};

export type PendingInvite = {
  id: number;
  email: string;
  role: MemberRole;
  expiresAt: Date;
};

export type TeamView = {
  members: MemberRow[];
  invites: PendingInvite[];
  seats: { limit: number; used: number };
};

export async function getTeam(orgId: number): Promise<TeamView> {
  const db = getDb();

  const members = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      role: memberships.role,
      joinedAt: memberships.createdAt,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.orgId, orgId))
    .orderBy(asc(memberships.createdAt));

  const invites = await db
    .select({
      id: orgInvites.id,
      email: orgInvites.email,
      role: orgInvites.role,
      expiresAt: orgInvites.expiresAt,
    })
    .from(orgInvites)
    .where(
      and(
        eq(orgInvites.orgId, orgId),
        isNull(orgInvites.acceptedAt),
        isNull(orgInvites.revokedAt),
        gt(orgInvites.expiresAt, new Date())
      )
    )
    .orderBy(asc(orgInvites.createdAt));

  const [org] = await db
    .select({ seatLimit: orgs.seatLimit })
    .from(orgs)
    .where(eq(orgs.id, orgId))
    .limit(1);

  return {
    members: members.map((m) => ({ ...m, role: m.role as MemberRole })),
    invites: invites.map((i) => ({ ...i, role: i.role as MemberRole })),
    seats: { limit: org?.seatLimit ?? 0, used: await seatsUsed(orgId) },
  };
}

/** How many admins the org has. The number that must never reach zero. */
async function adminCount(orgId: number): Promise<number> {
  const rows = await getDb()
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(and(eq(memberships.orgId, orgId), eq(memberships.role, "admin")));
  return rows.length;
}

/**
 * Change a member's role.
 *
 * Refuses to demote the last admin. A workspace with no admin cannot invite, cannot change
 * anyone's role, and cannot recover on its own — it would need platform support to fix, and
 * the click that causes it looks entirely ordinary.
 */
export async function changeMemberRole(
  orgId: number,
  userId: number,
  role: MemberRole
): Promise<ProvisionResult<{ userId: number; role: MemberRole }>> {
  const db = getDb();

  const [current] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.orgId, orgId), eq(memberships.userId, userId)))
    .limit(1);
  if (!current) return { ok: false, error: "That person is not a member.", status: 404 };

  if (current.role === "admin" && role !== "admin" && (await adminCount(orgId)) <= 1) {
    return {
      ok: false,
      error: "This workspace needs at least one administrator. Promote someone else first.",
      status: 409,
    };
  }

  await db
    .update(memberships)
    .set({ role })
    .where(and(eq(memberships.orgId, orgId), eq(memberships.userId, userId)));

  return { ok: true, data: { userId, role } };
}

/**
 * Remove someone from a workspace, releasing their seat.
 *
 * The membership goes; the recruiter row and everything it owns — jobs, applications,
 * placements — stays. Removing a person must never orphan the work they did, and a
 * departure is not an erasure (which is a separate, deliberate PIPA operation).
 */
export async function removeMember(
  orgId: number,
  userId: number
): Promise<ProvisionResult<{ userId: number }>> {
  const db = getDb();

  const [current] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.orgId, orgId), eq(memberships.userId, userId)))
    .limit(1);
  if (!current) return { ok: false, error: "That person is not a member.", status: 404 };

  if (current.role === "admin" && (await adminCount(orgId)) <= 1) {
    return {
      ok: false,
      error: "This workspace needs at least one administrator. Promote someone else first.",
      status: 409,
    };
  }

  await db
    .delete(memberships)
    .where(and(eq(memberships.orgId, orgId), eq(memberships.userId, userId)));

  // Unlink the recruiter row from the org so a future invitation to a different workspace
  // is not refused as "already belongs to another workspace" — without this, leaving an
  // org would permanently strand the account.
  await db
    .update(recruiters)
    .set({ orgId: null })
    .where(and(eq(recruiters.userId, userId), eq(recruiters.orgId, orgId)));

  return { ok: true, data: { userId } };
}
