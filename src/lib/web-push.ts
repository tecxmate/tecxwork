import webpush from "web-push";
import { db, pushSubscriptions } from "@/lib/db";
import { eq } from "drizzle-orm";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY?.trim();

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:support@tecxwork.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export async function sendPushNotification(
  userEmail: string,
  payload: { title: string; message: string; url?: string }
) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userEmail, userEmail));

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
    } catch (err: unknown) {
      if ((err as { statusCode?: number }).statusCode === 410) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, sub.endpoint));
      }
    }
  }
}

/**
 * Send a push to a single subscription (the device that just subscribed),
 * rather than fanning out to every device for the user.
 */
export async function sendPushToSubscription(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; message: string; url?: string }
) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
  } catch (err: unknown) {
    if ((err as { statusCode?: number }).statusCode === 410) {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, sub.endpoint));
    }
  }
}
