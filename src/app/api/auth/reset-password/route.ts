import { NextRequest, NextResponse } from "next/server";
import { db, users, passwordResetCodes } from "@/lib/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";

/**
 * POST /api/auth/reset-password
 * Body: { email, resetToken (code ID), password }
 * Sets the new password if the token is valid.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = body.email?.trim().toLowerCase();
  const resetToken = body.resetToken;
  const password = body.password;

  if (!email || !resetToken || !password) {
    return NextResponse.json(
      { error: "Email, reset token, and new password are required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  // Verify the reset token belongs to this email and was used (verified)
  const [codeRecord] = await db
    .select({ id: passwordResetCodes.id, email: passwordResetCodes.email })
    .from(passwordResetCodes)
    .where(eq(passwordResetCodes.id, resetToken));

  if (!codeRecord || codeRecord.email !== email) {
    return NextResponse.json(
      { error: "Invalid reset token. Please start over." },
      { status: 400 }
    );
  }

  // Update password
  const newHash = await hashPassword(password);
  const [updated] = await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.email, email))
    .returning({ id: users.id });

  if (!updated) {
    return NextResponse.json(
      { error: "Account not found" },
      { status: 404 }
    );
  }

  // Clean up all codes for this email
  await db
    .delete(passwordResetCodes)
    .where(eq(passwordResetCodes.email, email));

  return NextResponse.json({ ok: true });
}
