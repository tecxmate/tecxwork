import { getPublicBaseUrl } from "@/lib/email";

/**
 * Where the connector advertises itself.
 *
 * An MCP client is handed one URL and has to discover everything else, so these documents
 * are the difference between "paste this URL" and "read our integration guide". Apollo
 * publishes the same pair; it is the mechanism behind a working Connect button.
 */

/**
 * The issuer — the origin the client is actually talking to.
 *
 * This has to be derived per request rather than read from a build-time variable, because
 * every tenant lives on its own subdomain. A customer at `yangluck.tecxwork.com` who
 * discovers there and is handed `https://tecxwork.com` gets a document that does not
 * describe the server they asked: RFC 8414 and RFC 9728 both have the client check that the
 * issuer matches where it fetched from, so the mismatch is a silent failure or a silent
 * retarget to the apex. Either way the Connect button stops working for exactly the
 * customers who have their own subdomain.
 *
 * **The Host header is attacker-controlled**, so it is validated rather than trusted: it is
 * accepted only when it is the platform's own domain, a single-label subdomain of it, or a
 * loopback development host. Anything else falls back to the configured public URL. An
 * unvalidated Host here would let someone hand a client a discovery document pointing at
 * their own token endpoint.
 */
export function issuerForHost(host: string | null | undefined): string {
  const fallback = getPublicBaseUrl();
  if (!host) return fallback;

  const normalized = host.trim().toLowerCase();
  const bare = normalized.split(":")[0] ?? "";
  if (!bare) return fallback;

  // Development: `localhost`, `127.0.0.1`, and `<slug>.localhost` are all http.
  if (bare === "localhost" || bare === "127.0.0.1" || bare.endsWith(".localhost")) {
    return `http://${normalized}`;
  }

  // The origin the deployment already knows it serves — covers apex and preview URLs.
  try {
    if (bare === new URL(fallback).host.split(":")[0]) return fallback;
  } catch {
    /* a malformed configured URL is the fallback's problem, not this function's */
  }

  const root = process.env.PLATFORM_ROOT_DOMAIN?.trim().toLowerCase().replace(/^\.+|\.+$/g, "");
  if (root && bare !== root && bare.endsWith(`.${root}`)) {
    const prefix = bare.slice(0, -(root.length + 1));
    // A single label only. `a.b.tecxwork.com` is not a tenant, and treating it as one is how
    // a wildcard-certificate holder impersonates every tenant at once.
    if (!prefix.includes(".")) return `https://${bare}`;
  }
  if (root && bare === root) return `https://${bare}`;

  return fallback;
}

export function authorizationServerMetadata(host?: string | null) {
  const base = issuerForHost(host);
  return {
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/api/oauth/token`,
    registration_endpoint: `${base}/api/oauth/register`,
    // OAuth 2.1: authorization code only. No implicit, no password grant.
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    // S256 only. `plain` is in the spec and is not a protection.
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    scopes_supported: SUPPORTED_SCOPES,
    service_documentation: `${base}/how-it-works`,
  };
}

export function protectedResourceMetadata(host?: string | null) {
  const base = issuerForHost(host);
  return {
    resource: `${base}/api/mcp`,
    authorization_servers: [base],
    scopes_supported: SUPPORTED_SCOPES,
    bearer_methods_supported: ["header"],
  };
}

/**
 * The scopes a connector may request.
 *
 * Only the capabilities the MCP tools actually use. Advertising the full matrix would
 * invite a client to ask for `invoice:write`, which no tool can exercise — a consent screen
 * should never show a permission that grants nothing.
 */
export const SUPPORTED_SCOPES = [
  "client:read",
  "compliance:read",
  "audit:read",
  "member:invite",
] as const;

export type SupportedScope = (typeof SUPPORTED_SCOPES)[number];

export function isSupportedScope(value: string): value is SupportedScope {
  return (SUPPORTED_SCOPES as readonly string[]).includes(value);
}
