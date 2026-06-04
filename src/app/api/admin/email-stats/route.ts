import { NextResponse } from "next/server";
import { db, emailLogs } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { count, gte, and, eq } from "drizzle-orm";

/**
 * GET /api/admin/email-stats
 * Returns email usage stats for the admin dashboard.
 */
export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Start of today (UTC)
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  // Start of this month (UTC)
  const monthStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);

  // Count emails sent today
  const [todayStats] = await db
    .select({ count: count() })
    .from(emailLogs)
    .where(
      and(
        gte(emailLogs.createdAt, todayStart),
        eq(emailLogs.success, true)
      )
    );

  // Count emails sent this month
  const [monthStats] = await db
    .select({ count: count() })
    .from(emailLogs)
    .where(
      and(
        gte(emailLogs.createdAt, monthStart),
        eq(emailLogs.success, true)
      )
    );

  // Count failed emails today
  const [failedToday] = await db
    .select({ count: count() })
    .from(emailLogs)
    .where(
      and(
        gte(emailLogs.createdAt, todayStart),
        eq(emailLogs.success, false)
      )
    );

  // Resend Pro ($20/mo) transactional tier:
  // 50,000 emails/month and no fixed daily sending quota.
  const MONTHLY_LIMIT = 50_000;

  return NextResponse.json({
    today: {
      sent: todayStats.count,
      failed: failedToday.count,
      hasDailyLimit: false,
      limit: null,
      remaining: null,
      percentUsed: 0,
    },
    month: {
      sent: monthStats.count,
      limit: MONTHLY_LIMIT,
      remaining: Math.max(0, MONTHLY_LIMIT - monthStats.count),
      percentUsed: Math.round((monthStats.count / MONTHLY_LIMIT) * 100),
    },
  });
}
