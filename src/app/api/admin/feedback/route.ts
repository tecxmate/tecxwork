import { NextResponse } from "next/server";
import { db, feedbackReports } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { desc } from "drizzle-orm";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(feedbackReports)
    .orderBy(desc(feedbackReports.createdAt))
    .limit(200);

  return NextResponse.json({ reports: rows });
}
