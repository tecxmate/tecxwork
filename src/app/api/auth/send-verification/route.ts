import { NextRequest, NextResponse } from "next/server";
import { db, users, emailVerificationCodes } from "@/lib/db";
import { eq, and, gte } from "drizzle-orm";
import { getResend, EMAIL_FROM } from "@/lib/email";
import { parseJsonBody, sendVerificationSchema } from "@/lib/validation";

/**
 * POST /api/auth/send-verification
 * Body: { email }
 * Generates a 6-digit code, stores it, emails it. Expires in 10 minutes.
 * Used during signup to verify email ownership.
 */
export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, sendVerificationSchema);
  if (!parsed.ok) return parsed.response;
  const { email } = parsed.data;

  // Check if email is already registered
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  // Rate limit: max 3 codes in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCodes = await db
    .select({ id: emailVerificationCodes.id })
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.email, email),
        gte(emailVerificationCodes.createdAt, oneHourAgo)
      )
    );

  if (recentCodes.length >= 5) {
    return NextResponse.json(
      { error: "Too many verification attempts. Try again in an hour." },
      { status: 429 }
    );
  }

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(emailVerificationCodes).values({
    email,
    code,
    expiresAt,
  });

  // Send email
  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: `Your verification code: ${code}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 20px;">
            <h2 style="margin: 0 0 8px; font-size: 20px;">Verify your email</h2>
            <p style="color: #666; margin: 0 0 24px; font-size: 14px;">
              Enter this code to complete your registration.
            </p>
            <div style="background: #f8f6f4; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <p style="font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0; color: #8C52FF;">
                ${code}
              </p>
            </div>
            <p style="font-size: 13px; color: #999;">
              This code expires in 10 minutes. If you didn't request this, ignore this email.
            </p>
            <p style="font-size: 12px; color: #bbb; margin-top: 24px;">
              Powered by <a href="https://tecxmate.com" style="color: #8C52FF; text-decoration: none; font-weight: 500;">TECXMATE.COM</a>
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Failed to send verification email:", err);
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }
  } else {
    console.log(`[DEV] Email verification code for ${email}: ${code}`);
  }

  return NextResponse.json({ ok: true });
}
