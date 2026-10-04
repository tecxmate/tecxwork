import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getRecruiterFromSession } from "@/lib/auth";
import { recruiters } from "@/lib/db/schema";

/**
 * Who a request is acting as.
 *
 * The data layer used to answer this for itself: `getAgencyCrm()` and `getPipelineBoard()`
 * each read the session cookie, looked the recruiter up, and only then did their real work.
 * That made them callable from exactly one place — a browser request — and untestable
 * without mocking `next/headers`.
 *
 * Separating "who is asking" from "what to fetch" is worth doing for three reasons, in
 * increasing order of importance:
 *
 *   1. The same function now serves a page, a script, and a test.
 *   2. It is the prerequisite for machine access (see topics/agent-connectors.md): a
 *      connector authenticates with a token, not a cookie, and produces an actor the same
 *      shape as this one. Nothing downstream needs to know which it was.
 *   3. It makes the identity a *value* rather than ambient state, so a function's signature
 *      tells you whose data it returns. That is the property that stops a future refactor
 *      from silently serving one tenant's rows to another.
 *
 * `source` exists so an audit row can record how the caller authenticated, not just who
 * they were — the distinction an inspection asks about.
 */
export type RecruiterActor = {
  userId: number;
  recruiterId: number;
  company: string;
  /** "agency" places candidates into client companies; "client" is one of those companies. */
  clientKind: string;
  /** Null for a recruiter who belongs to no workspace yet. */
  orgId: number | null;
  source: "session" | "token";
};

/**
 * The one place a recruiter identity is read from the session.
 *
 * Deliberately the only session-reading function in the data path — everything below it
 * takes the actor as an argument. Returns null rather than throwing so a page can redirect
 * and a route can answer 401, each in its own way.
 */
export async function resolveRecruiterActor(): Promise<RecruiterActor | null> {
  const auth = await getRecruiterFromSession();
  if (!auth) return null;

  const [me] = await getDb()
    .select({
      company: recruiters.company,
      clientKind: recruiters.clientKind,
      orgId: recruiters.orgId,
    })
    .from(recruiters)
    .where(eq(recruiters.id, auth.recruiterId))
    .limit(1);
  if (!me) return null;

  return {
    userId: auth.session.userId,
    recruiterId: auth.recruiterId,
    company: me.company,
    clientKind: me.clientKind,
    orgId: me.orgId,
    source: "session",
  };
}

export function isAgencyActor(actor: RecruiterActor): boolean {
  return actor.clientKind === "agency" && actor.orgId != null;
}
