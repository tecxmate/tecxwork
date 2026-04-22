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
      <div className="h-20 md:hidden" aria-hidden="true" />
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/92 backdrop-blur-xl md:hidden">
        <div
          className="mx-auto grid max-w-xl px-2 pb-[calc(0.6rem+env(safe-area-inset-bottom))] pt-2"
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
                  "group flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[11px] font-medium transition-premium",
                  active
                    ? "bg-primary/10 text-primary shadow-[0_10px_30px_rgba(140,82,255,0.12)]"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "h-[18px] w-[18px] transition-premium",
                    active ? "scale-105" : "group-hover:scale-105",
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
