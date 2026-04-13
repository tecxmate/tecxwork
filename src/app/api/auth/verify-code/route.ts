import { NextRequest, NextResponse } from "next/server";
import { db, passwordResetCodes } from "@/lib/db";
import { eq, and, gte } from "drizzle-orm";

/**
 * POST /api/auth/verify-code
 * Body: { email, code }
 * Verifies the code is valid and not expired. Returns a one-time token.
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

  const now = new Date();

  const [match] = await db
    .select({ id: passwordResetCodes.id })
    .from(passwordResetCodes)
    .where(
      and(
        eq(passwordResetCodes.email, email),
        eq(passwordResetCodes.code, code),
        eq(passwordResetCodes.used, false),
        gte(passwordResetCodes.expiresAt, now)
      )
    );

  if (!match) {
    return NextResponse.json(
      { error: "Invalid or expired code. Please request a new one." },
      { status: 400 }
    );
  }

  // Mark as used
  await db
    .update(passwordResetCodes)
    .set({ used: true })
    .where(eq(passwordResetCodes.id, match.id));

  // Return a short-lived token (the code ID) for the reset step
  return NextResponse.json({ ok: true, resetToken: match.id });
}
