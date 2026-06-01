import { NextResponse } from "next/server";
import { db, notifications } from "@/lib/db";
import { lt } from "drizzle-orm";

const RETENTION_DAYS = 90;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  try {
    const deleted = await db
      .delete(notifications)
      .where(lt(notifications.createdAt, cutoff))
      .returning({ id: notifications.id });

    console.log(
      `[Cron] Pruned ${deleted.length} notifications older than ${RETENTION_DAYS} days (before ${cutoff.toISOString()})`
    );

    return NextResponse.json({
      success: true,
      deleted: deleted.length,
      cutoff: cutoff.toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Notification prune failed:", error);
    return NextResponse.json(
      {
        error: "Prune failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;
