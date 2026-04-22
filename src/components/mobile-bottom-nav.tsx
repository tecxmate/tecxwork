"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { isNavItemActive, navItemsByRole, type NavRole } from "@/lib/navigation";

export function MobileBottomNav({
  role,
}: {
  role: NavRole;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const items = navItemsByRole[role];
  const shouldHide =
    pathname.startsWith("/api") ||
    pathname === "/terms-of-service" ||
    pathname === "/privacy-policy" ||
    pathname === "/tutorial";

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
            const active = isNavItemActive(pathname, search, item);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-1.5 text-[11px] font-medium transition-premium",
                  active
                    ? "border-primary/28 bg-primary/[0.11] text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/55 hover:text-foreground",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-[18px] w-[18px] transition-premium",
                    active ? "text-primary" : "text-current",
                  ].join(" ")}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
