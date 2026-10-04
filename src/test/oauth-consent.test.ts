import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { memberships, recruiters } from "@/lib/db/schema";
import { registerClient } from "@/lib/oauth";
import type { MemberRole } from "@/lib/ats-auth";
import { createOrg } from "@/lib/provisioning";
import AuthorizePage from "@/app/oauth/authorize/page";
import { POST as approvePost } from "@/app/api/oauth/authorize/route";
import { NextRequest } from "next/server";
import { clearSession, seedRecruiter, withSession } from "./helpers";

/**
 * The consent screen is the only place in the whole flow where a human decides, so its
 * refusals are the real access control — everything before it hands out an identity that
 * grants nothing.
 *
 * These assert the element the server component returns rather than rendered HTML: the
 * question is which branch it took and what it was about to display, not how it looks.
 */

let seq = 0;
const REDIRECT = "http://127.0.0.1:33418/callback";

async function newOrg() {
  // createOrg does not return the name, so carry it here — the consent screen naming the
  // right workspace is one of the things worth asserting.
  const name = `Consent Org ${seq}`;
  const result = await createOrg({
    name,
    slug: `consent-org-${seq++}-${Date.now()}`,
    plan: "scale",
  });
  if (!result.ok) throw new Error(result.error);
  return { ...result.data, name };
}

async function memberOf(orgId: number, role: MemberRole = "admin") {
  const rec = await seedRecruiter({ email: `consent-${seq++}-${Date.now()}@example.com` });
  await db
    .update(recruiters)
    .set({ orgId, clientKind: "agency" })
    .where(eq(recruiters.id, rec.recruiterId));
  await db.insert(memberships).values({ orgId, userId: rec.userId, role });
  return rec;
}

async function newClient() {
  const result = await registerClient({ name: "Claude", redirectUris: [REDIRECT] });
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

/** The query an MCP client actually sends. */
function query(clientId: string, over: Record<string, string> = {}) {
  return Promise.resolve({
    client_id: clientId,
    redirect_uri: REDIRECT,
    state: "xyz",
    code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    code_challenge_method: "S256",
    scope: "client:read compliance:read",
    ...over,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function render(searchParams: Promise<Record<string, any>>): Promise<any> {
  return AuthorizePage({ searchParams });
}

describe("oauth consent — signing in first", () => {
  it("sends an anonymous visitor to log in and come back to the same request", async () => {
    // The most likely real-world entry: the client opens the authorize URL in a browser that
    // has never signed in. Losing the query here would strand the flow with no way back.
    clearSession();
    const client = await newClient();

    let thrown: unknown;
    try {
      await render(query(client.clientId));
    } catch (error) {
      thrown = error;
    }

    // next/navigation's redirect() signals by throwing; the destination rides in the digest.
    const digest = String((thrown as { digest?: string })?.digest ?? "");
    expect(digest).toContain("NEXT_REDIRECT");
    expect(digest).toContain("/login");
    expect(decodeURIComponent(digest)).toContain("/oauth/authorize?");
    expect(decodeURIComponent(digest)).toContain(client.clientId);
  });
});

describe("oauth consent — the refusals", () => {
  it("refuses an unregistered client", async () => {
    const org = await newOrg();
    const member = await memberOf(org.id);
    await withSession({ userId: member.userId, email: member.email, role: "recruiter" });

    const result = await render(query("mcp_nothing_registered"));
    expect(result.props.title).toMatch(/unknown application/i);
  });

  it("refuses a redirect the client never registered", async () => {
    // The redirect target is where tokens end up, so it is the one field worth being
    // absolutely rigid about — and the error is rendered here, never bounced to the
    // unvalidated address, which is how an open redirect ships.
    const org = await newOrg();
    const member = await memberOf(org.id);
    const client = await newClient();
    await withSession({ userId: member.userId, email: member.email, role: "recruiter" });

    const result = await render(
      query(client.clientId, { redirect_uri: "https://evil.example/cb" })
    );
    expect(result.props.title).toMatch(/redirect address not recognised/i);
  });

  it("refuses a client that omits PKCE or asks for plain", async () => {
    const org = await newOrg();
    const member = await memberOf(org.id);
    const client = await newClient();
    await withSession({ userId: member.userId, email: member.email, role: "recruiter" });

    const missing = await render(query(client.clientId, { code_challenge: "" }));
    expect(missing.props.title).toMatch(/outdated sign-in/i);

    const plain = await render(query(client.clientId, { code_challenge_method: "plain" }));
    expect(plain.props.title).toMatch(/outdated sign-in/i);
  });
});

describe("oauth consent — what it offers", () => {
  it("shows the workspace and only the scopes this member could delegate", async () => {
    // An interviewer holds nothing, so there is nothing to approve — the screen must not
    // offer a delegation the server would then refuse.
    const org = await newOrg();
    const admin = await memberOf(org.id, "admin");
    const client = await newClient();

    await withSession({ userId: admin.userId, email: admin.email, role: "recruiter" });
    const asAdmin = await render(query(client.clientId));
    expect(asAdmin.props.scopes).toEqual(["client:read", "compliance:read"]);
    expect(asAdmin.props.workspaceName).toBe(org.name);

    const interviewer = await memberOf(org.id, "interviewer");
    await withSession({
      userId: interviewer.userId,
      email: interviewer.email,
      role: "recruiter",
    });
    const asInterviewer = await render(query(client.clientId));
    expect(asInterviewer.props.scopes).toEqual([]);
    // And it says so, rather than silently showing an approve button that grants nothing.
    expect(asInterviewer.props.unsupported.length).toBeGreaterThan(0);
  });

  it("drops a scope this server does not support at all", async () => {
    const org = await newOrg();
    const admin = await memberOf(org.id, "admin");
    const client = await newClient();
    await withSession({ userId: admin.userId, email: admin.email, role: "recruiter" });

    const result = await render(
      query(client.clientId, { scope: "client:read candidate:erase not:a:scope" })
    );
    expect(result.props.scopes).toEqual(["client:read"]);
  });
});

describe("oauth consent — approval cannot be forged", () => {
  /** The approval POST as a browser sends it: a form, with the headers a browser attaches. */
  function approval(headers: Record<string, string>, clientId: string) {
    return new NextRequest("http://app.tecxwork.test/api/oauth/authorize", {
      method: "POST",
      headers: new Headers({
        "content-type": "application/x-www-form-urlencoded",
        host: "app.tecxwork.test",
        ...headers,
      }),
      body: new URLSearchParams({
        client_id: clientId,
        redirect_uri: REDIRECT,
        state: "xyz",
        code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
        scope: "client:read",
      }).toString(),
    });
  }

  it("refuses a submission from another origin", async () => {
    // PKCE is no defence here — an attacker who forges this generated the verifier, so a
    // code issued to their client is a code they can spend.
    const org = await newOrg();
    const member = await memberOf(org.id);
    const client = await newClient();
    await withSession({ userId: member.userId, email: member.email, role: "recruiter" });

    const res = await approvePost(
      approval(
        { origin: "https://evil.example", "sec-fetch-site": "cross-site" },
        client.clientId
      )
    );
    expect(res.status).toBe(403);
  });

  it("refuses a submission from a sibling subdomain", async () => {
    // The reason this check is not redundant with SameSite=Lax: a tenant lives on a
    // subdomain, and Lax counts every subdomain as same-site.
    const org = await newOrg();
    const member = await memberOf(org.id);
    const client = await newClient();
    await withSession({ userId: member.userId, email: member.email, role: "recruiter" });

    const res = await approvePost(
      approval(
        { origin: "https://other-tenant.tecxwork.test", "sec-fetch-site": "same-site" },
        client.clientId
      )
    );
    expect(res.status).toBe(403);
  });

  it("accepts the form the consent page itself submitted", async () => {
    const org = await newOrg();
    const member = await memberOf(org.id);
    const client = await newClient();
    await withSession({ userId: member.userId, email: member.email, role: "recruiter" });

    const res = await approvePost(
      approval(
        { origin: "http://app.tecxwork.test", "sec-fetch-site": "same-origin" },
        client.clientId
      )
    );
    // 303 back to the client's redirect URI, carrying the code.
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("code=");
  });

  it("still re-intersects scopes, because a hidden field is attacker-controlled too", async () => {
    // An interviewer holds nothing. A tampered form asking for client:read must not get it.
    const org = await newOrg();
    const member = await memberOf(org.id, "interviewer");
    const client = await newClient();
    await withSession({ userId: member.userId, email: member.email, role: "recruiter" });

    const res = await approvePost(
      approval(
        { origin: "http://app.tecxwork.test", "sec-fetch-site": "same-origin" },
        client.clientId
      )
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_scope");
  });
});
