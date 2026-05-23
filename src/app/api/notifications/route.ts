import { NextRequest, NextResponse } from "next/server";
import { db, notifications } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq, and, desc, inArray, count } from "drizzle-orm";

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

  const [unread] = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientEmail, session.email),
        eq(notifications.read, false)
      )
    );

  return NextResponse.json({
    notifications: result,
    unreadCount: unread?.value ?? 0,
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
    const ids = notificationIds.filter((v): v is number => typeof v === "number");
    if (ids.length > 0) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            inArray(notifications.id, ids),
            eq(notifications.recipientEmail, session.email)
          )
        );
    }
  }

  return NextResponse.json({ ok: true });
}
