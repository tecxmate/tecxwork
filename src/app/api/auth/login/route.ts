import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { login, COOKIE_NAME } from "@/lib/auth";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { loginSchema, parseJsonBody } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success, remaining, reset } = await rateLimit(ip, "auth");

  if (!success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: rateLimitHeaders(remaining, reset) }
    );
  }

  const parsed = await parseJsonBody(req, loginSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const result = await login(body.email, body.password);

  if (!result.ok) {
    if (result.code === "USER_NOT_FOUND") {
      return NextResponse.json(
        {
          error: "No account found for this email. Would you like to sign up?",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Invalid password. Please try again.", code: "INVALID_PASSWORD" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ user: result.user });
  res.cookies.set(COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return res;
}
