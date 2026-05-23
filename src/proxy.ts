import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

const AUTH_ROUTES = ["/login", "/register", "/recruiter/signup"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? verifyToken(token) : null;

  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // Redirect authenticated users away from login/signup pages to their dashboard
  if (isAuthRoute && session) {
    if (session.role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (session.role === "recruiter") {
      return NextResponse.redirect(new URL("/dashboard/interviews", req.url));
    }
    return NextResponse.redirect(new URL("/browse", req.url));
  }

  // Admin-only
  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Recruiter-only (but /recruiter/signup is public, handled above)
  if (pathname.startsWith("/dashboard")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.role !== "recruiter") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Applicant-only: /profile
  if (pathname.startsWith("/profile")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.role !== "applicant") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Recruiter/admin-only: applicant profile review pages
  if (pathname.startsWith("/applicant")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.role !== "recruiter" && session.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // /recruiter/[id] pages are public for viewing - booking requires auth handled in-page

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/recruiter/:path*",
    "/applicant/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
