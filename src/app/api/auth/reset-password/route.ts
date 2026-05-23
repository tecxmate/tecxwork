import { NextRequest, NextResponse } from "next/server";
import { db, users, passwordResetCodes } from "@/lib/db";
import { and, eq, gte } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { parseJsonBody, resetPasswordSchema } from "@/lib/validation";

/**
 * POST /api/auth/reset-password
 * Body: { email, resetToken (id_code), password }
 * Sets the new password if the token is valid, verified, unexpired, and unused.
 */
export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, resetPasswordSchema);
  if (!parsed.ok) return parsed.response;
  const { email, resetToken, password } = parsed.data;

  // Parse compound token: "id_code"
  const separatorIdx = resetToken.indexOf("_");
  if (separatorIdx === -1) {
    return NextResponse.json(
      { error: "Invalid reset token. Please start over." },
      { status: 400 }
    );
  }
  const tokenId = parseInt(resetToken.slice(0, separatorIdx));
  const tokenCode = resetToken.slice(separatorIdx + 1);

  if (isNaN(tokenId) || !tokenCode) {
    return NextResponse.json(
      { error: "Invalid reset token. Please start over." },
      { status: 400 }
    );
  }

  // Atomically consume the token: must match id+code+email, be verified
  // (used=true was set by /verify-code), and not expired. Deleting on the
  // same conditions ensures a token can be redeemed at most once even
  // under concurrent requests.
  const consumed = await db
    .delete(passwordResetCodes)
    .where(
      and(
        eq(passwordResetCodes.id, tokenId),
        eq(passwordResetCodes.email, email),
        eq(passwordResetCodes.code, tokenCode),
        eq(passwordResetCodes.used, true),
        gte(passwordResetCodes.expiresAt, new Date())
      )
    )
    .returning({ id: passwordResetCodes.id });

  if (!consumed.length) {
    return NextResponse.json(
      { error: "Invalid or expired reset token. Please start over." },
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

  // Clean up any other codes for this email
  await db
    .delete(passwordResetCodes)
    .where(eq(passwordResetCodes.email, email));

  return NextResponse.json({ ok: true });
}
