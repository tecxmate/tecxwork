"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellRing, Check, X, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type NotificationBellLabels = {
  notifications: string;
  recent: string;
  markAllRead: string;
  enablePush: string;
  empty: string;
  markAsRead: string;
};

const DEFAULT_LABELS: NotificationBellLabels = {
  notifications: "Notifications",
  recent: "Recent",
  markAllRead: "Mark all read",
  enablePush: "Enable push notifications",
  empty: "No notifications yet",
  markAsRead: "Mark as read",
};

export function NotificationBell({
  variant = "popover",
  labels: labelsProp,
}: {
  variant?: "popover" | "inline";
  labels?: NotificationBellLabels;
}) {
  const labels = labelsProp ?? DEFAULT_LABELS;
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState<boolean | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY || !("serviceWorker" in navigator)) {
      setPushEnabled(false);
      return;
    }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setPushEnabled(!!sub);
      });
    });
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  async function enablePush() {
    if (!VAPID_PUBLIC_KEY) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

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
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: number) {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationIds: [id] }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  const button = (
    <button
      onClick={() => setOpen(!open)}
      className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      aria-label={labels.notifications}
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );

  const panel = (
    <>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">{labels.notifications}</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={loading}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              {labels.markAllRead}
            </button>
          )}
          {variant === "popover" ? (
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {pushEnabled === false && VAPID_PUBLIC_KEY && (
        <button
          onClick={enablePush}
          className="flex w-full items-center gap-2 border-b bg-primary/5 px-4 py-2 text-xs text-primary hover:bg-primary/10"
        >
          <BellRing className="h-4 w-4" />
          {labels.enablePush}
        </button>
      )}

      <div className={variant === "inline" ? "max-h-56 overflow-y-auto" : "max-h-80 overflow-y-auto"}>
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {labels.empty}
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3 px-4 py-3 transition-colors",
                  !n.read && "bg-primary/5"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", !n.read && "font-medium")}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {n.message}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="shrink-0 self-start rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title={labels.markAsRead}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const inlinePanel = (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-2 py-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{labels.recent}</span>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={loading}
            className="text-xs text-primary hover:underline disabled:opacity-50"
          >
            {labels.markAllRead}
          </button>
        )}
      </div>

      {pushEnabled === false && VAPID_PUBLIC_KEY && (
        <button
          onClick={enablePush}
          className="mx-2 mb-2 flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-xs text-primary hover:bg-primary/10"
        >
          <BellRing className="h-3.5 w-3.5" />
          {labels.enablePush}
        </button>
      )}

      <div className="max-h-64 overflow-y-auto px-1">
        {notifications.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {labels.empty}
          </div>
        ) : (
          <div className="flex flex-col gap-1 pb-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3 rounded-md px-3 py-2 transition-colors",
                  n.read ? "bg-transparent hover:bg-muted" : "bg-primary/5"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", !n.read && "font-medium")}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {n.message}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="shrink-0 self-start rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title={labels.markAsRead}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (variant === "inline") {
    return (
      <div className="flex w-full flex-col">
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-muted"
          aria-label={labels.notifications}
        >
          <div className="flex items-center gap-3 text-muted-foreground">
            <Bell className="h-4 w-4" />
            <span className="text-sm font-medium text-foreground">{labels.notifications}</span>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
          </div>
        </button>
        {open ? (
          <div className="mt-1 animate-fade-in-scale">
            {inlinePanel}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative">
      {button}

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-[280px] overflow-hidden rounded-xl border bg-card shadow-lg sm:w-80">
            {panel}
          </div>
        </>
      )}
    </div>
  );
}
