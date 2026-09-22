import "server-only";

import { cache } from "react";

/**
 * Per-request memoisation for the handful of lookups every page and route does
 * before it can do anything else: is this session still live, which recruiter is
 * this user, what org are they in, is that org paid up.
 *
 * WHY. Measured on this app, against a local Postgres with `log_statement=all`,
 * signed in as the Yang Luck recruiter:
 *
 *     /dashboard/clients    28 statements, 13 distinct  — 53% repeats
 *     /dashboard/pipeline   21 statements, 12 distinct
 *     /dashboard/reports    22 statements
 *
 * The repeats are all context. The session row was read SIX times on one render
 * of /dashboard/clients, the recruiter row four. Nothing is wrong with the code
 * that does it — each loader resolves its own auth so that it is safe to call
 * from anywhere, which is the property that stopped a page from showing rows its
 * route would have refused. The cost is that the same three facts get re-fetched
 * by every loader that needs them.
 *
 * On a local socket that is free. On Vercel `sin1` talking to Neon over a
 * WebSocket it is a round trip each, and they are sequential because each loader
 * awaits its own auth before it queries anything — so the repeats are latency the
 * page pays before rendering, not throughput.
 *
 * WHAT THIS IS NOT. Not a data cache. `cache()` from React lasts exactly one
 * server request and is dropped when it finishes; nothing here survives into the
 * next one, and nothing is shared between users. Revocation still takes effect on
 * the next request, which is what "revoked" has always meant here — the previous
 * behaviour was to re-read the same row several times within one request that had
 * already been admitted, which never caught anything.
 *
 * THE KEYING RULE, AND WHY IT IS NOT NEGOTIABLE. Every function below takes the
 * identifier it is looking up as an argument, and none of them read the cookie,
 * the headers, or any other ambient request state. That is what makes a
 * scope bug boring instead of catastrophic: if `cache()` were ever to hand one
 * request's entry to another, the worst it could leak is the answer to "is
 * session <uuid> live" for a uuid the other request already had. A memo keyed on
 * *nothing* — `cache(() => readTheCookieAndLookItUp())` — would instead hand the
 * second request the first user's session, and it would look identical in every
 * test that used one account.
 *
 * So: resolve the identifier in the caller, pass it in, and keep these pure.
 */

import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { memberships, recruiters, sessions } from "@/lib/db/schema";

/** Is this session row still present and unexpired? Keyed on the session id. */
export const sessionExpiry = cache(async (jti: string): Promise<Date | null> => {
  const [row] = await getDb()
    .select({ expiresAt: sessions.expiresAt })
    .from(sessions)
    .where(eq(sessions.id, jti))
    .limit(1);
  return row?.expiresAt ?? null;
});

export type RecruiterContext = { id: number; clientKind: string; orgId: number | null };

/**
 * The caller's recruiter row: its id and its tenancy facts, in one read.
 *
 * These were two lookups of the SAME ROW — `getRecruiterFromSession()` fetched the
 * id by user_id, then every agency-scoped caller fetched clientKind and orgId back
 * by that id. On the pipeline page they showed up as two statements four
 * milliseconds apart, and on Neon that is two WebSocket round trips on the request's
 * critical path for one row that was already in hand.
 *
 * Keyed on the user id, which every caller has: `getRecruiterFromSession()` reads it
 * off the verified token, and the three agency resolvers all go through that first.
 */
export const recruiterForUser = cache(async (userId: number): Promise<RecruiterContext | null> => {
  const [row] = await getDb()
    .select({ id: recruiters.id, clientKind: recruiters.clientKind, orgId: recruiters.orgId })
    .from(recruiters)
    .where(eq(recruiters.userId, userId))
    .limit(1);
  return row ?? null;
});

/** The recruiter row id for a user, if they have one. */
export async function recruiterIdForUser(userId: number): Promise<number | null> {
  return (await recruiterForUser(userId))?.id ?? null;
}

/** A user's org membership. Keyed on user id, and — when one is named — the org. */
export const membershipRole = cache(
  async (userId: number, orgId?: number): Promise<{ orgId: number; role: string } | null> => {
    const [row] = await getDb()
      .select({ orgId: memberships.orgId, role: memberships.role })
      .from(memberships)
      .where(
        orgId == null
          ? eq(memberships.userId, userId)
          : and(eq(memberships.userId, userId), eq(memberships.orgId, orgId))
      )
      .limit(1);
    return row ? { orgId: row.orgId, role: row.role as string } : null;
  }
);
