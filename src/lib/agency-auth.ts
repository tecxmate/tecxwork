import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRecruiterFromSession } from "@/lib/auth";
import { recruiters } from "@/lib/db/schema";

export type AgencyActor = {
  orgId: number;
  recruiterId: number;
  userId: number;
};

/**
 * The single gate every agency write goes through.
 *
 * Two things have to be true and both are easy to forget at a call site: the caller must be
 * an AGENCY recruiter (a client-company recruiter must never create clients or job orders),
 * and every row written or read has to be filtered by that recruiter's `orgId`. Returning the
 * orgId here — rather than letting each route look it up — is what makes "did we scope this
 * query?" answerable by reading one function instead of twelve.
 *
 * Returns a ready-to-send 401/403 rather than throwing, so routes stay flat.
 */
export async function requireAgency(): Promise<
  { ok: true; actor: AgencyActor } | { ok: false; response: NextResponse }
> {
  const auth = await getRecruiterFromSession();
  if (!auth) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not signed in" }, { status: 401 }),
    };
  }

  const [me] = await getDb()
    .select({ clientKind: recruiters.clientKind, orgId: recruiters.orgId })
    .from(recruiters)
    .where(eq(recruiters.id, auth.recruiterId))
    .limit(1);

  if (!me || me.clientKind !== "agency" || me.orgId == null) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "This action is only available to agency accounts." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    actor: {
      orgId: me.orgId,
      recruiterId: auth.recruiterId,
      userId: auth.session.userId,
    },
  };
}

/** Client IP for the audit trail, best-effort. */
export function clientIp(req: Request): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}
