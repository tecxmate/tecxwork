import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { parseTenantSlug } from "@/lib/tenant-host";

/**
 * Route guards and tenant resolution.
 *
 * (Next 16 renamed Middleware to Proxy; this file was `middleware.ts`.)
 *
 * Two jobs, and they need different scopes — which is why the matcher below is broad while
 * the guards are prefix-checked inside:
 *
 *   1. **Tenant resolution** must run on every rendered path, because any page or route may
 *      ask which workspace it is serving.
 *   2. **Route guards** apply only to the authenticated areas. Verifying a JWT on every
 *      request including public job pages would be pure overhead, so the session is only
 *      read when the path actually needs it.
 *
 * These are optimistic redirects, not the authorization boundary — the docs are explicit
 * that Proxy is not a session-management solution. Every route and page re-checks properly
 * server-side (see lib/agency-auth.ts); this only keeps signed-out people out of screens
 * that would fail anyway.
 */

const AUTH_ROUTES = ["/login", "/register", "/recruiter/signup"];

/** Areas whose pages require a session. `/recruiter/[id]` is deliberately public. */
const GUARDED_PREFIXES = ["/admin", "/dashboard", "/profile", "/applicant"];

function needsSession(pathname: string): boolean {
  return (
    AUTH_ROUTES.includes(pathname) ||
    GUARDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const guard = needsSession(pathname) ? routeGuard(req, pathname) : null;
  if (guard) return guard;

  return withTenantHeader(req);
}

/** The original role-based redirects, unchanged in behaviour. */
function routeGuard(req: NextRequest, pathname: string): NextResponse | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? verifyToken(token) : null;

  // Signed-in users have no business on login/signup; send them where they belong.
  if (AUTH_ROUTES.includes(pathname) && session) {
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

  return null;
}

/**
 * Publish the tenant named by the Host header as `x-tenant-slug`.
 *
 * The security-critical part is that the header is set unconditionally. `x-tenant-slug` is
 * an ordinary header, so a client can send one; merely defaulting it would let anyone
 * address any workspace with `curl -H "x-tenant-slug: someone-else"`. Writing it on every
 * request — with the empty string when the host names no tenant — means an inbound value is
 * always overwritten and the host remains the only thing that can set it.
 */
function withTenantHeader(req: NextRequest): NextResponse {
  const slug = parseTenantSlug(
    req.headers.get("host"),
    process.env.PLATFORM_ROOT_DOMAIN
  );

  const headers = new Headers(req.headers);
  headers.set("x-tenant-slug", slug ?? "");

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Broad, because tenant resolution is needed everywhere a page or route is rendered.
  // Excludes Next's own build output and static files in public/, which never read a
  // tenant and would only pay the cost.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|documentation.html|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|map)$).*)",
  ],
};
