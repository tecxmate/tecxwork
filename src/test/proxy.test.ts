import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { COOKIE_NAME, createToken, type SessionPayload } from "@/lib/auth";
import { proxy } from "@/proxy";

/**
 * The proxy does two unrelated jobs on different scopes, and both are easy to break
 * silently: the route guards produce redirects no route test exercises, and the tenant
 * header is a security boundary. Neither had coverage.
 */

const ROOT = "tecxwork.com";

function request(
  path: string,
  opts: { host?: string; session?: SessionPayload } = {}
): NextRequest {
  const host = opts.host ?? ROOT;
  const req = new NextRequest(`https://${host}${path}`, {
    headers: new Headers({ host }),
  });
  if (opts.session) {
    req.cookies.set(COOKIE_NAME, createToken(opts.session));
  }
  return req;
}

const admin: SessionPayload = { userId: 1, email: "a@x.dev", role: "admin", jti: "j1" };
const recruiter: SessionPayload = {
  userId: 2,
  email: "r@x.dev",
  role: "recruiter",
  jti: "j2",
};
const applicant: SessionPayload = {
  userId: 3,
  email: "s@x.dev",
  role: "applicant",
  jti: "j3",
};

function locationOf(res: Response): string | null {
  const location = res.headers.get("location");
  return location ? new URL(location).pathname : null;
}

beforeEach(() => {
  process.env.PLATFORM_ROOT_DOMAIN = ROOT;
});

describe("proxy — route guards", () => {
  it("sends a signed-out visitor from a guarded area to login", () => {
    for (const path of ["/admin", "/dashboard/interviews", "/profile", "/applicant/7"]) {
      expect(locationOf(proxy(request(path))), path).toBe("/login");
    }
  });

  it("keeps the wrong role out of each area", () => {
    expect(locationOf(proxy(request("/admin", { session: recruiter })))).toBe("/login");
    expect(locationOf(proxy(request("/dashboard", { session: applicant })))).toBe("/login");
    expect(locationOf(proxy(request("/profile", { session: recruiter })))).toBe("/login");
    expect(locationOf(proxy(request("/applicant/7", { session: applicant })))).toBe("/login");
  });

  it("lets the right role through", () => {
    expect(locationOf(proxy(request("/admin", { session: admin })))).toBeNull();
    expect(locationOf(proxy(request("/dashboard", { session: recruiter })))).toBeNull();
    expect(locationOf(proxy(request("/profile", { session: applicant })))).toBeNull();
    expect(locationOf(proxy(request("/applicant/7", { session: recruiter })))).toBeNull();
  });

  it("redirects a signed-in user away from login and signup, by role", () => {
    expect(locationOf(proxy(request("/login", { session: admin })))).toBe("/admin");
    expect(locationOf(proxy(request("/login", { session: recruiter })))).toBe(
      "/dashboard/interviews"
    );
    expect(locationOf(proxy(request("/login", { session: applicant })))).toBe("/browse");
    expect(locationOf(proxy(request("/recruiter/signup", { session: admin })))).toBe("/admin");
  });

  it("leaves public pages alone", () => {
    // /recruiter/[id] is a public company page — guarding it would break the directory.
    for (const path of ["/", "/jobs", "/browse", "/recruiter/12", "/login"]) {
      expect(locationOf(proxy(request(path))), path).toBeNull();
    }
  });
});

describe("proxy — tenant header", () => {
  function tenantHeaderOf(req: NextRequest): string | null {
    const res = proxy(req);
    return res.headers.get("x-middleware-request-x-tenant-slug");
  }

  it("publishes the tenant named by the host", () => {
    expect(tenantHeaderOf(request("/jobs", { host: `yangluck.${ROOT}` }))).toBe("yangluck");
  });

  it("publishes an empty tenant on the apex domain", () => {
    expect(tenantHeaderOf(request("/jobs", { host: ROOT }))).toBe("");
  });

  it("overwrites a client-supplied header rather than trusting it", () => {
    // The whole tenant boundary rests on this: without the unconditional set, anyone could
    // address any workspace by sending the header themselves.
    const req = new NextRequest(`https://${ROOT}/jobs`, {
      headers: new Headers({ host: ROOT, "x-tenant-slug": "victim" }),
    });
    expect(tenantHeaderOf(req)).toBe("");
  });

  it("overwrites a spoofed header even when the host does name a tenant", () => {
    const req = new NextRequest(`https://yangluck.${ROOT}/jobs`, {
      headers: new Headers({ host: `yangluck.${ROOT}`, "x-tenant-slug": "victim" }),
    });
    expect(tenantHeaderOf(req)).toBe("yangluck");
  });
});
