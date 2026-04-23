"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { isNavItemActive, navItemsByRole, type NavRole } from "@/lib/navigation";

export function MobileBottomNav({
  role,
}: {
  role: NavRole;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const items = navItemsByRole[role];
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const pendingResetRef = useRef<number | null>(null);
  const currentActiveHref =
    items.find((item) => isNavItemActive(pathname, search, item))?.href ?? null;
  const displayActiveHref = pendingHref ?? currentActiveHref;
  const shouldHide =
    pathname.startsWith("/api") ||
    pathname === "/terms-of-service" ||
    pathname === "/privacy-policy" ||
    pathname === "/tutorial";

  useEffect(() => {
    if (pendingResetRef.current) {
      window.clearTimeout(pendingResetRef.current);
      pendingResetRef.current = null;
    }
    setPendingHref(null);
  }, [pathname, search]);

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

  useEffect(() => {
    return () => {
      if (pendingResetRef.current) {
        window.clearTimeout(pendingResetRef.current);
      }
    };
  }, []);

  function markPending(href: string) {
    setPendingHref(href);
    if (pendingResetRef.current) {
      window.clearTimeout(pendingResetRef.current);
    }
    pendingResetRef.current = window.setTimeout(() => {
      setPendingHref(null);
      pendingResetRef.current = null;
    }, 900);
  }

  if (shouldHide) {
    return null;
  }

  return (
    <>
      <div className="h-[4.75rem] md:hidden" aria-hidden="true" />
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background md:hidden">
        <div
          className="mx-auto grid max-w-xl px-2 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-1"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((item) => {
            const active = displayActiveHref === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onTouchStart={() => {
                  router.prefetch(item.href);
                }}
                onMouseDown={() => {
                  router.prefetch(item.href);
                }}
                onClick={(event) => {
                  if (pathname === item.href && !search) {
                    return;
                  }
                  event.preventDefault();
                  markPending(item.href);
                  router.push(item.href);
                }}
                className={[
                  "group flex min-h-11.5 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[11px] font-medium transition-premium",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-7.5 w-7.5 items-center justify-center rounded-full transition-premium",
                    active ? "bg-primary/10" : "bg-transparent",
                  ].join(" ")}
                >
                  <Icon
                    className={[
                      "h-[18px] w-[18px] transition-premium",
                      active ? "text-primary" : "text-current",
                    ].join(" ")}
                  />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
