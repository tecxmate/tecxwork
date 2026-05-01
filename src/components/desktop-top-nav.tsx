"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND_SPLASH_EVENT, type BrandSplashDetail } from "@/components/brand-splash";
import { useStudentI18n } from "@/components/student-locale-provider";

import {
  isNavItemActive,
  navItemsByRole,
  type NavRole,
} from "@/lib/navigation";

const SKELETON_TABS = new Set<string>(["/browse", "/jobs"]);

export function DesktopTopNav({
  role,
  currentPath,
}: {
  role: NavRole;
  currentPath?: string;
}) {
  const router = useRouter();
  const { messages } = useStudentI18n();
  const items = navItemsByRole[role];

  function getLabel(href: string, fallback: string) {
    if (role === "guest" || role === "applicant") {
      if (href === "/") return messages.nav.home;
      if (href === "/browse") return messages.nav.companies;
      if (href === "/jobs") return messages.nav.jobs;
      if (href === "/login") return messages.nav.account;
      if (href === "/profile") return messages.nav.profile;
    }
    if (role === "admin") {
      if (href === "/admin") return messages.nav.overview;
      if (href === "/admin/recruiters") return messages.nav.recruiters;
      if (href === "/admin/applicants") return messages.nav.applicants;
      if (href === "/admin/jobs") return messages.nav.jobs;
    }
    return fallback;
  }

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
    <nav className="flex items-center justify-center gap-1">
      {items.map((item) => {
        const active = currentPath ? isNavItemActive(currentPath, "", item) : false;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            onMouseEnter={() => router.prefetch(item.href)}
            onFocus={() => router.prefetch(item.href)}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
                return;
              }
              if (currentPath === item.href) return;
              if (SKELETON_TABS.has(item.href)) return;
              event.preventDefault();
              window.dispatchEvent(
                new CustomEvent<BrandSplashDetail>(BRAND_SPLASH_EVENT, {
                  detail: { href: item.href },
                })
              );
              router.push(item.href);
            }}
            className={[
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/8 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            ].join(" ")}
          >
            {getLabel(item.href, item.label)}
          </Link>
        );
      })}
    </nav>
  );
}
