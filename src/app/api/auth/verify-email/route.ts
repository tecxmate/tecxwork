import { NextRequest, NextResponse } from "next/server";
import { db, emailVerificationCodes } from "@/lib/db";
import { eq, and, gte, desc, sql } from "drizzle-orm";

const MAX_FAILED_ATTEMPTS = 5;

/**
 * POST /api/auth/verify-email
 * Body: { email, code }
 * Verifies the 6-digit code matches the most recent unexpired code for this email.
 * Blocks after 5 failed attempts.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();

  if (!email || !code) {
    return NextResponse.json(
      { error: "Email and code are required" },
      { status: 400 }
    );
  }

  // Find the most recent unexpired code for this email
  const [latestCode] = await db
    .select()
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.email, email),
        gte(emailVerificationCodes.expiresAt, new Date())
      )
    )
    .orderBy(desc(emailVerificationCodes.createdAt))
    .limit(1);

  if (!latestCode) {
    return NextResponse.json(
      { error: "No verification code found. Please request a new one." },
      { status: 400 }
    );
  }

  // Check if too many failed attempts
  if (latestCode.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please request a new code." },
      { status: 429 }
    );
  }

  // Check if code matches
  if (latestCode.code !== code) {
    // Increment failed attempts
    await db
      .update(emailVerificationCodes)
      .set({ failedAttempts: sql`${emailVerificationCodes.failedAttempts} + 1` })
      .where(eq(emailVerificationCodes.id, latestCode.id));

    const attemptsLeft = MAX_FAILED_ATTEMPTS - latestCode.failedAttempts - 1;
    return NextResponse.json(
      { error: `Invalid code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.` },
      { status: 400 }
    );
  }

  // Mark as verified
  await db
    .update(emailVerificationCodes)
    .set({ verified: true })
    .where(eq(emailVerificationCodes.id, latestCode.id));

  return NextResponse.json({ ok: true, verified: true });
}
