import { NextRequest, NextResponse } from "next/server";
import { db, pushSubscriptions } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendPushToSubscription } from "@/lib/web-push";
import { and, eq } from "drizzle-orm";

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

  // Confirm to the device that just subscribed that push is working.
  sendPushToSubscription(
    { endpoint, p256dh: keys.p256dh, auth: keys.auth },
    {
      title: "🔔 Notifications enabled",
      message: "You'll get interview updates from TECXWORK right here.",
      url: "/",
    }
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
