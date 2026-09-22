import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { membershipRole, recruiterIdForUser } from "@/lib/request-cache";

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

  // Both memoised per request on the user id — see lib/request-cache.ts. getMember()
  // itself is deliberately NOT memoised: it reads the session, and a memo keyed on
  // nothing is the one shape that could serve one request's answer to another.
  //
  // They run together rather than in sequence. Neither needs the other's result, and
  // on Neon each is a WebSocket round trip, so awaiting them one after the other cost
  // a round trip on every ATS route for nothing.
  const [m, recruiterId] = await Promise.all([
    membershipRole(session.userId),
    recruiterIdForUser(session.userId),
  ]);
  if (!m) return null;

  return {
    userId: session.userId,
    email: session.email,
    orgId: m.orgId,
    role: m.role as MemberRole,
    recruiterId,
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

export type AppAuthz =
  | { error: string; status: 401 | 403 | 404 }
  | {
      member: Member;
      app: {
        id: number;
        recruiterId: number;
        orgId: number | null;
        applicantId: number;
      };
    };

/**
 * Authorize access to one application: must be an org member; the application
 * must be in their org (tenant isolation); non-managers only their own
 * recruiter's applications. Shared by the stage-move / timeline / scorecard
 * routes.
 */
export async function authorizeApplication(applicationId: number): Promise<AppAuthz> {
  const member = await getMember();
  if (!member) return { error: "Unauthorized", status: 401 };

  const db = getDb();
  const [app] = await db
    .select({
      id: applications.id,
      recruiterId: applications.recruiterId,
      orgId: applications.orgId,
      applicantId: applications.applicantId,
    })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);
  if (!app) return { error: "Application not found", status: 404 };
  if (app.orgId !== null && app.orgId !== member.orgId)
    return { error: "Forbidden", status: 403 };
  if (!isOrgManager(member.role) && app.recruiterId !== member.recruiterId)
    return { error: "Forbidden", status: 403 };
  return { member, app };
}
