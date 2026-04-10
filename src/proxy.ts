import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

const PROTECTED_ROUTES = ["/browse", "/dashboard", "/admin", "/recruiter"];
const AUTH_ROUTES = ["/login", "/register"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? verifyToken(token) : null;

  const isProtected = PROTECTED_ROUTES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname === p);

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect authenticated users away from login/register to their dashboard
  if (isAuthRoute && session) {
    if (session.role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (session.role === "recruiter") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/browse", req.url));
  }

  // Role-based access to protected routes
  if (session) {
    if (pathname.startsWith("/admin") && session.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/dashboard") && session.role !== "recruiter") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (
      (pathname.startsWith("/browse") || pathname.startsWith("/recruiter/")) &&
      session.role !== "applicant"
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/browse/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/recruiter/:path*",
    "/login",
    "/register",
  ],
};
