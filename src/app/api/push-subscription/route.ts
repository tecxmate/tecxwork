import { NextRequest, NextResponse } from "next/server";
import { db, pushSubscriptions, notifications } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendPushToSubscription } from "@/lib/web-push";
import { and, eq } from "drizzle-orm";

const WELCOME_TITLE = "🔔 Notifications enabled";
const WELCOME_MESSAGE = "You'll get interview updates from TECXWORK right here.";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await db
    .insert(pushSubscriptions)
    .values({
      userEmail: session.email,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userEmail: session.email,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

  // Add a one-time in-app welcome so it also shows in the notification bell
  // (deduped per user so re-enabling on another device doesn't stack copies).
  const [existingWelcome] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientEmail, session.email),
        eq(notifications.type, "system"),
        eq(notifications.title, WELCOME_TITLE)
      )
    )
    .limit(1);

  if (!existingWelcome) {
    await db.insert(notifications).values({
      recipientEmail: session.email,
      recipientRole: session.role,
      type: "system",
      title: WELCOME_TITLE,
      message: WELCOME_MESSAGE,
      metadata: { url: "/" },
    });
  }

  // Confirm on the device that just subscribed that push is working.
  sendPushToSubscription(
    { endpoint, p256dh: keys.p256dh, auth: keys.auth },
    { title: WELCOME_TITLE, message: WELCOME_MESSAGE, url: "/" }
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { endpoint } = body;

  if (endpoint) {
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.userEmail, session.email)
        )
      );
  }

  return NextResponse.json({ ok: true });
}
