import { NextRequest, NextResponse } from "next/server";
import { requireAgency } from "@/lib/agency-auth";
import { getAuditPage } from "@/lib/audit-log";

/**
 * The workspace's audit trail.
 *
 * Read-only by design: an audit that can be edited through the same API that writes it is
 * not evidence. `audit_log` has no update or delete path anywhere in the codebase, and this
 * route deliberately does not add one.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAgency("audit:read");
  if (!gate.ok) return gate.response;

  const params = new URL(req.url).searchParams;
  const num = (key: string): number | undefined => {
    const value = Number(params.get(key));
    return Number.isInteger(value) && value > 0 ? value : undefined;
  };
  const date = (key: string): Date | undefined => {
    const raw = params.get(key);
    if (!raw) return undefined;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const result = await getAuditPage(gate.actor.orgId, {
    action: params.get("action") ?? undefined,
    entityType: params.get("entityType") ?? undefined,
    actorUserId: num("actorUserId"),
    from: date("from"),
    to: date("to"),
    page: num("page"),
  });

  return NextResponse.json(result);
}
