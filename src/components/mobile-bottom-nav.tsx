"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStudentI18n } from "@/components/student-locale-provider";

import { isNavItemActive, visibleNavItems, type NavRole } from "@/lib/navigation";
import type { Capability } from "@/lib/permissions";

function getStandaloneDisplayMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function MobileBottomNav({
  role,
  isAgency = false,
  capabilities,
}: {
  role: NavRole;
  isAgency?: boolean;
  capabilities?: readonly Capability[];
}) {
  const router = useRouter();
  const { messages } = useStudentI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const items = visibleNavItems(role, isAgency, capabilities);
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
      if (href === "/admin/settings") return messages.nav.platform;
    }
    return fallback;
  }
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const pendingResetRef = useRef<number | null>(null);
  const currentActiveHref =
    items.find((item) => isNavItemActive(pathname, search, item))?.href ?? null;
  const displayActiveHref = pendingHref ?? currentActiveHref;

  const itemRefs = useRef(new Map<string, HTMLAnchorElement | null>());
  const containerRef = useRef<HTMLDivElement | null>(null);
  /** Whether the pill has already been scrolled once — see the scroll-into-view effect. */
  const didScrollRef = useRef(false);
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);
  const [animateIndicator, setAnimateIndicator] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAndroid] = useState(
    () => typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent),
  );
  const [isStandalone] = useState(getStandaloneDisplayMode);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container || !displayActiveHref) return;
    const el = itemRefs.current.get(displayActiveHref);
    if (!el) return;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    // The pill scrolls, and the indicator is absolutely positioned inside it — so it is
    // placed in content coordinates and scrolls along with the tabs. Without adding
    // scrollLeft it would sit under whichever tab happens to be in that viewport slot.
    setIndicator({ x: eRect.left - cRect.left + container.scrollLeft, w: eRect.width });
  }, [displayActiveHref]);
  const shouldHide =
    pathname.startsWith("/api") ||
    pathname === "/terms-of-service" ||
    pathname === "/privacy-policy" ||
    pathname === "/tutorial";

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

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

  // `mounted` gates the whole render, so the first pass has no container and no item refs
  // to measure. Without it in the deps this never runs again and the active pill never
  // appears on a cold load — it only showed up after a client-side navigation changed
  // `measure`'s identity.
  useLayoutEffect(() => {
    measure();
  }, [measure, items.length, mounted]);

  /**
   * Keep the current tab on screen.
   *
   * With twelve destinations the active one is often outside the pill's viewport — an
   * agency opening Billing would see a row scrolled to Interviews with no sign of where
   * they are.
   *
   * `mounted` is a dependency, not decoration: the component renders null until it flips,
   * so on the first pass there is no container to scroll and the effect would otherwise
   * never run again.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !displayActiveHref) return;
    const el = itemRefs.current.get(displayActiveHref);
    if (!el) return;

    const target =
      el.offsetLeft - container.clientWidth / 2 + el.offsetWidth / 2;
    const max = container.scrollWidth - container.clientWidth;
    const left = Math.max(0, Math.min(target, max));
    if (Math.abs(left - container.scrollLeft) < 1) return;

    // First run jumps, later ones glide: on load the row should already be in the right
    // place rather than visibly sliding there.
    container.scrollTo({
      left,
      behavior: didScrollRef.current ? "smooth" : "auto",
    });
    didScrollRef.current = true;
  }, [displayActiveHref, items.length, mounted]);

  useEffect(() => {
    if (indicator && !animateIndicator) {
      const id = window.requestAnimationFrame(() => setAnimateIndicator(true));
      return () => window.cancelAnimationFrame(id);
    }
  }, [indicator, animateIndicator]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    for (const el of itemRefs.current.values()) {
      if (el) ro.observe(el);
    }
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, [measure, mounted]);

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

  if (!mounted || shouldHide) {
    return null;
  }

  return (
    <nav
      className="mobile-bottom-nav pointer-events-none fixed inset-x-0 z-50 flex justify-center px-3 md:hidden"
      style={{
        bottom: isAndroid && !isStandalone
          ? "calc(100dvh - 100svh + max(0.5rem, env(safe-area-inset-bottom)))"
          : "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {/*
        A scrolling row rather than a grid of equal columns. The grid divided the pill by
        item count, so an agency's twelve destinations got about 30px each and the labels
        were dropped wholesale. Items now take the width their label needs and the row
        scrolls; `grow` with `shrink-0` means four items still spread across the pill while
        twelve overflow it.

        Scrolling starts at the left rather than centring the row: `justify-center` on an
        overflowing flex container puts the first items past the scroll origin, where they
        cannot be reached.
      */}
      <div
        ref={containerRef}
        className="pointer-events-auto scrollbar-hide relative flex w-full max-w-xl gap-0 overflow-x-auto overscroll-x-contain rounded-full border border-border/40 bg-background/75 px-1.5 py-1 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.22),0_4px_12px_-4px_rgba(0,0,0,0.10)] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/65 dark:border-white/10 dark:bg-zinc-800/85 dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.55),0_4px_12px_-4px_rgba(0,0,0,0.30)] supports-[backdrop-filter]:dark:bg-zinc-800/70"
      >
        {indicator && (
          <span
            aria-hidden
            className={[
              "pointer-events-none absolute top-1 bottom-1 rounded-full bg-primary/10",
              animateIndicator
                ? "transition-[transform,width] duration-300 ease-out"
                : "",
            ].join(" ")}
            style={{
              transform: `translateX(${indicator.x}px)`,
              width: indicator.w,
              left: 0,
            }}
          />
        )}
        {items.map((item) => {
          const active = displayActiveHref === item.href;
          const Icon = item.icon;
          const label = getLabel(item.href, item.label);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={label}
              prefetch={false}
              ref={(el) => {
                itemRefs.current.set(item.href, el);
              }}
              onTouchStart={
                process.env.NODE_ENV === "production"
                  ? () => {
                      router.prefetch(item.href);
                    }
                  : undefined
              }
              onMouseDown={
                process.env.NODE_ENV === "production"
                  ? () => {
                      router.prefetch(item.href);
                    }
                  : undefined
              }
              onClick={(event) => {
                if (currentActiveHref === item.href && !pendingHref) {
                  event.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  return;
                }
                event.preventDefault();
                markPending(item.href);
                router.push(item.href);
              }}
              className={[
                // grow + shrink-0: fill the pill when there are few items, keep the label
                // legible and overflow into a scroll when there are many.
                "relative z-10 flex min-h-11 shrink-0 grow flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <Icon
                className={[
                  "h-[18px] w-[18px] transition-colors",
                  active ? "text-primary" : "text-current",
                ].join(" ")}
              />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
