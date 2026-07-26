import { getDb } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

/**
 * Append-only audit trail. Store field NAMES + non-PII metadata only — never
 * raw candidate PII values — so candidate erasure never has to mutate this
 * table. Never throws (auditing must not break the request it records).
 */
type AuditInput = {
  orgId?: number | null;
  actorUserId?: number | null;
  actorType?: string;
  action: string; // e.g. "move_stage" | "view" | "export"
  entityType: string; // e.g. "application" | "candidate" | "job"
  entityId?: number | null;
  fieldNames?: string[];
  metadata?: Record<string, unknown>;
  ip?: string | null;
};

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await getDb()
      .insert(auditLog)
      .values({
        orgId: input.orgId ?? null,
        actorUserId: input.actorUserId ?? null,
        actorType: input.actorType ?? "user",
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        fieldNames: input.fieldNames ?? null,
        metadata: input.metadata ?? null,
        ip: input.ip ?? null,
      });
  } catch (err) {
    console.error("logAudit failed (ignored):", err);
  }
}
