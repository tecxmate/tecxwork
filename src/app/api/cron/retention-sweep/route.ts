import { NextResponse } from "next/server";
import { and, eq, isNull, lt } from "drizzle-orm";
import { db, applicantProfiles } from "@/lib/db";
import { logAudit } from "@/lib/audit";

/**
 * Retention enforcement — the "staged tooling" half of PII governance.
 * Anonymizes candidates whose retention_until has passed (storage-limitation
 * principle). CRON_SECRET-gated. `?dryRun=true` reports what WOULD be swept
 * without erasing. retention_until is 'YYYY-MM-DD' text; lexicographic compare
 * equals chronological for ISO dates.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "true";
  const today = new Date().toISOString().slice(0, 10);

  try {
    const due = await db
      .select({ id: applicantProfiles.id })
      .from(applicantProfiles)
      .where(
        and(
          lt(applicantProfiles.retentionUntil, today),
          isNull(applicantProfiles.anonymizedAt)
        )
      );

    if (dryRun) {
      return NextResponse.json({ success: true, dryRun: true, due: due.length, today });
    }

    let anonymized = 0;
    for (const c of due) {
      await db
        .update(applicantProfiles)
        .set({
          name: "已刪除 Erased",
          email: `erased-${c.id}@redacted.invalid`,
          phone: "",
          cvLink: "",
          linkedinUrl: "",
          portfolioUrl: "",
          avatarUrl: "",
          description: "",
          skills: [],
          anonymizedAt: new Date(),
        })
        .where(eq(applicantProfiles.id, c.id));
      await logAudit({
        actorUserId: null,
        actorType: "system",
        action: "erasure",
        entityType: "candidate",
        entityId: c.id,
        metadata: { reason: "retention_expired" },
      });
      anonymized++;
    }

    console.log(`[Cron] Retention sweep anonymized ${anonymized} candidate(s) (retention < ${today})`);
    return NextResponse.json({ success: true, anonymized, today });
  } catch (error) {
    console.error("[Cron] Retention sweep failed:", error);
    return NextResponse.json(
      { error: "Sweep failed", message: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;
