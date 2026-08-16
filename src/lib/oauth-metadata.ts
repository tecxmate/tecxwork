import { getPublicBaseUrl } from "@/lib/email";

/**
 * Where the connector advertises itself.
 *
 * An MCP client is handed one URL and has to discover everything else, so these documents
 * are the difference between "paste this URL" and "read our integration guide". Apollo
 * publishes the same pair; it is the mechanism behind a working Connect button.
 */

/** The issuer must match exactly what clients will see, or discovery fails silently. */
export function issuer(): string {
  return getPublicBaseUrl();
}

export function authorizationServerMetadata() {
  const base = issuer();
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

export function protectedResourceMetadata() {
  const base = issuer();
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
