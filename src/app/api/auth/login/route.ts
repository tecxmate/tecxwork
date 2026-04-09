import { NextRequest, NextResponse } from "next/server";
import { login, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: { email: string; password: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const result = await login(body.email, body.password);
  if (!result) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ user: result.user });
  res.cookies.set(COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  });

  return res;
}
