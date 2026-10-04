import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  authorizationServerMetadata,
  issuerForHost,
  protectedResourceMetadata,
} from "@/lib/oauth-metadata";

/**
 * Discovery has to describe the host the client actually asked, because every tenant lives
 * on its own subdomain. A document that names the apex when it was fetched from a tenant is
 * either rejected by the client (both RFCs have it check the issuer) or silently followed to
 * the wrong origin — and either way the Connect button stops working for exactly the
 * customers who paid for their own subdomain.
 */

const ROOT = "tecxwork.com";
const CONFIGURED = "https://tecxwork.com";

let savedRoot: string | undefined;
let savedSite: string | undefined;

beforeEach(() => {
  savedRoot = process.env.PLATFORM_ROOT_DOMAIN;
  savedSite = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.PLATFORM_ROOT_DOMAIN = ROOT;
  process.env.NEXT_PUBLIC_SITE_URL = CONFIGURED;
});

afterEach(() => {
  if (savedRoot === undefined) delete process.env.PLATFORM_ROOT_DOMAIN;
  else process.env.PLATFORM_ROOT_DOMAIN = savedRoot;
  if (savedSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = savedSite;
});

describe("oauth discovery — which origin the document names", () => {
  it("names the tenant's own subdomain", () => {
    expect(issuerForHost("yangluck.tecxwork.com")).toBe("https://yangluck.tecxwork.com");
  });

  it("names the apex when that is where the request arrived", () => {
    expect(issuerForHost("tecxwork.com")).toBe("https://tecxwork.com");
  });

  it("keeps development on http, including the subdomain form", () => {
    expect(issuerForHost("localhost:3000")).toBe("http://localhost:3000");
    expect(issuerForHost("yangluck.localhost:3000")).toBe("http://yangluck.localhost:3000");
    expect(issuerForHost("127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
  });

  it("falls back to the configured URL when there is no host at all", () => {
    expect(issuerForHost(null)).toBe(CONFIGURED);
    expect(issuerForHost("")).toBe(CONFIGURED);
  });
});

describe("oauth discovery — the Host header is not trusted", () => {
  it("refuses a host that is not this platform's", () => {
    // Otherwise anyone could hand a client a discovery document pointing at their own token
    // endpoint, simply by setting a header.
    expect(issuerForHost("evil.example")).toBe(CONFIGURED);
    expect(issuerForHost("tecxwork.com.evil.example")).toBe(CONFIGURED);
    expect(issuerForHost("nottecxwork.com")).toBe(CONFIGURED);
  });

  it("refuses a multi-label subdomain", () => {
    // `a.b.tecxwork.com` is not tenant `a`. Treating it as one is how a holder of a wildcard
    // certificate impersonates every tenant at once.
    expect(issuerForHost("a.b.tecxwork.com")).toBe(CONFIGURED);
  });

  it("serves the apex site rather than guessing when the root domain is unset", () => {
    delete process.env.PLATFORM_ROOT_DOMAIN;
    expect(issuerForHost("yangluck.tecxwork.com")).toBe(CONFIGURED);
    // The configured host itself still resolves, so a single-domain deployment works.
    expect(issuerForHost("tecxwork.com")).toBe(CONFIGURED);
  });
});

describe("oauth discovery — the documents themselves", () => {
  it("points every endpoint at the tenant's origin", () => {
    const meta = authorizationServerMetadata("yangluck.tecxwork.com");
    expect(meta.issuer).toBe("https://yangluck.tecxwork.com");
    expect(meta.authorization_endpoint).toBe("https://yangluck.tecxwork.com/oauth/authorize");
    expect(meta.token_endpoint).toBe("https://yangluck.tecxwork.com/api/oauth/token");
    expect(meta.registration_endpoint).toBe("https://yangluck.tecxwork.com/api/oauth/register");
  });

  it("names the resource on the same origin the client is talking to", () => {
    const meta = protectedResourceMetadata("yangluck.tecxwork.com");
    expect(meta.resource).toBe("https://yangluck.tecxwork.com/api/mcp");
    expect(meta.authorization_servers).toEqual(["https://yangluck.tecxwork.com"]);
  });

  it("advertises S256 only, and no grant that skips the consent screen", () => {
    const meta = authorizationServerMetadata("tecxwork.com");
    expect(meta.code_challenge_methods_supported).toEqual(["S256"]);
    expect(meta.grant_types_supported).toEqual(["authorization_code", "refresh_token"]);
    expect(meta.response_types_supported).toEqual(["code"]);
  });

  it("advertises no scope a tool cannot exercise", () => {
    // A consent screen should never show a permission that grants nothing.
    const meta = authorizationServerMetadata("tecxwork.com");
    expect(meta.scopes_supported).not.toContain("invoice:write");
    expect(meta.scopes_supported).not.toContain("placement:write");
    // candidate:read IS advertised, because search_candidates exercises it — but granting it
    // still reaches only candidates who separately consented to AI-assisted matching.
    expect(meta.scopes_supported).toContain("candidate:read");
  });
});
