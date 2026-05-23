import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Invalid email" });

export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, {
    message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
  });

export const sixDigitCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { message: "Code must be 6 digits" });

/* ---------- auth ---------- */

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password required"),
});

export const sendVerificationSchema = z.object({
  email: emailSchema,
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: sixDigitCodeSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const verifyCodeSchema = z.object({
  email: emailSchema,
  code: sixDigitCodeSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  resetToken: z.string().min(1, "Reset token required"),
  password: passwordSchema,
});

/* ---------- recruiter signup ---------- */

export const recruiterSignupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1, "Name is required"),
  company: z.string().trim().min(1, "Company is required"),
  industry: z.string().trim().min(1, "Industry is required"),
  description: z.string().optional(),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  confirmsLawfulHiring: z.boolean(),
  confirmsNoDiscrimination: z.boolean(),
  confirmsWorkAuthorizationChecks: z.boolean(),
});

export const applicantSignupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().optional(),
  nationality: z.string().trim().optional(),
  schoolCode: z.string().trim().optional(),
  schoolName: z.string().trim().optional(),
  schoolNameEn: z.string().trim().optional(),
  major: z.string().trim().optional(),
  studyLevel: z.string().trim().optional(),
  studyYear: z.string().trim().optional(),
  expectedGraduation: z.string().trim().optional(),
  jobSeekingStatus: z.string().trim().optional(),
  workAuthorization: z.string().trim().optional(),
  skills: z.array(z.string().trim()).optional(),
  preferredLocations: z.array(z.string().trim()).optional(),
  preferredIndustries: z.array(z.string().trim()).optional(),
  workExperiences: z.unknown().optional(),
  cvLink: z.string().trim().url("CV link must be a valid URL"),
  linkedinUrl: z.string().trim().optional(),
  portfolioUrl: z.string().trim().optional(),
  description: z.string().trim().optional(),
  pipaConsent: z.boolean(),
  wantsNewsletter: z.boolean().optional(),
});

/* ---------- bookings ---------- */

export const createBookingSchema = z.object({
  recruiterId: z.number().int().positive(),
  startTime: z.string().min(1),
  position: z.string().trim().min(1),
  cvLink: z.string().trim().url().optional(),
  pipaConsent: z.boolean(),
});

export const reviewBookingSchema = z.object({
  bookingId: z.number().int().positive(),
  action: z.enum(["accept", "reject", "waitlist"]),
  note: z.string().trim().max(2000).optional(),
});

export const cancelBookingSchema = z.object({
  note: z.string().trim().max(2000).optional(),
});

/* ---------- helper ---------- */

/**
 * Parse a request JSON body against a zod schema. Returns either the
 * validated data or a 400 NextResponse with a flattened error message.
 *
 * Usage:
 *   const result = await parseJsonBody(req, schema);
 *   if (!result.ok) return result.response;
 *   const body = result.data;
 */
import { NextRequest, NextResponse } from "next/server";

export async function parseJsonBody<T extends z.ZodTypeAny>(
  req: NextRequest | Request,
  schema: T
): Promise<
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: NextResponse }
> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first?.message ?? "Invalid request body";
    return {
      ok: false,
      response: NextResponse.json({ error: message }, { status: 400 }),
    };
  }

  return { ok: true, data: parsed.data };
}
