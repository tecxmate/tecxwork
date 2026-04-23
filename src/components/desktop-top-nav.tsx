"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  isNavItemActive,
  navItemsByRole,
  type NavRole,
} from "@/lib/navigation";

export function DesktopTopNav({
  role,
  currentPath,
}: {
  role: NavRole;
  currentPath?: string;
}) {
  const router = useRouter();
  const items = navItemsByRole[role];

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const win = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const prefetchRoleTabs = () => {
      for (const item of items) {
        router.prefetch(item.href);
      }
    };

    if (typeof win.requestIdleCallback === "function") {
      idleId = win.requestIdleCallback(prefetchRoleTabs, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(prefetchRoleTabs, 350);
    }

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (idleId !== null && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
      }
    };
  }, [items, router]);

  return (
    <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex">
      {items.map((item) => {
        const active = currentPath ? isNavItemActive(currentPath, "", item) : false;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            onMouseEnter={() => router.prefetch(item.href)}
            onFocus={() => router.prefetch(item.href)}
            className={[
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/8 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
