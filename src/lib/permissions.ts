import type { MemberRole } from "@/lib/ats-auth";

/**
 * What a member is allowed to do, expressed as capabilities rather than role checks.
 *
 * The seven roles in `member_role` have existed since the ATS tenancy migration, but only
 * the tenant boundary was ever enforced: any member of an agency org could create clients,
 * close placements, and read the whole candidate database. An interviewer brought in for a
 * single afternoon had the same authority as the account manager.
 *
 * Capabilities rather than `role === "admin" || role === "account_manager"` at each call
 * site, because that pattern is what lets a new role silently inherit powers nobody
 * intended: adding a role here is a deliberate edit to one table, and the tests below it
 * read as a policy document rather than a list of string comparisons.
 */
export type Capability =
  /** Read the client companies the agency places into. */
  | "client:read"
  /** Create, rename or re-own a client company. */
  | "client:write"
  /** Open a vacancy against a client. */
  | "job_order:write"
  /** Search the candidate database — names, contact details, documents. */
  | "candidate:read"
  /** See who is placed where, and what fee is still inside its guarantee. */
  | "placement:read"
  /** Record a placement, or end one (which is what triggers a clawback). */
  | "placement:write"
  /** See ARC and work-permit status. */
  | "compliance:read"
  /** File or renew a compliance document. */
  | "compliance:write"
  /** Move a candidate between pipeline stages. */
  | "stage:move"
  /** Change the hiring process itself — add, rename, reorder or retire a stage. */
  | "pipeline:configure"
  /** See the offers made and their outcomes. */
  | "offer:read"
  /** Draft an offer and record what the candidate said. */
  | "offer:write"
  /** Authorise the terms — the control that stops money being promised unilaterally. */
  | "offer:approve"
  /** See what has been billed and what is outstanding. */
  | "invoice:read"
  /** Raise, issue, void an invoice, or record a payment against one. */
  | "invoice:write"
  /**
   * Invite someone into the workspace, or revoke an invitation.
   *
   * Admin only, and deliberately narrower than the commercial capabilities: a seat is a
   * line on the customer's bill, so handing this to account managers would let the people
   * who negotiate the contract also inflate it.
   */
  | "member:invite";

/**
 * The matrix. Each row is a job, not a rank — a coordinator is not "less than" a recruiter,
 * they do different work, so the sets deliberately overlap rather than nest.
 */
const ROLE_CAPABILITIES: Record<MemberRole, readonly Capability[]> = {
  // Runs the org. Everything.
  admin: [
    "client:read",
    "client:write",
    "job_order:write",
    "candidate:read",
    "placement:read",
    "placement:write",
    "compliance:read",
    "compliance:write",
    "stage:move",
    "pipeline:configure",
    "offer:read",
    "offer:write",
    "offer:approve",
    "invoice:read",
    "invoice:write",
    "member:invite",
  ],

  // Owns the client relationship end to end, which is why this is the only other role
  // that may create or rename a client company.
  account_manager: [
    "client:read",
    "client:write",
    "job_order:write",
    "candidate:read",
    "placement:read",
    "placement:write",
    "compliance:read",
    "compliance:write",
    "stage:move",
    // Changing the process everyone else works inside is a manager's call, not a
    // recruiter's — this is the line between using the pipeline and redefining it.
    "pipeline:configure",
    "offer:read",
    "offer:write",
    "offer:approve",
    // Billing the client is part of owning the account.
    "invoice:read",
    "invoice:write",
  ],

  // Does the recruiting: sources candidates, opens vacancies, makes placements. Reads
  // clients but does not own them — renaming or reassigning an account is commercial.
  recruiter: [
    "client:read",
    "job_order:write",
    "candidate:read",
    "placement:read",
    "placement:write",
    "compliance:read",
    "compliance:write",
    "stage:move",
    // Drafts the offer, but cannot authorise its terms. Someone else signs off on money.
    "offer:read",
    "offer:write",
    // Can see whether their placements have been billed; billing itself is commercial.
    "invoice:read",
  ],

  // Sits on the client side of the decision: judges candidates and moves them forward,
  // but the agency's commercial and compliance records are none of their business.
  hiring_manager: [
    "client:read",
    "job_order:write",
    "candidate:read",
    "placement:read",
    "stage:move",
    // The client-side decision maker: signs off on the terms without drafting them.
    // Needs to READ them to do that — approving something you cannot see is not a control.
    "offer:read",
    "offer:approve",
  ],

  // Brought in to interview specific people. Reaches candidates through the applications
  // assigned to them (see authorizeApplication), never through the searchable database —
  // that distinction is the whole point of the role under PIPA.
  interviewer: [],

  // Schedules interviews and chases paperwork. Needs to see candidates and documents to
  // do that; has no authority over money or the client list.
  coordinator: [
    "client:read",
    "candidate:read",
    "placement:read",
    "compliance:read",
    "compliance:write",
    "stage:move",
  ],

  // Reporting and oversight. Reads the commercial picture, never the raw candidate
  // database — an observer with no operational need does not get PII.
  viewer: ["client:read", "placement:read", "compliance:read", "offer:read", "invoice:read"],
};

export function can(role: MemberRole, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}

/** Every capability a role holds — used to shape the UI so it matches what the API allows. */
export function capabilitiesFor(role: MemberRole): readonly Capability[] {
  return ROLE_CAPABILITIES[role] ?? [];
}
