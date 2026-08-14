/**
 * Turning a Host header into a tenant slug.
 *
 * Pure and dependency-free on purpose: this runs in the proxy, in route handlers and in
 * tests, and it is the function that decides which tenant a request belongs to. Anything
 * that important should be testable without booting a framework.
 */

/**
 * Subdomains that are infrastructure, not tenants. A customer must never be able to claim
 * `admin` or `api` as their slug and start receiving traffic meant for the platform, so the
 * same list gates both host parsing and slug validation at provisioning time.
 */
export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  "www",
  "app",
  "api",
  "admin",
  "platform",
  "auth",
  "login",
  "static",
  "assets",
  "cdn",
  "img",
  "images",
  "mail",
  "email",
  "smtp",
  "docs",
  "status",
  "support",
  "help",
  "blog",
  "staging",
  "preview",
  "test",
  "dev",
  "demo",
  "work",
]);

/** Lowercase host without its port. */
function normalizeHost(host: string): string {
  return host.trim().toLowerCase().split(":")[0] ?? "";
}

/**
 * The tenant slug carried by a host, or null when the request is not for a tenant.
 *
 * Null is the normal, non-exceptional answer: the apex marketing site, a bare `localhost`,
 * a Vercel preview URL and the test suite all legitimately have no tenant. Callers treat
 * null as "fall back to the caller's own membership" rather than as an error — which is
 * what keeps single-domain access working alongside subdomains.
 *
 * `rootDomain` is the platform's own domain (e.g. `tecxwork.com`). Without it configured,
 * only the `<slug>.localhost` development form is recognised — a deployment that forgot the
 * variable serves the apex site to everyone rather than guessing a tenant from an
 * attacker-supplied Host header.
 */
export function parseTenantSlug(
  host: string | null | undefined,
  rootDomain: string | null | undefined
): string | null {
  if (!host) return null;
  const normalized = normalizeHost(host);
  if (!normalized) return null;

  // `<slug>.localhost` — the only way to exercise subdomain routing locally.
  if (normalized.endsWith(".localhost")) {
    return validateSlug(normalized.slice(0, -".localhost".length));
  }

  const root = rootDomain ? normalizeHost(rootDomain) : "";
  if (!root) return null;
  if (normalized === root) return null;

  const suffix = `.${root}`;
  if (!normalized.endsWith(suffix)) return null;

  const prefix = normalized.slice(0, -suffix.length);
  // Only a single label is a tenant. `a.b.tecxwork.com` is not `a` — treating it as such
  // would let one wildcard certificate holder impersonate any tenant.
  if (prefix.includes(".")) return null;

  return validateSlug(prefix);
}

/**
 * Slug rules, applied both to hosts on the way in and to slugs on the way into the
 * database. DNS labels are lowercase alphanumerics and hyphens, 1-63 characters, and may
 * not start or end with a hyphen; a slug that cannot be a DNS label cannot be a subdomain.
 */
export function isValidTenantSlug(slug: string): boolean {
  if (slug.length === 0 || slug.length > 63) return false;
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) return false;
  return !RESERVED_SUBDOMAINS.has(slug);
}

function validateSlug(candidate: string): string | null {
  const slug = candidate.trim().toLowerCase();
  return isValidTenantSlug(slug) ? slug : null;
}
