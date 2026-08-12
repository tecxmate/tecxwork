import { z } from "zod";
import { emailSchema } from "@/lib/validation";
import { PLAN_IDS } from "@/lib/plans";

/**
 * Input shapes for provisioning and seat management.
 *
 * Kept beside the other validation modules rather than inside the route handlers so the
 * same schema can be reused by a script, a test, or an agent connector later — these are
 * the contracts, not request parsing.
 */

const MEMBER_ROLES = [
  "admin",
  "account_manager",
  "recruiter",
  "hiring_manager",
  "interviewer",
  "coordinator",
  "viewer",
] as const;

export const planIdSchema = z.enum(PLAN_IDS);

export const createOrgSchema = z.object({
  name: z.string().trim().min(1, "A workspace needs a name").max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "A slug is required")
    .max(63, "A slug may be at most 63 characters"),
  kind: z.enum(["agency", "employer"]).default("agency"),
  plan: planIdSchema.default("trial"),
  seatLimit: z.number().int().positive().max(10_000).optional(),
  billingEmail: emailSchema.optional(),
});

export const updateOrgSchema = z
  .object({
    plan: planIdSchema.optional(),
    seatLimit: z.number().int().positive().max(10_000).optional(),
    status: z.enum(["active", "suspended", "cancelled"]).optional(),
    billingEmail: emailSchema.nullable().optional(),
    /** ISO date, or null to make the plan open-ended. */
    trialEndsAt: z.string().datetime().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nothing to update",
  });

export const createInviteSchema = z.object({
  email: emailSchema,
  role: z.enum(MEMBER_ROLES).default("recruiter"),
});

export const acceptInviteSchema = z.object({
  token: z.string().trim().min(1, "An invitation token is required"),
});
