import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { getSession } from "@/lib/auth";
import { getMember } from "@/lib/ats-auth";
import { db, memberships, orgs, recruiters, sessions, users } from "@/lib/db";
import {
  membershipRole,
  recruiterForUser,
  recruiterIdForUser,
  sessionExpiry,
} from "@/lib/request-cache";
import { clearSession, withSession } from "./helpers";

/**
 * The per-request memo layer, and the one rule that makes it safe to memoise
 * anything auth-shaped at all.
 */

describe("the keying rule", () => {
  // THIS IS THE LOAD-BEARING TEST IN THIS FILE.
  //
  // Every memo in request-cache.ts takes the identifier it looks up as an
  // argument. A memo that takes NO arguments and reads the cookie itself would
  // be keyed on nothing — and if React's per-request cache scope ever failed to
  // hold, it would serve the first request's session to the second. Every test
  // written with a single account would still pass, and the bug would be a
  // cross-account session leak in production.
  //
  // So the shape is pinned here rather than left to reviewer memory. A new
  // `export const x = cache(async () => …)` with an empty parameter list fails
  // this test, and the fix is to pass the identifier in from the caller.
  it("gives every memo at least one argument to key on", () => {
    const src = readFileSync(resolve(process.cwd(), "src/lib/request-cache.ts"), "utf8");

    const memos = [...src.matchAll(/export const (\w+) = cache\(\s*async\s*\(([^)]*)\)/g)].map(
      (m) => ({ name: m[1], params: m[2].trim() })
    );

    expect(memos.length).toBeGreaterThan(0);
    const unkeyed = memos.filter((m) => m.params === "").map((m) => m.name);
    expect(unkeyed, `unkeyed memo(s) in request-cache.ts: ${unkeyed.join(", ")}`).toEqual([]);
  });

  it("does not let the memo layer read ambient request state", () => {
    // Same rule from the other side: a memo that reaches for cookies() or
    // headers() is keyed on nothing no matter what its signature says.
    const src = readFileSync(resolve(process.cwd(), "src/lib/request-cache.ts"), "utf8");
    expect(src).not.toMatch(/from "next\/headers"/);
  });
});

describe("the memos return what they were asked for", () => {
  let userA = 0;
  let userB = 0;
  let orgId = 0;
  let recA = 0;

  beforeEach(async () => {
    clearSession();
    const [a] = await db
      .insert(users)
      .values({ email: "memo-a@test.local", name: "memo-a", passwordHash: "x", role: "recruiter" })
      .returning({ id: users.id });
    const [b] = await db
      .insert(users)
      .values({ email: "memo-b@test.local", name: "memo-b", passwordHash: "x", role: "recruiter" })
      .returning({ id: users.id });
    userA = a.id;
    userB = b.id;

    const [o] = await db
      .insert(orgs)
      .values({ name: "Memo Org", slug: `memo-${Date.now()}`, kind: "agency" })
      .returning({ id: orgs.id });
    orgId = o.id;

    const [r] = await db
      .insert(recruiters)
      .values({
        userId: userA,
        company: "Memo Co",
        industry: "staffing",
        contactEmail: "memo@test.local",
        clientKind: "agency",
        orgId,
      })
      .returning({ id: recruiters.id });
    recA = r.id;

    await db.insert(memberships).values({ userId: userA, orgId, role: "admin" });
  });

  it("keys the recruiter lookup on the user, so two users never share an answer", async () => {
    expect(await recruiterIdForUser(userA)).toBe(recA);
    // userB has no recruiter row. If the memo were keyed on nothing, this would
    // return userA's id — which is the whole failure this design prevents.
    expect(await recruiterIdForUser(userB)).toBeNull();
  });

  it("returns the recruiter's id and tenancy facts in one read", async () => {
    // One row, one query. These were two lookups of the same row — id by user,
    // then clientKind/orgId back by that id — on every agency-scoped request.
    expect(await recruiterForUser(userA)).toEqual({ id: recA, clientKind: "agency", orgId });
    expect(await recruiterForUser(userB)).toBeNull();
  });

  it("scopes a membership to the org when one is named", async () => {
    expect(await membershipRole(userA)).toEqual({ orgId, role: "admin" });
    expect(await membershipRole(userA, orgId)).toEqual({ orgId, role: "admin" });
    expect(await membershipRole(userA, orgId + 9_999)).toBeNull();
    expect(await membershipRole(userB)).toBeNull();
  });
});

describe("memoising the session check did not weaken it", () => {
  beforeEach(() => clearSession());

  it("still refuses a session whose row was deleted", async () => {
    const [u] = await db
      .insert(users)
      .values({ email: "memo-revoke@test.local", name: "memo-revoke", passwordHash: "x", role: "recruiter" })
      .returning({ id: users.id });
    await withSession({ userId: u.id, email: "memo-revoke@test.local", role: "recruiter" });

    const live = await getSession();
    expect(live?.userId).toBe(u.id);

    // Revocation has to bite on the next resolution, not eventually. The memo
    // lasts one request; a new one re-reads the row.
    await db.delete(sessions).where(eq(sessions.userId, u.id));
    expect(await sessionExpiry(live!.jti!)).toBeNull();
  });

  it("still refuses a session that has expired in place", async () => {
    const [u] = await db
      .insert(users)
      .values({ email: "memo-expired@test.local", name: "memo-expired", passwordHash: "x", role: "recruiter" })
      .returning({ id: users.id });
    await withSession({ userId: u.id, email: "memo-expired@test.local", role: "recruiter" });
    const live = await getSession();

    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() - 3_600_000) })
      .where(eq(sessions.userId, u.id));

    const expiry = await sessionExpiry(live!.jti!);
    expect(expiry && expiry.getTime() <= Date.now()).toBe(true);
  });

  it("returns null from getMember for a user with no membership", async () => {
    const [u] = await db
      .insert(users)
      .values({ email: "memo-nomember@test.local", name: "memo-nomember", passwordHash: "x", role: "recruiter" })
      .returning({ id: users.id });
    await withSession({ userId: u.id, email: "memo-nomember@test.local", role: "recruiter" });
    expect(await getMember()).toBeNull();
  });
});
