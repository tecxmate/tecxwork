import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { memberships, recruiters } from "@/lib/db/schema";

export type MemberRole =
  | "admin"
  | "account_manager"
  | "recruiter"
  | "hiring_manager"
  | "interviewer"
  | "coordinator"
  | "viewer";

export type Member = {
  userId: number;
  email: string;
  orgId: number;
  role: MemberRole;
  recruiterId: number | null; // the recruiter row for this user, if any
};

/**
 * Resolve the logged-in user's org membership (tenant + role) and their
 * recruiter row. The org/role — not the raw session — is the authorization
 * source of truth for ATS actions. Returns null when there is no session or the
 * user has no membership.
 */
export async function getMember(): Promise<Member | null> {
  const session = await getSession();
  if (!session) return null;

  const db = getDb();
  const [m] = await db
    .select({ orgId: memberships.orgId, role: memberships.role })
    .from(memberships)
    .where(eq(memberships.userId, session.userId))
    .limit(1);
  if (!m) return null;

  const [r] = await db
    .select({ id: recruiters.id })
    .from(recruiters)
    .where(eq(recruiters.userId, session.userId))
    .limit(1);

  return {
    userId: session.userId,
    email: session.email,
    orgId: m.orgId,
    role: m.role as MemberRole,
    recruiterId: r?.id ?? null,
  };
}

/**
 * Org-wide managers act across the whole org pipeline; everyone else is scoped
 * to rows they own (their own recruiter's applications).
 */
export function isOrgManager(role: MemberRole): boolean {
  return role === "admin" || role === "account_manager";
}

const STAGE_MOVE_ROLES: readonly MemberRole[] = [
  "admin",
  "account_manager",
  "recruiter",
  "hiring_manager",
  "coordinator",
];

export function canMoveStage(role: MemberRole): boolean {
  return STAGE_MOVE_ROLES.includes(role);
}
