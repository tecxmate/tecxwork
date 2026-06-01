"use client";

import { type KeyboardEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, Check, X, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { usePush } from "@/lib/use-push";

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    url?: string;
  };
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { pushEnabled, supported: pushSupported, enablePush } = usePush();

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

  async function openNotification(notification: Notification) {
    const url = notification.metadata?.url;
    if (!url || !url.startsWith("/")) return;
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    setOpen(false);
    router.push(url);
  }

  function handleNotificationKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    notification: Notification
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openNotification(notification);
    }
  }

  const button = (
    <button
      onClick={() => setOpen(!open)}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-lg border transition-premium",
        open
          ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      aria-label={
        unreadCount > 0
          ? `${labels.notifications} (${unreadCount} unread)`
          : labels.notifications
      }
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span
          className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-white dark:ring-card"
          aria-hidden="true"
        />
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

      {pushEnabled === false && pushSupported && (
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
                role={n.metadata?.url ? "button" : undefined}
                tabIndex={n.metadata?.url ? 0 : undefined}
                onClick={() => openNotification(n)}
                onKeyDown={(event) => handleNotificationKeyDown(event, n)}
                className={cn(
                  "flex gap-3 px-4 py-3 transition-colors",
                  n.metadata?.url && "cursor-pointer hover:bg-muted",
                  !n.read && "bg-primary/5"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", !n.read && "font-medium")}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground break-words">
                    {n.message}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      markAsRead(n.id);
                    }}
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

      {pushEnabled === false && pushSupported && (
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
                role={n.metadata?.url ? "button" : undefined}
                tabIndex={n.metadata?.url ? 0 : undefined}
                onClick={() => openNotification(n)}
                onKeyDown={(event) => handleNotificationKeyDown(event, n)}
                className={cn(
                  "flex gap-3 rounded-md px-3 py-2 transition-colors",
                  n.metadata?.url && "cursor-pointer",
                  n.read ? "bg-transparent hover:bg-muted" : "bg-primary/5"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", !n.read && "font-medium")}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground break-words">
                    {n.message}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      markAsRead(n.id);
                    }}
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

      {open ? (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      ) : null}
      <div
        data-open={open}
        aria-hidden={!open}
        className={cn(
          "dropdown-panel z-50 overflow-hidden rounded-xl border bg-card shadow-lg",
          // Mobile: span the screen with equal left/right margins, top edge
          // aligned with the hamburger dropdown (safe-area + 56px = 3.5rem).
          "fixed inset-x-3 top-[calc(env(safe-area-inset-top)+3.5rem)]",
          // Desktop: anchored dropdown under the bell.
          "sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96"
        )}
      >
        {panel}
      </div>
    </div>
  );
}
