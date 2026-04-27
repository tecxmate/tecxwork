import { NextRequest, NextResponse } from "next/server";
import { db, notifications } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50);

  const conditions = [eq(notifications.recipientEmail, session.email)];
  if (unreadOnly) {
    conditions.push(eq(notifications.read, false));
  }

  const result = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  const unreadCount = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientEmail, session.email),
        eq(notifications.read, false)
      )
    );

  return NextResponse.json({
    notifications: result,
    unreadCount: unreadCount.length,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { notificationIds, markAllRead } = body;

  if (markAllRead) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.recipientEmail, session.email));

    return NextResponse.json({ ok: true });
  }

  if (Array.isArray(notificationIds) && notificationIds.length > 0) {
    for (const id of notificationIds) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.id, id),
            eq(notifications.recipientEmail, session.email)
          )
        );
    }
  }

  return NextResponse.json({ ok: true });
}
