import { describe, expect, it } from "vitest";
import { isValidTenantSlug, parseTenantSlug } from "@/lib/tenant-host";
import {
  PLANS,
  hasFeature,
  isTrialExpired,
  planAllows,
  planFor,
} from "@/lib/plans";

const ROOT = "tecxwork.com";

describe("tenant host — which workspace a request is for", () => {
  it("reads the slug from a subdomain", () => {
    expect(parseTenantSlug("yangluck.tecxwork.com", ROOT)).toBe("yangluck");
  });

  it("ignores the port and is case-insensitive", () => {
    expect(parseTenantSlug("YangLuck.TecxWork.com:3000", ROOT)).toBe("yangluck");
  });

  it("the apex domain names no tenant", () => {
    expect(parseTenantSlug("tecxwork.com", ROOT)).toBeNull();
    expect(parseTenantSlug("www.tecxwork.com", ROOT)).toBeNull();
  });

  it("a host on a different domain names no tenant", () => {
    // Otherwise anyone who can point DNS at the app picks their own tenant.
    expect(parseTenantSlug("yangluck.evil.com", ROOT)).toBeNull();
    expect(parseTenantSlug("tecxwork.com.evil.com", ROOT)).toBeNull();
  });

  it("refuses a nested subdomain rather than reading its first label", () => {
    // `a.b.tecxwork.com` is not tenant `a`; treating it as one would let a wildcard
    // certificate holder address any tenant.
    expect(parseTenantSlug("a.b.tecxwork.com", ROOT)).toBeNull();
  });

  it("refuses reserved infrastructure names", () => {
    for (const reserved of ["api", "admin", "app", "www", "mail", "staging"]) {
      expect(parseTenantSlug(`${reserved}.${ROOT}`, ROOT)).toBeNull();
    }
  });

  it("without a configured root domain, nothing is a tenant", () => {
    // A deployment that forgot PLATFORM_ROOT_DOMAIN serves the apex site rather than
    // trusting an attacker-supplied Host header.
    expect(parseTenantSlug("yangluck.tecxwork.com", undefined)).toBeNull();
    expect(parseTenantSlug("yangluck.tecxwork.com", "")).toBeNull();
  });

  it("supports <slug>.localhost for development", () => {
    expect(parseTenantSlug("yangluck.localhost:3000", undefined)).toBe("yangluck");
    expect(parseTenantSlug("localhost:3000", undefined)).toBeNull();
  });

  it("handles a missing host", () => {
    expect(parseTenantSlug(null, ROOT)).toBeNull();
    expect(parseTenantSlug("", ROOT)).toBeNull();
  });
});

describe("tenant slug validation", () => {
  it("accepts DNS-shaped slugs", () => {
    expect(isValidTenantSlug("yang-luck")).toBe(true);
    expect(isValidTenantSlug("a")).toBe(true);
    expect(isValidTenantSlug("agency123")).toBe(true);
  });

  it("refuses anything that cannot be a DNS label", () => {
    expect(isValidTenantSlug("-leading")).toBe(false);
    expect(isValidTenantSlug("trailing-")).toBe(false);
    expect(isValidTenantSlug("Upper")).toBe(false);
    expect(isValidTenantSlug("has space")).toBe(false);
    expect(isValidTenantSlug("has_underscore")).toBe(false);
    expect(isValidTenantSlug("dot.ted")).toBe(false);
    expect(isValidTenantSlug("")).toBe(false);
    expect(isValidTenantSlug("x".repeat(64))).toBe(false);
  });

  it("refuses reserved names, so a customer cannot claim admin.", () => {
    expect(isValidTenantSlug("admin")).toBe(false);
    expect(isValidTenantSlug("api")).toBe(false);
  });
});

describe("plans — what a tenant bought", () => {
  it("an unknown plan falls back to the most restrictive one, never to everything", () => {
    expect(planFor("nonsense").id).toBe("trial");
  });

  it("starter does not include billing; growth does", () => {
    expect(hasFeature("starter", "billing")).toBe(false);
    expect(hasFeature("growth", "billing")).toBe(true);
  });

  it("only scale includes api_access, the flag connectors will gate on", () => {
    const withApi = Object.values(PLANS).filter((p) => p.features.includes("api_access"));
    expect(withApi.map((p) => p.id)).toEqual(["scale"]);
  });

  it("a trial shows the commercial product, because that is what people buy", () => {
    expect(hasFeature("trial", "compliance")).toBe(true);
    expect(hasFeature("trial", "billing")).toBe(true);
    expect(hasFeature("trial", "api_access")).toBe(false);
  });

  it("maps capabilities to features so routes need no edit", () => {
    expect(planAllows("starter", "invoice:write")).toBe(false);
    expect(planAllows("growth", "invoice:write")).toBe(true);
    // A capability with no feature is part of the product, not a package.
    expect(planAllows("starter", "member:invite")).toBe(true);
  });
});

describe("trial expiry", () => {
  const past = new Date("2026-01-01T00:00:00Z");
  const future = new Date("2099-01-01T00:00:00Z");

  it("a trial past its end date is expired", () => {
    expect(isTrialExpired("trial", past)).toBe(true);
  });

  it("a trial still running is not", () => {
    expect(isTrialExpired("trial", future)).toBe(false);
  });

  it("a trial with no end date never expires — an unset date is not a lapsed one", () => {
    expect(isTrialExpired("trial", null)).toBe(false);
  });

  it("a paid plan never expires, even carrying a stale trial date", () => {
    // Upgrading writes the plan; it must not have to remember to clear trial_ends_at.
    expect(isTrialExpired("growth", past)).toBe(false);
  });
});
