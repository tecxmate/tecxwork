import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAgency, clientIp } from "@/lib/agency-auth";
import { logAudit } from "@/lib/audit";
import { createApiKey, listApiKeys } from "@/lib/api-keys";
import type { Capability } from "@/lib/permissions";
import { parseJsonBody } from "@/lib/validation";

/**
 * Workspace API keys.
 *
 * Minting is gated on `member:invite` — the same admin-only capability that controls seats.
 * A key is a way for something that is not a person to act inside the workspace, which is
 * an administrative decision of the same weight as adding a colleague, and deliberately not
 * one an ordinary recruiter makes for themselves.
 */

const createKeySchema = z.object({
  name: z.string().trim().min(1, "A key needs a name").max(100),
  scopes: z.array(z.string()).min(1, "A key needs at least one scope"),
  /** ISO date. Omit for a key that does not expire on its own. */
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function GET() {
  const gate = await requireAgency("member:invite");
  if (!gate.ok) return gate.response;

  // Summaries only — the token itself is unrecoverable by construction.
  return NextResponse.json({ keys: await listApiKeys(gate.actor.orgId) });
}

export async function POST(req: NextRequest) {
  const gate = await requireAgency("member:invite");
  if (!gate.ok) return gate.response;
  const { orgId, userId, role } = gate.actor;

  const parsed = await parseJsonBody(req, createKeySchema);
  if (!parsed.ok) return parsed.response;

  const result = await createApiKey({
    orgId,
    ownerUserId: userId,
    ownerRole: role,
    name: parsed.data.name,
    scopes: parsed.data.scopes as Capability[],
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await logAudit({
    orgId,
    actorUserId: userId,
    action: "create",
    entityType: "api_key",
    entityId: result.data.id,
    fieldNames: ["name", "scopes"],
    metadata: { scopes: parsed.data.scopes, prefix: result.data.prefix },
    ip: clientIp(req),
  });

  return NextResponse.json(
    {
      key: {
        id: result.data.id,
        prefix: result.data.prefix,
        // Shown once and never again — only its SHA-256 is stored. Losing it means
        // revoking and minting a new one, which is the property that makes a leaked
        // database dump useless.
        token: result.data.token,
      },
    },
    { status: 201 }
  );
}
