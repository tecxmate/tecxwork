"use client";

import { useEffect, useState, useTransition } from "react";
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
  const [, startTransition] = useTransition();
  const currentActiveHref =
    items.find((item) => isNavItemActive(pathname, search, item))?.href ?? null;
  const displayActiveHref = pendingHref ?? currentActiveHref;
  const shouldHide =
    pathname.startsWith("/api") ||
    pathname === "/terms-of-service" ||
    pathname === "/privacy-policy" ||
    pathname === "/tutorial";

  useEffect(() => {
    setPendingHref(null);
  }, [pathname, search]);

  if (shouldHide) {
    return null;
  }

  return (
    <>
      <div className="h-[5.5rem] md:hidden" aria-hidden="true" />
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background md:hidden">
        <div
          className="mx-auto grid max-w-xl px-2 pb-[calc(0.9rem+env(safe-area-inset-bottom))] pt-1.5"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((item) => {
            const active = displayActiveHref === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();

                  if (displayActiveHref === item.href) {
                    return;
                  }

                  setPendingHref(item.href);
                  startTransition(() => {
                    router.push(item.href);
                  });
                }}
                className={[
                  "group flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-premium",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full transition-premium",
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
