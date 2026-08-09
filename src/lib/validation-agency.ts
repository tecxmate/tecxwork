import { z } from "zod";

/**
 * Input schemas for the agency CRM writes.
 *
 * Dates are kept as `YYYY-MM-DD` strings to match the columns (`expiry_date`, `start_date`
 * are text). Validating the shape here means the compliance screen's expiry maths never has
 * to defend against "2026/07/23" or "next Tuesday".
 */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), "Not a real date");

const trimmed = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal("")).transform((v) => v || null);

export const createClientSchema = z.object({
  name: trimmed(160),
  nameZh: optionalText(160),
  industry: z.string().trim().max(80).default(""),
  city: optionalText(80),
  // 統一編號 — Taiwan's unified business number is exactly 8 digits.
  unifiedBusinessNo: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "統一編號 must be 8 digits")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  defaultFeePct: z.coerce.number().int().min(0).max(100).optional().nullable(),
  status: z.enum(["active", "paused", "closed"]).default("active"),
});

export const updateClientSchema = createClientSchema.partial();

export const createContactSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  name: trimmed(120),
  title: optionalText(120),
  email: z.string().trim().email().optional().or(z.literal("")).transform((v) => v || null),
  phone: optionalText(40),
  isPrimary: z.boolean().default(false),
});

export const createJobOrderSchema = z.object({
  clientId: z.coerce.number().int().positive().nullable().optional(),
  jobOpeningId: z.coerce.number().int().positive().nullable().optional(),
  type: z.enum(["client_order", "internal_req"]).default("client_order"),
  title: trimmed(200),
  headcount: z.coerce.number().int().min(1).max(999).default(1),
  feePct: z.coerce.number().int().min(0).max(100).optional().nullable(),
  status: z.enum(["open", "on_hold", "filled", "closed"]).default("open"),
});

export const createPlacementSchema = z.object({
  candidateId: z.coerce.number().int().positive(),
  jobOrderId: z.coerce.number().int().positive(),
  submissionId: z.coerce.number().int().positive().nullable().optional(),
  startDate: isoDate.optional().nullable(),
  salary: z.coerce.number().int().min(0).max(100_000_000).optional().nullable(),
  feeAmount: z.coerce.number().int().min(0).max(100_000_000).optional().nullable(),
  status: z.enum(["placed", "started", "guarantee", "fallen_off"]).default("placed"),
});

// Must stay in step with docTypeEnum in schema.ts — Postgres rejects anything else.
export const DOC_TYPES = [
  "arc",
  "work_permit",
  "passport",
  "visa",
  "medical",
  "contract",
  "diploma",
  "criminal_record",
  "health_insurance",
] as const;

export const createComplianceDocSchema = z.object({
  candidateId: z.coerce.number().int().positive(),
  placementId: z.coerce.number().int().positive().nullable().optional(),
  docType: z.enum(DOC_TYPES),
  docNumber: optionalText(60),
  issuingAuthority: optionalText(120),
  issueDate: isoDate.optional().nullable(),
  expiryDate: isoDate.optional().nullable(),
  notes: optionalText(500),
});

/**
 * Renewal carries the NEW document's details. The old row is superseded rather than
 * overwritten — an expired ARC is a fact that happened, and an auditor asking "was this
 * worker covered on 1 August?" needs the history, not just the current state.
 */
export const renewComplianceDocSchema = z.object({
  docNumber: optionalText(60),
  issuingAuthority: optionalText(120),
  issueDate: isoDate.optional().nullable(),
  expiryDate: isoDate,
  notes: optionalText(500),
});
