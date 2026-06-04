import { useCallback, useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();

/**
 * Client hook for Web Push subscription. Shared by the notification bell and
 * the post-apply prompt so there's a single subscribe implementation.
 *
 * - `pushEnabled`: null while detecting, then boolean.
 * - `supported`: push is usable in this browser (has VAPID key + service worker).
 * - `enablePush()`: requests permission, subscribes, persists; resolves true on success.
 */
export function usePush() {
  const supported =
    Boolean(VAPID_PUBLIC_KEY) &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator;
  const [pushEnabled, setPushEnabled] = useState<boolean | null>(() =>
    supported ? null : false
  );

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => setPushEnabled(!!sub));
    });
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, [supported]);

  const enablePush = useCallback(async (): Promise<boolean> => {
    if (!VAPID_PUBLIC_KEY) return false;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      });

      await fetch("/api/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      setPushEnabled(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { pushEnabled, supported, enablePush };
}
