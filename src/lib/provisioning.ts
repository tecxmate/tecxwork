import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  memberships,
  orgInvites,
  orgs,
  pipelineStages,
  recruiters,
  users,
} from "@/lib/db/schema";
import type { MemberRole } from "@/lib/ats-auth";
import { getDefaultTemplateId } from "@/lib/pipeline-config";
import { PLANS, isPlanId, planFor, type PlanId } from "@/lib/plans";
import { isValidTenantSlug } from "@/lib/tenant-host";

/**
 * Creating tenants and getting people into them.
 *
 * Before this module `insert(orgs)` and `insert(memberships)` existed only in test files —
 * the entire agency product was reachable only by writing rows by hand. Onboarding is
 * sales-led, so the platform owner provisions the org and its first admin here, and that
 * admin invites their own team.
 *
 * Every function takes what it needs as arguments and reads no session. That keeps the
 * whole module callable from a route, a script, a test, or (later) an agent connector
 * without pretending to be a browser.
 */

const INVITE_TTL_DAYS = 14;

/** The board a new agency starts with, so the pipeline is never empty on day one. */
const DEFAULT_STAGES: readonly { name: string; stageKind: string }[] = [
  { name: "Sourced", stageKind: "sourced" },
  { name: "Screened", stageKind: "screened" },
  { name: "Submitted to client", stageKind: "client_submit" },
  { name: "Interview", stageKind: "interview" },
  { name: "Offer", stageKind: "offer" },
  { name: "Placed", stageKind: "placed" },
  { name: "Started", stageKind: "started" },
];

export type ProvisionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: 400 | 403 | 404 | 409 };

/* ------------------------------------------------------------------ orgs -- */

export type CreateOrgInput = {
  name: string;
  slug: string;
  kind?: "agency" | "employer";
  plan?: PlanId;
  /** Overrides the plan's default seat count — the contracted number, not the list price. */
  seatLimit?: number;
  billingEmail?: string | null;
};

export async function createOrg(
  input: CreateOrgInput
): Promise<ProvisionResult<{ id: number; slug: string; plan: string; seatLimit: number }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "A workspace needs a name.", status: 400 };

  const slug = input.slug.trim().toLowerCase();
  if (!isValidTenantSlug(slug)) {
    return {
      ok: false,
      error:
        "The slug must be 1-63 lowercase letters, digits or hyphens, must not start or " +
        "end with a hyphen, and must not be a reserved name.",
      status: 400,
    };
  }

  const planId: PlanId = input.plan && isPlanId(input.plan) ? input.plan : "trial";
  const plan = PLANS[planId];
  const seatLimit = input.seatLimit ?? plan.defaultSeats;
  if (!Number.isInteger(seatLimit) || seatLimit < 1) {
    return { ok: false, error: "Seat limit must be a positive whole number.", status: 400 };
  }

  const db = getDb();
  const [clash] = await db
    .select({ id: orgs.id })
    .from(orgs)
    .where(eq(orgs.slug, slug))
    .limit(1);
  if (clash) {
    return { ok: false, error: `The slug "${slug}" is already taken.`, status: 409 };
  }

  // A trial has to expire on a date fixed at provisioning; deriving it from createdAt later
  // would silently extend every trial each time the plan's length changed.
  const trialEndsAt =
    plan.trialDays === null
      ? null
      : new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000);

  const [row] = await db
    .insert(orgs)
    .values({
      name,
      slug,
      kind: input.kind ?? "agency",
      plan: planId,
      seatLimit,
      trialEndsAt,
      billingEmail: input.billingEmail?.trim() || null,
      status: "active",
    })
    .returning({ id: orgs.id, slug: orgs.slug, plan: orgs.plan, seatLimit: orgs.seatLimit });

  await seedDefaultPipeline(row.id);

  return { ok: true, data: row };
}

/** Give the new org a default template and stages so its board renders on first load. */
async function seedDefaultPipeline(orgId: number): Promise<void> {
  const templateId = await getDefaultTemplateId(orgId);
  await getDb()
    .insert(pipelineStages)
    .values(
      DEFAULT_STAGES.map((stage, index) => ({
        templateId,
        name: stage.name,
        stageKind: stage.stageKind as (typeof pipelineStages.$inferInsert)["stageKind"],
        sortOrder: index,
      }))
    );
}

export type UpdateOrgPlanInput = {
  plan?: PlanId;
  seatLimit?: number;
  status?: "active" | "suspended" | "cancelled";
  billingEmail?: string | null;
  /** Extend or clear a trial. Passing null makes the plan open-ended. */
  trialEndsAt?: Date | null;
};

/**
 * Change a tenant's commercial state — the closest thing to a billing operation here.
 *
 * Shrinking the seat limit below the seats already filled is refused rather than applied,
 * because the alternative is choosing a member to evict, and no automatic choice is the
 * right one. Whoever is downgrading removes people first.
 */
export async function updateOrgPlan(
  orgId: number,
  input: UpdateOrgPlanInput
): Promise<ProvisionResult<{ id: number; plan: string; seatLimit: number; status: string }>> {
  const db = getDb();
  const [org] = await db
    .select({ id: orgs.id, plan: orgs.plan, seatLimit: orgs.seatLimit })
    .from(orgs)
    .where(eq(orgs.id, orgId))
    .limit(1);
  if (!org) return { ok: false, error: "Workspace not found.", status: 404 };

  const patch: Partial<typeof orgs.$inferInsert> = {};

  if (input.plan !== undefined) {
    if (!isPlanId(input.plan)) {
      return { ok: false, error: "Unknown plan.", status: 400 };
    }
    patch.plan = input.plan;
  }

  if (input.seatLimit !== undefined) {
    if (!Number.isInteger(input.seatLimit) || input.seatLimit < 1) {
      return { ok: false, error: "Seat limit must be a positive whole number.", status: 400 };
    }
    const used = await seatsUsed(orgId);
    if (input.seatLimit < used) {
      return {
        ok: false,
        error: `That workspace already uses ${used} seats. Remove members or pending invites first.`,
        status: 409,
      };
    }
    patch.seatLimit = input.seatLimit;
  }

  if (input.status !== undefined) patch.status = input.status;
  if (input.billingEmail !== undefined) {
    patch.billingEmail = input.billingEmail?.trim() || null;
  }
  if (input.trialEndsAt !== undefined) patch.trialEndsAt = input.trialEndsAt;

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "Nothing to update.", status: 400 };
  }

  const [row] = await db
    .update(orgs)
    .set(patch)
    .where(eq(orgs.id, orgId))
    .returning({
      id: orgs.id,
      plan: orgs.plan,
      seatLimit: orgs.seatLimit,
      status: orgs.status,
    });

  return { ok: true, data: row };
}

/* ----------------------------------------------------------------- seats -- */

/**
 * Seats consumed by a tenant: members plus invitations that are still live.
 *
 * Pending invites have to count. If only memberships did, an org on three seats could send
 * thirty invitations and every one of them would be honoured on acceptance — the limit
 * would be enforced at the moment nobody is watching. An invite that expires or is revoked
 * releases its seat automatically, which is why both are part of the predicate rather than
 * a cleanup job.
 */
export async function seatsUsed(orgId: number, now: Date = new Date()): Promise<number> {
  const db = getDb();

  const [members] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(memberships)
    .where(eq(memberships.orgId, orgId));

  const [pending] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orgInvites)
    .where(
      and(
        eq(orgInvites.orgId, orgId),
        isNull(orgInvites.acceptedAt),
        isNull(orgInvites.revokedAt),
        gt(orgInvites.expiresAt, now)
      )
    );

  return (members?.count ?? 0) + (pending?.count ?? 0);
}

export async function seatsAvailable(
  orgId: number,
  seatLimit: number
): Promise<number> {
  return Math.max(0, seatLimit - (await seatsUsed(orgId)));
}

/* --------------------------------------------------------------- invites -- */

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type InviteInput = {
  orgId: number;
  email: string;
  role: MemberRole;
  invitedByUserId: number | null;
};

/**
 * Invite someone into an org.
 *
 * Returns the raw token exactly once — it is never stored, only its SHA-256 is, so a
 * database dump cannot be replayed into a tenant. The caller is responsible for putting it
 * in a link and emailing it; losing it means revoking and re-inviting.
 */
export async function inviteMember(
  input: InviteInput
): Promise<ProvisionResult<{ id: number; token: string; expiresAt: Date }>> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "A valid email is required.", status: 400 };
  }

  const db = getDb();
  const [org] = await db
    .select({ id: orgs.id, seatLimit: orgs.seatLimit, status: orgs.status })
    .from(orgs)
    .where(eq(orgs.id, input.orgId))
    .limit(1);
  if (!org) return { ok: false, error: "Workspace not found.", status: 404 };
  if (org.status !== "active") {
    return { ok: false, error: "This workspace is not active.", status: 403 };
  }

  // Already a member? Inviting again would burn a seat on a duplicate that acceptance
  // would then reject on the unique index.
  const [existingMember] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(memberships.orgId, input.orgId), eq(users.email, email)))
    .limit(1);
  if (existingMember) {
    return { ok: false, error: "That person is already a member.", status: 409 };
  }

  const now = new Date();
  const [existingInvite] = await db
    .select({ id: orgInvites.id })
    .from(orgInvites)
    .where(
      and(
        eq(orgInvites.orgId, input.orgId),
        eq(orgInvites.email, email),
        isNull(orgInvites.acceptedAt),
        isNull(orgInvites.revokedAt),
        gt(orgInvites.expiresAt, now)
      )
    )
    .limit(1);
  if (existingInvite) {
    return { ok: false, error: "An invitation is already pending for that email.", status: 409 };
  }

  // Not atomic with the insert below: two invitations sent in the same instant can both
  // read the same count and overshoot the limit by one. Left as a check rather than a lock
  // because a seat is a commercial limit, not a security boundary — the worst case is one
  // extra seat on an invoice, which a human resolves. The tenant boundary, which IS a
  // security boundary, is enforced separately in agency-auth.ts.
  if ((await seatsUsed(input.orgId, now)) >= org.seatLimit) {
    return {
      ok: false,
      error: `This workspace has no seats left (limit ${org.seatLimit}). Upgrade the plan or remove a member.`,
      status: 403,
    };
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const [row] = await db
    .insert(orgInvites)
    .values({
      orgId: input.orgId,
      email,
      role: input.role,
      tokenHash: hashToken(token),
      invitedByUserId: input.invitedByUserId,
      expiresAt,
    })
    .returning({ id: orgInvites.id });

  return { ok: true, data: { id: row.id, token, expiresAt } };
}

export async function revokeInvite(
  orgId: number,
  inviteId: number
): Promise<ProvisionResult<{ id: number }>> {
  const [row] = await getDb()
    .update(orgInvites)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(orgInvites.id, inviteId),
        eq(orgInvites.orgId, orgId),
        isNull(orgInvites.acceptedAt),
        isNull(orgInvites.revokedAt)
      )
    )
    .returning({ id: orgInvites.id });

  if (!row) return { ok: false, error: "No pending invitation to revoke.", status: 404 };
  return { ok: true, data: row };
}

/**
 * Accept an invitation, which is what finally creates a membership row.
 *
 * The token proves someone received the email; it does not prove they are the person it was
 * sent to. Requiring the signed-in account's address to match the invited address is what
 * stops a forwarded link from handing a stranger a seat in someone else's tenant — the one
 * check that makes an emailed bearer token safe here.
 */
export async function acceptInvite(
  token: string,
  userId: number,
  now: Date = new Date()
): Promise<ProvisionResult<{ orgId: number; role: MemberRole }>> {
  const db = getDb();

  const [invite] = await db
    .select({
      id: orgInvites.id,
      orgId: orgInvites.orgId,
      email: orgInvites.email,
      role: orgInvites.role,
      expiresAt: orgInvites.expiresAt,
      acceptedAt: orgInvites.acceptedAt,
      revokedAt: orgInvites.revokedAt,
    })
    .from(orgInvites)
    .where(eq(orgInvites.tokenHash, hashToken(token)))
    .limit(1);

  if (!invite) return { ok: false, error: "This invitation link is not valid.", status: 404 };
  if (invite.acceptedAt) {
    return { ok: false, error: "This invitation has already been used.", status: 409 };
  }
  if (invite.revokedAt) {
    return { ok: false, error: "This invitation has been revoked.", status: 403 };
  }
  if (invite.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, error: "This invitation has expired.", status: 403 };
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return { ok: false, error: "Account not found.", status: 404 };

  if (user.email.trim().toLowerCase() !== invite.email) {
    return {
      ok: false,
      error: "This invitation was sent to a different email address.",
      status: 403,
    };
  }

  const [org] = await db
    .select({ id: orgs.id, kind: orgs.kind, seatLimit: orgs.seatLimit, status: orgs.status })
    .from(orgs)
    .where(eq(orgs.id, invite.orgId))
    .limit(1);
  if (!org) return { ok: false, error: "Workspace not found.", status: 404 };
  if (org.status !== "active") {
    return { ok: false, error: "This workspace is not active.", status: 403 };
  }

  const [alreadyMember] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.orgId, org.id), eq(memberships.userId, user.id)))
    .limit(1);
  if (alreadyMember) {
    // Burn the invite so the link stops working, but do not treat it as a failure.
    await db
      .update(orgInvites)
      .set({ acceptedAt: now })
      .where(eq(orgInvites.id, invite.id));
    return { ok: true, data: { orgId: org.id, role: invite.role as MemberRole } };
  }

  // An applicant account cannot hold a staff seat: the two roles read different sides of
  // the same candidate data, and conflating them is how a candidate ends up able to search
  // the candidate database.
  if (user.role === "applicant") {
    return {
      ok: false,
      error:
        "This is a candidate account. Invitations must be accepted with a recruiter account.",
      status: 403,
    };
  }

  // `>` and not `>=`: this invitation is still pending, so it is already inside the count.
  // Accepting converts a reserved seat into a filled one and does not consume a new one —
  // `>=` here would refuse the last seat the invitation was issued against.
  if ((await seatsUsed(org.id, now)) > org.seatLimit) {
    return {
      ok: false,
      error: "This workspace has no seats left. Ask an administrator to free one.",
      status: 403,
    };
  }

  const linked = await linkRecruiterToOrg(user.id, org.id, org.kind);
  if (!linked.ok) return linked;

  await db.insert(memberships).values({
    orgId: org.id,
    userId: user.id,
    role: invite.role,
  });

  await db.update(orgInvites).set({ acceptedAt: now }).where(eq(orgInvites.id, invite.id));

  return { ok: true, data: { orgId: org.id, role: invite.role as MemberRole } };
}

/**
 * Point the user's recruiter row at this org.
 *
 * `requireAgency` authorises on the recruiter row (`clientKind`, `orgId`) as well as on the
 * membership, so a membership alone would produce a member who passes the tenant check and
 * fails the agency check — authorised and unable to do anything. A recruiter already tied
 * to a different org is a conflict rather than something to overwrite: moving them would
 * silently re-parent every job and application they own.
 */
async function linkRecruiterToOrg(
  userId: number,
  orgId: number,
  orgKind: string
): Promise<ProvisionResult<{ recruiterId: number | null }>> {
  const db = getDb();
  const [rec] = await db
    .select({ id: recruiters.id, orgId: recruiters.orgId })
    .from(recruiters)
    .where(eq(recruiters.userId, userId))
    .limit(1);

  if (!rec) {
    // No recruiter row yet — nothing to link. The membership is still created; a recruiter
    // profile is made when they complete company onboarding.
    return { ok: true, data: { recruiterId: null } };
  }

  if (rec.orgId !== null && rec.orgId !== orgId) {
    return {
      ok: false,
      error: "This account already belongs to another workspace.",
      status: 409,
    };
  }

  if (rec.orgId === null) {
    await db
      .update(recruiters)
      .set({
        orgId,
        ...(orgKind === "agency" ? { clientKind: "agency" as const } : {}),
      })
      .where(eq(recruiters.id, rec.id));
  }

  return { ok: true, data: { recruiterId: rec.id } };
}

/** Plan metadata for the admin console, so pricing lives in one place. */
export function planCatalog() {
  return Object.values(PLANS).map((plan) => ({
    id: plan.id,
    name: plan.name,
    defaultSeats: plan.defaultSeats,
    trialDays: plan.trialDays,
    features: plan.features,
  }));
}

export { planFor };
