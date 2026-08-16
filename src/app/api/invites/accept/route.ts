import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clientIp } from "@/lib/agency-auth";
import { acceptInvite } from "@/lib/provisioning";
import { rateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/validation";
import { acceptInviteSchema } from "@/lib/validation-provisioning";

/**
 * Redeem an invitation token — the only path in the product that creates a membership.
 *
 * Requires a signed-in session rather than accepting an email in the body: the token proves
 * the link was received, and the session proves who is holding it. `acceptInvite` refuses
 * unless the two agree, which is what stops a forwarded invitation from seating a stranger.
 *
 * Rate limited because the token is a bearer secret arriving over an unauthenticated-ish
 * path; 32 random bytes are not guessable, but an unthrottled endpoint invites the attempt.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Sign in with the invited email address to accept this invitation." },
      { status: 401 }
    );
  }

  const ip = clientIp(req) ?? "unknown";
  const limited = await rateLimit(ip, "auth", "invite-accept");
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429 }
    );
  }

  const parsed = await parseJsonBody(req, acceptInviteSchema);
  if (!parsed.ok) return parsed.response;

  const result = await acceptInvite(parsed.data.token, session.userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await logAudit({
    orgId: result.data.orgId,
    actorUserId: session.userId,
    action: "accept_invite",
    entityType: "membership",
    metadata: { role: result.data.role },
    ip: clientIp(req),
  });

  return NextResponse.json({ orgId: result.data.orgId, role: result.data.role });
}
