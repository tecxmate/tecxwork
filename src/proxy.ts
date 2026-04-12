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
      return NextResponse.redirect(new URL("/dashboard", req.url));
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

  // Applicant-only: /browse and /recruiter/[id] (but not /recruiter/signup)
  if (
    pathname.startsWith("/browse") ||
    pathname.startsWith("/profile") ||
    (pathname.startsWith("/recruiter/") && pathname !== "/recruiter/signup")
  ) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.role !== "applicant") {
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
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
