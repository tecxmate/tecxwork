import { z } from "zod";
import type { AgencyActor } from "@/lib/agency-auth";
import { getAgencyCrm } from "@/lib/agency-crm";
import { getActivation } from "@/lib/activation";
import { getAuditPage } from "@/lib/audit-log";
import { getTeam } from "@/lib/members";
import type { Capability } from "@/lib/permissions";

/**
 * The tools an agent may call, and the rules that decide what is missing from this list.
 *
 * Three constraints govern every entry. The first two were recorded in the connector audit
 * before any of this existed; the third was forced by what building it turned up.
 *
 *   1. **No tool accepts `orgId`.** The tenant comes from the actor the credential resolved
 *      to, never from an argument. A tool that takes a tenant id is one prompt-injection
 *      away from reading another customer's data, and it is the most common way MCP servers
 *      leak across tenants.
 *
 *   2. **Nothing destructive or financial in v1.** No stage moves, no offers, no invoices,
 *      no erasure. Everything here reads. A model that has been talked into calling a tool
 *      must not be able to move money or lose a record.
 *
 *   3. **No candidate PII in v1.** Not a squeamishness about names — a live open question.
 *      The lawful basis for streaming candidate data (names, schools, ARC and work-permit
 *      details) to a third-party model provider is unresolved and belongs to the customer,
 *      not to this file. Until it is answered, the tools return counts, companies, staff and
 *      metadata, and no tool returns a candidate's details.
 *
 *      Two concrete things follow from that rule, both worth knowing:
 *        - `search_candidates` is **deliberately absent**. Beyond the PIPA question,
 *          `searchCandidates()` carries no org filter at all — access rests entirely on the
 *          `candidate:read` capability, so the pool it searches is platform-wide rather than
 *          per-tenant. That may well be intended for a marketplace where students register
 *          once; it is not something to hand an agent while the question is open.
 *        - `get_compliance_summary` returns **counts, not rows**. The underlying
 *          `AgencyCrm.compliance.attention` carries candidate names, so the tool
 *          deliberately reads past it to the totals, preserving the compliance clock's value
 *          without its PII.
 *
 * Each tool declares the capability it needs and the transport checks it against the key's
 * scopes, so an agent is bounded by the same matrix a person is rather than a parallel one.
 */

export type McpTool = {
  name: string;
  description: string;
  capability: Capability;
  /** A ZodObject: the SDK advertises its shape and the transport validates against it. */
  schema: z.ZodObject<z.ZodRawShape>;
  run: (actor: AgencyActor, args: Record<string, unknown>) => Promise<unknown>;
};

const noArgs = z.object({});

export const MCP_TOOLS: readonly McpTool[] = [
  {
    name: "get_workspace_overview",
    description:
      "Plan, seats used and available, trial state, setup progress, and how many compliance " +
      "documents need attention. The fastest way to answer 'how is this workspace doing'. " +
      "Contains no personal data.",
    capability: "client:read",
    schema: noArgs,
    run: async (actor) => getActivation(actor.orgId),
  },
  {
    name: "list_clients",
    description:
      "The client companies this agency places into, each with its job order, submission and " +
      "placement counts. Company records, not personal ones.",
    capability: "client:read",
    schema: noArgs,
    run: async (actor) => (await getAgencyCrm(actor.orgId))?.clients ?? [],
  },
  {
    name: "get_compliance_summary",
    description:
      "How many tracked documents are expired and how many are inside the warning window — " +
      "the compliance clock as totals. Returns counts only, never the people behind them; " +
      "open the workspace to see which documents they are.",
    capability: "compliance:read",
    schema: noArgs,
    run: async (actor) => {
      const crm = await getAgencyCrm(actor.orgId);
      if (!crm) return null;
      // Deliberately past `attention`, which carries candidate names.
      return {
        total: crm.compliance.total,
        expired: crm.compliance.expired,
        expiringSoon: crm.compliance.expiringSoon,
      };
    },
  },
  {
    name: "list_team",
    description:
      "Who is in the workspace, their roles, pending invitations and the seat budget. " +
      "Colleagues, not candidates.",
    capability: "member:invite",
    schema: noArgs,
    run: async (actor) => getTeam(actor.orgId),
  },
  {
    name: "read_audit_trail",
    description:
      "Who did what, to which record, and when. Entries carry the NAMES of changed fields, " +
      "never the values, so no candidate detail passes through here.",
    capability: "audit:read",
    schema: z.object({
      action: z.string().optional().describe("e.g. create, update, move_stage, export"),
      entityType: z.string().optional().describe("e.g. client, placement, application"),
      page: z.number().int().positive().optional(),
    }),
    run: async (actor, args) =>
      getAuditPage(actor.orgId, {
        action: args.action as string | undefined,
        entityType: args.entityType as string | undefined,
        page: args.page as number | undefined,
      }),
  },
];

export function findTool(name: string): McpTool | undefined {
  return MCP_TOOLS.find((t) => t.name === name);
}

/**
 * The raw shape the SDK advertises, derived from the same Zod the rest of the codebase
 * validates with — so a tool cannot drift from the shapes the HTTP layer already accepts.
 */
export function inputShapeFor(tool: McpTool): z.ZodRawShape {
  return tool.schema.shape;
}

/** The advertised list, filtered to what this credential may actually do. */
export function toolsForScopes(scopes: readonly Capability[]): McpTool[] {
  // Filtered rather than listed-then-refused: an agent that can see a tool will try it, and
  // a list it cannot use is a list of ways to fail.
  return MCP_TOOLS.filter((tool) => scopes.includes(tool.capability));
}
