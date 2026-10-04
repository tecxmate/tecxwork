import { and, count, eq, isNotNull, lte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  applications,
  clients,
  complianceDocuments,
  jobOrders,
  memberships,
  orgs,
  placements,
} from "@/lib/db/schema";
import { hasFeature, isTrialExpired, planFor, type Feature } from "@/lib/plans";
import { seatsUsed } from "@/lib/provisioning";

/**
 * How far a workspace has got, and what it should do next.
 *
 * Every step is **derived from the data**, never from a stored "onboarding_completed" flag.
 * A flag drifts: it says done when someone deleted their only client, and it says pending
 * for the tenants who were provisioned by hand before this existed. Deriving costs six
 * counting queries and is always true.
 *
 * Actor-free like `provisioning.ts` and `members.ts` — takes an org, reads no session.
 */

export type ActivationStepId =
  | "invite_team"
  | "add_client"
  | "open_job_order"
  | "add_candidate"
  | "record_placement"
  | "file_compliance";

export type ActivationStep = {
  id: ActivationStepId;
  title: string;
  /** What this unlocks, in the customer's terms — not a restatement of the title. */
  detail: string;
  href: string;
  done: boolean;
  /** Hidden when the plan does not include the feature the step leads to. */
  feature: Feature | null;
};

export type TrialState = {
  /** Days remaining, floored. Negative once lapsed. */
  daysLeft: number;
  expired: boolean;
  endsAt: Date;
};

export type Activation = {
  steps: ActivationStep[];
  /** Steps actually shown to this plan — the denominator for progress. */
  applicable: number;
  completed: number;
  /** True once every applicable step is done; the checklist retires itself. */
  complete: boolean;
  seats: { limit: number; used: number };
  plan: string;
  planName: string;
  trial: TrialState | null;
  /** Compliance documents already expired or inside the 60-day window. */
  complianceAttention: number;
};

const EXPIRING_WINDOW_DAYS = 60;

export async function getActivation(
  orgId: number,
  now: Date = new Date()
): Promise<Activation | null> {
  const db = getDb();

  const [org] = await db
    .select({
      plan: orgs.plan,
      seatLimit: orgs.seatLimit,
      trialEndsAt: orgs.trialEndsAt,
    })
    .from(orgs)
    .where(eq(orgs.id, orgId))
    .limit(1);
  if (!org) return null;

  const soon = new Date(now.getTime() + EXPIRING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  // One round trip rather than six sequential ones — this renders on the workspace's
  // landing page, so it is on the critical path for every session.
  const [
    members,
    clientCount,
    jobOrderCount,
    candidateCount,
    placementCount,
    complianceCount,
    attention,
    seats,
  ] = await Promise.all([
    countRows(db.select({ n: count() }).from(memberships).where(eq(memberships.orgId, orgId))),
    countRows(db.select({ n: count() }).from(clients).where(eq(clients.orgId, orgId))),
    countRows(db.select({ n: count() }).from(jobOrders).where(eq(jobOrders.orgId, orgId))),
    countRows(
      db.select({ n: count() }).from(applications).where(eq(applications.orgId, orgId))
    ),
    countRows(db.select({ n: count() }).from(placements).where(eq(placements.orgId, orgId))),
    countRows(
      db
        .select({ n: count() })
        .from(complianceDocuments)
        .where(eq(complianceDocuments.orgId, orgId))
    ),
    countRows(
      db
        .select({ n: count() })
        .from(complianceDocuments)
        .where(
          and(
            eq(complianceDocuments.orgId, orgId),
            isNotNull(complianceDocuments.expiryDate),
            lte(complianceDocuments.expiryDate, soon.toISOString().slice(0, 10))
          )
        )
    ),
    seatsUsed(orgId, now),
  ]);

  const steps: ActivationStep[] = [
    {
      id: "invite_team",
      title: "Invite your team",
      detail: "Recruiters, coordinators and hiring managers each see only what their role allows.",
      href: "/dashboard/team",
      // The founding admin is a member, so one membership is not a team.
      done: members > 1,
      feature: null,
    },
    {
      id: "add_client",
      title: "Add your first client",
      detail: "The company you place people into. Job orders and fees hang off it.",
      href: "/dashboard/clients",
      done: clientCount > 0,
      feature: "client_crm",
    },
    {
      id: "open_job_order",
      title: "Open a job order",
      detail: "A vacancy with a headcount and a fee, so placements can be billed against it.",
      href: "/dashboard/clients",
      done: jobOrderCount > 0,
      feature: "client_crm",
    },
    {
      id: "add_candidate",
      title: "Put a candidate on the board",
      detail: "The pipeline tracks who is where, and every stage move is recorded.",
      href: "/dashboard/pipeline",
      done: candidateCount > 0,
      feature: "ats_pipeline",
    },
    {
      id: "file_compliance",
      title: "File a work permit or ARC",
      detail: "Expiry dates start counting down and surface before they lapse.",
      href: "/dashboard/compliance",
      done: complianceCount > 0,
      feature: "compliance",
    },
    {
      id: "record_placement",
      title: "Record a placement",
      detail: "Starts the guarantee period and opens the fee for invoicing.",
      href: "/dashboard/placements",
      done: placementCount > 0,
      feature: "placements",
    },
  ];

  const visible = steps.filter((s) => s.feature === null || hasFeature(org.plan, s.feature));
  const completed = visible.filter((s) => s.done).length;

  return {
    steps: visible,
    applicable: visible.length,
    completed,
    complete: completed === visible.length,
    seats: { limit: org.seatLimit, used: seats },
    plan: org.plan,
    planName: planFor(org.plan).name,
    trial: trialState(org.plan, org.trialEndsAt, now),
    complianceAttention: attention,
  };
}

async function countRows(query: PromiseLike<{ n: number }[]>): Promise<number> {
  return (await query)[0]?.n ?? 0;
}

/**
 * Trial countdown, or null when the plan does not expire.
 *
 * Uses the same `isTrialExpired` the auth gate does, so the banner and the refusal can
 * never disagree — a workspace that says "3 days left" and refuses every request is worse
 * than either message alone.
 */
function trialState(plan: string, endsAt: Date | null, now: Date): TrialState | null {
  if (planFor(plan).trialDays === null || !endsAt) return null;
  const msLeft = endsAt.getTime() - now.getTime();
  return {
    daysLeft: Math.floor(msLeft / (24 * 60 * 60 * 1000)),
    expired: isTrialExpired(plan, endsAt, now),
    endsAt,
  };
}
