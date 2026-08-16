import { and, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { auditLog, users } from "@/lib/db/schema";

/**
 * Reading the audit trail.
 *
 * `audit_log` has been written on every mutation since the ATS tenancy migration and, until
 * now, read by nothing. A trail nobody can open is not a control — it is storage. For a
 * product whose moat is a compliance clock, being able to answer "who moved this candidate,
 * and when" is part of what is being sold.
 *
 * The table deliberately stores field NAMES and metadata, never candidate PII, so nothing
 * here can leak a candidate's details even to a caller who should not see them. The one
 * join is to `users`, for the actor's name — an audit that identifies people by integer is
 * an audit nobody reads twice.
 *
 * Actor-free, like the rest of `lib/`: takes the org it reads, holds no session.
 */

export type AuditEvent = {
  id: number;
  createdAt: Date;
  /** Null for system and job actors, which have no user behind them. */
  actorName: string | null;
  actorType: string;
  action: string;
  entityType: string;
  entityId: number | null;
  fieldNames: string[] | null;
  ip: string | null;
};

export type AuditFilters = {
  action?: string;
  entityType?: string;
  actorUserId?: number;
  /** Inclusive lower bound. */
  from?: Date;
  /** Inclusive upper bound. */
  to?: Date;
  page?: number;
};

export type AuditPage = {
  events: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
  /** Distinct values present for this org, so the filter UI offers only what exists. */
  actions: string[];
  entityTypes: string[];
};

export const AUDIT_PAGE_SIZE = 50;

export async function getAuditPage(
  orgId: number,
  filters: AuditFilters = {}
): Promise<AuditPage> {
  const db = getDb();
  const page = Math.max(1, filters.page ?? 1);

  // orgId is first and non-negotiable: it is the tenant boundary, and every other
  // predicate only narrows within it.
  const conditions: SQL[] = [eq(auditLog.orgId, orgId)];
  if (filters.action) conditions.push(eq(auditLog.action, filters.action));
  if (filters.entityType) conditions.push(eq(auditLog.entityType, filters.entityType));
  if (filters.actorUserId) conditions.push(eq(auditLog.actorUserId, filters.actorUserId));
  if (filters.from) conditions.push(gte(auditLog.createdAt, filters.from));
  if (filters.to) conditions.push(lte(auditLog.createdAt, filters.to));
  const where = and(...conditions);

  const [rows, totals, actionRows, entityRows] = await Promise.all([
    db
      .select({
        id: auditLog.id,
        createdAt: auditLog.createdAt,
        actorName: users.name,
        actorType: auditLog.actorType,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        fieldNames: auditLog.fieldNames,
        ip: auditLog.ip,
      })
      .from(auditLog)
      // Left, not inner: a system or job actor has no user row, and those entries are
      // exactly the ones an inspection cares about most.
      .leftJoin(users, eq(users.id, auditLog.actorUserId))
      .where(where)
      .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
      .limit(AUDIT_PAGE_SIZE)
      .offset((page - 1) * AUDIT_PAGE_SIZE),

    db.select({ n: count() }).from(auditLog).where(where),

    // The filter options come from the org's own history rather than a hardcoded list, so
    // a new action type appears in the dropdown the first time it is recorded.
    db
      .selectDistinct({ action: auditLog.action })
      .from(auditLog)
      .where(eq(auditLog.orgId, orgId))
      .orderBy(auditLog.action),

    db
      .selectDistinct({ entityType: auditLog.entityType })
      .from(auditLog)
      .where(eq(auditLog.orgId, orgId))
      .orderBy(auditLog.entityType),
  ]);

  return {
    events: rows,
    total: totals[0]?.n ?? 0,
    page,
    pageSize: AUDIT_PAGE_SIZE,
    actions: actionRows.map((r) => r.action),
    entityTypes: entityRows.map((r) => r.entityType),
  };
}
