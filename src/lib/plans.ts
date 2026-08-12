import type { Capability } from "@/lib/permissions";

/**
 * What a tenant has bought.
 *
 * Two things are deliberately separate here. A **plan** is the shape of the product a
 * customer gets — which features are switched on. A **seat limit** is a contracted number
 * that sales agrees per deal; the plan only supplies the default. Since orgs are
 * provisioned by hand rather than self-serve, the negotiated number has to be able to
 * differ from the list price, and `orgs.seat_limit` — not the plan — is what gets enforced.
 *
 * No payment processor is involved. This module answers "what is this tenant entitled to",
 * and nothing here knows how (or whether) the money arrived. That is intentional: when a
 * gateway does arrive it writes `orgs.plan` / `orgs.seat_limit` / `orgs.status` and every
 * enforcement point below keeps working unchanged.
 */

export const PLAN_IDS = ["trial", "starter", "growth", "scale"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (PLAN_IDS as readonly string[]).includes(value);
}

/**
 * Feature switches, named after the things this codebase actually does. Adding a feature
 * here without a matching capability in CAPABILITY_FEATURE below leaves it unenforced, so
 * the two tables are meant to be edited together.
 */
export type Feature =
  /** The kanban board and moving candidates through it. */
  | "ats_pipeline"
  /** Reshaping the hiring process itself — add, rename, reorder, retire a stage. */
  | "pipeline_config"
  /** The searchable candidate database. */
  | "candidate_search"
  /** Client companies, their contacts, and the vacancies opened against them. */
  | "client_crm"
  /** Drafting offers and recording what the candidate said. */
  | "offers"
  /** Placement records and the fee ledger that hangs off them. */
  | "placements"
  /** The ARC / work-permit expiry clock. */
  | "compliance"
  /** Invoices and credit notes. */
  | "billing"
  /** Stored artifacts — CVs, permits, contracts. */
  | "documents"
  /** Audit and evidence exports. */
  | "exports"
  /** Machine tokens and agent connectors. Nothing reads this yet; it is the flag the
   *  connector work will gate on, declared now so pricing does not have to change later. */
  | "api_access";

export type Plan = {
  id: PlanId;
  name: string;
  /** Seat count a new org on this plan starts with. Sales may override it per deal. */
  defaultSeats: number;
  /** Days of trial, or null for a plan that does not expire on its own. */
  trialDays: number | null;
  features: readonly Feature[];
};

const CORE: readonly Feature[] = [
  "ats_pipeline",
  "client_crm",
  "candidate_search",
  "documents",
  "compliance",
];

const COMMERCIAL: readonly Feature[] = [
  ...CORE,
  "pipeline_config",
  "offers",
  "placements",
  "billing",
  "exports",
];

export const PLANS: Record<PlanId, Plan> = {
  // A trial shows the whole commercial product, because the compliance clock and the fee
  // ledger are the reasons anyone switches — hiding them would demo the wrong platform.
  // It is bounded by seats and by time instead.
  trial: {
    id: "trial",
    name: "Trial",
    defaultSeats: 3,
    trialDays: 14,
    features: COMMERCIAL,
  },
  starter: {
    id: "starter",
    name: "Starter",
    defaultSeats: 5,
    trialDays: null,
    features: CORE,
  },
  growth: {
    id: "growth",
    name: "Growth",
    defaultSeats: 20,
    trialDays: null,
    features: COMMERCIAL,
  },
  scale: {
    id: "scale",
    name: "Scale",
    defaultSeats: 100,
    trialDays: null,
    features: [...COMMERCIAL, "api_access"],
  },
};

export function planFor(planId: string): Plan {
  return isPlanId(planId) ? PLANS[planId] : PLANS.trial;
}

export function hasFeature(planId: string, feature: Feature): boolean {
  return planFor(planId).features.includes(feature);
}

/**
 * Which feature each capability belongs to.
 *
 * This map is what makes entitlement enforcement free. Every agency route already declares
 * the capability it needs (`requireAgency("invoice:write")`), so the gate can look up the
 * feature from the capability and refuse on plan as well as on role — without touching any
 * of the 84 route handlers. A capability with no entry is always allowed; that is the right
 * default for anything that is part of the product rather than part of a package.
 */
const CAPABILITY_FEATURE: Partial<Record<Capability, Feature>> = {
  "client:read": "client_crm",
  "client:write": "client_crm",
  "job_order:write": "client_crm",
  "candidate:read": "candidate_search",
  "stage:move": "ats_pipeline",
  "pipeline:configure": "pipeline_config",
  "offer:read": "offers",
  "offer:write": "offers",
  "offer:approve": "offers",
  "placement:read": "placements",
  "placement:write": "placements",
  "compliance:read": "compliance",
  "compliance:write": "compliance",
  "invoice:read": "billing",
  "invoice:write": "billing",
};

export function featureForCapability(capability: Capability): Feature | null {
  return CAPABILITY_FEATURE[capability] ?? null;
}

/** Does this plan permit the feature the capability belongs to? */
export function planAllows(planId: string, capability: Capability): boolean {
  const feature = featureForCapability(capability);
  return feature === null || hasFeature(planId, feature);
}

/**
 * A trial that has run out is not cancelled — the tenant's data stays exactly where it is
 * and one upgrade restores access. Expiry is computed from the timestamp rather than swept
 * by a cron so there is no window where a lapsed trial is still live.
 */
export function isTrialExpired(
  planId: string,
  trialEndsAt: Date | null,
  now: Date = new Date()
): boolean {
  if (planFor(planId).trialDays === null) return false;
  if (!trialEndsAt) return false;
  return trialEndsAt.getTime() <= now.getTime();
}
