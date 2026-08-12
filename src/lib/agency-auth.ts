import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRecruiterFromSession } from "@/lib/auth";
import { memberships, recruiters } from "@/lib/db/schema";
import type { MemberRole } from "@/lib/ats-auth";
import { can, type Capability } from "@/lib/permissions";
import { planAllows } from "@/lib/plans";
import { getTenant, getTenantById, tenantBlock } from "@/lib/tenant";

export type AgencyActor = {
  orgId: number;
  recruiterId: number;
  userId: number;
  role: MemberRole;
  /** The tenant's plan, so a caller can shape the UI to what was actually bought. */
  plan: string;
};

/**
 * The single gate every agency request goes through.
 *
 * Three things have to be true and each is easy to forget at a call site: the caller must be
 * an AGENCY recruiter (a client-company recruiter must never create clients or job orders),
 * every row written or read has to be filtered by that recruiter's `orgId`, and their role in
 * the org has to actually permit the action. Returning the orgId and role here — rather than
 * letting each route look them up — is what makes "did we scope this query?" and "was this
 * allowed?" answerable by reading one function instead of twelve.
 *
 * Pass the capability the route needs. Omitting it authenticates the tenant but authorizes
 * nothing, which is only right for a request that reveals nothing on its own.
 *
 * Returns a ready-to-send 401/403 rather than throwing, so routes stay flat.
 */
export async function requireAgency(
  capability?: Capability
): Promise<{ ok: true; actor: AgencyActor } | { ok: false; response: NextResponse }> {
  const result = await resolveAgencyActor(capability);
  if (result.ok) return result;
  return {
    ok: false,
    response: NextResponse.json({ error: result.error }, { status: result.status }),
  };
}

/**
 * The same gate for server components, which render a page rather than return a status.
 *
 * Pages need this because they load agency data directly instead of going through the API —
 * which is exactly how the candidate database ended up readable by client-company recruiters:
 * the route was guarded and the page that showed the same rows was not.
 */
export async function getAgencyActor(
  capability?: Capability
): Promise<AgencyActor | null> {
  const result = await resolveAgencyActor(capability);
  return result.ok ? result.actor : null;
}

type Resolution =
  | { ok: true; actor: AgencyActor }
  | { ok: false; error: string; status: 401 | 403 };

async function resolveAgencyActor(capability?: Capability): Promise<Resolution> {
  const auth = await getRecruiterFromSession();
  if (!auth) return { ok: false, error: "Not signed in", status: 401 };

  const db = getDb();
  const [me] = await db
    .select({ clientKind: recruiters.clientKind, orgId: recruiters.orgId })
    .from(recruiters)
    .where(eq(recruiters.id, auth.recruiterId))
    .limit(1);

  if (!me || me.clientKind !== "agency" || me.orgId == null) {
    return {
      ok: false,
      error: "This action is only available to agency accounts.",
      status: 403,
    };
  }

  // The host, when it names a tenant, decides which workspace this request is for — and a
  // signed-in user reaching a workspace they do not belong to is refused rather than
  // silently served their own. On the apex domain (and in tests) no tenant is named and the
  // user's own org stands, which is what keeps single-domain access working.
  const tenant = await getTenant();
  if (tenant && tenant.id !== me.orgId) {
    return {
      ok: false,
      error: "You do not have access to this workspace.",
      status: 403,
    };
  }

  // Commercial state gates everything before role does. A suspended tenant or a lapsed
  // trial is not a permissions problem, and answering "your role does not allow this" when
  // the real answer is "the subscription ended" sends people to the wrong person.
  const org = tenant ?? (await getTenantById(me.orgId));
  if (!org) return { ok: false, error: "Workspace not found.", status: 403 };

  const blocked = tenantBlock(org);
  if (blocked) return { ok: false, error: blocked.message, status: 403 };

  // The membership — not the session — carries the org role. Scope the lookup to the org we
  // just resolved: a user could hold memberships in several orgs, and the role that matters
  // is the one for the tenant they are acting in.
  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(
      and(eq(memberships.userId, auth.session.userId), eq(memberships.orgId, me.orgId))
    )
    .limit(1);

  // No membership means no role, and no role means no permissions. Denying is the only safe
  // reading — inferring one from the recruiter row would hand out authority by accident.
  if (!membership) {
    return {
      ok: false,
      error: "You are not a member of this organisation.",
      status: 403,
    };
  }

  const role = membership.role as MemberRole;

  // Entitlement before permission, for the same reason: "not on your plan" and "not your
  // job" are different problems with different fixes. Deriving the feature from the
  // capability the route already declares means every existing route gained plan
  // enforcement without being edited.
  if (capability && !planAllows(org.plan, capability)) {
    return {
      ok: false,
      error: "This feature is not included in your current plan.",
      status: 403,
    };
  }

  if (capability && !can(role, capability)) {
    return { ok: false, error: "Your role does not allow this action.", status: 403 };
  }

  return {
    ok: true,
    actor: {
      orgId: me.orgId,
      recruiterId: auth.recruiterId,
      userId: auth.session.userId,
      role,
      plan: org.plan,
    },
  };
}

/** Client IP for the audit trail, best-effort. */
export function clientIp(req: Request): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}
