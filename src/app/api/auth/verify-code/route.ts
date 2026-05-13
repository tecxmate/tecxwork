import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db, passwordResetCodes } from "@/lib/db";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { parseJsonBody, verifyCodeSchema } from "@/lib/validation";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const MAX_FAILED_ATTEMPTS = 5;

/**
 * POST /api/auth/verify-code
 * Body: { email, code }
 * Verifies the code is valid and not expired. Returns a one-time token.
 */
export async function POST(req: NextRequest) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success, remaining, reset } = await rateLimit(ip, "auth", "verify-code");
  if (!success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: rateLimitHeaders(remaining, reset) }
    );
  }

  const parsed = await parseJsonBody(req, verifyCodeSchema);
  if (!parsed.ok) return parsed.response;
  const { email, code } = parsed.data;

  // Find the most recent unexpired, unused code for this email (do NOT match on
  // code in the query — we need to count failed attempts on the active code).
  const [latest] = await db
    .select()
    .from(passwordResetCodes)
    .where(
      and(
        eq(passwordResetCodes.email, email),
        eq(passwordResetCodes.used, false),
        gte(passwordResetCodes.expiresAt, new Date())
      )
    )
    .orderBy(desc(passwordResetCodes.createdAt))
    .limit(1);

  if (!latest) {
    return NextResponse.json(
      { error: "Invalid or expired code. Please request a new one." },
      { status: 400 }
    );
  }

  if (latest.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please request a new code." },
      { status: 429 }
    );
  }

  if (latest.code !== code) {
    await db
      .update(passwordResetCodes)
      .set({ failedAttempts: sql`${passwordResetCodes.failedAttempts} + 1` })
      .where(eq(passwordResetCodes.id, latest.id));
    return NextResponse.json(
      { error: "Invalid or expired code. Please request a new one." },
      { status: 400 }
    );
  }

  // Mark as used
  await db
    .update(passwordResetCodes)
    .set({ used: true })
    .where(eq(passwordResetCodes.id, latest.id));

  // Return a compound token (id + code) so reset-password can verify both
  return NextResponse.json({ ok: true, resetToken: `${latest.id}_${latest.code}` });
}
