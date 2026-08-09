import { NextResponse } from "next/server";
import { COOKIE_NAME, getSession, revokeSession } from "@/lib/auth";

/**
 * Sign out of this device.
 *
 * Clearing the cookie only tells the browser to forget the token; anyone who had captured
 * it could keep using it for the rest of its 24 hours. Deleting the session row is what
 * actually ends the session — which matters here because candidates sign in from shared
 * campus and library machines.
 *
 * Only this device's session is revoked; other devices stay signed in.
 */
export async function POST() {
  const session = await getSession();
  if (session?.jti) {
    // Never let a failed revoke block the sign-out the user asked for; clearing the
    // cookie below still logs them out of this browser.
    await revokeSession(session.jti).catch(() => {});
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
