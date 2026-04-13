import { NextRequest, NextResponse } from "next/server";
import { db, users, passwordResetCodes } from "@/lib/db";
import { eq, and, gte } from "drizzle-orm";
import { Resend } from "resend";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM ?? "V-GEN <onboarding@resend.dev>";

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Generates a 6-digit code, stores it, emails it. Expires in 10 minutes.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Check user exists
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  if (!user) {
    // Don't reveal if email exists — return success either way
    return NextResponse.json({ ok: true });
  }

  // Rate limit: max 3 codes in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCodes = await db
    .select({ id: passwordResetCodes.id })
    .from(passwordResetCodes)
    .where(
      and(
        eq(passwordResetCodes.email, email),
        gte(passwordResetCodes.createdAt, oneHourAgo)
      )
    );

  if (recentCodes.length >= 3) {
    return NextResponse.json(
      { error: "Too many reset attempts. Try again in an hour." },
      { status: 429 }
    );
  }

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(passwordResetCodes).values({
    email,
    code,
    expiresAt,
  });

  // Send email
  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: `V-GEN Password Reset Code: ${code}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 20px;">
            <h2 style="margin: 0 0 8px; font-size: 20px;">Password Reset</h2>
            <p style="color: #666; margin: 0 0 24px; font-size: 14px;">
              Enter this code to reset your V-GEN password.
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
              VSATW 2026 — V-GEN TRIDENT<br>
              Powered by <a href="https://tecxmate.com" style="color: #8C52FF; text-decoration: none; font-weight: 500;">TECXMATE.COM</a>
            </p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Failed to send reset email:", err);
    }
  } else {
    console.log(`[DEV] Password reset code for ${email}: ${code}`);
  }

  return NextResponse.json({ ok: true });
}
