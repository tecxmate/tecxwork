"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { isNavItemActive, visibleNavItems } from "@/lib/navigation";
import type { Capability } from "@/lib/permissions";

const COLLAPSED_KEY = "tecxwork_sidebar_collapsed";
const COLLAPSED_EVENT = "tecxwork:sidebar";

/**
 * The collapse preference lives in localStorage, which is external state React does not
 * own — so it is read through useSyncExternalStore rather than copied into state by an
 * effect. That avoids the cascading render an effect-then-setState causes, and subscribing
 * to `storage` keeps two tabs in step for free.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(COLLAPSED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COLLAPSED_EVENT, onChange);
  };
}

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    // Private browsing: fall back to expanded.
    return false;
  }
}

/** The server cannot know the preference, so it renders expanded. */
const serverCollapsed = () => false;

/**
 * Sections, so a dozen destinations read as a workspace rather than a list.
 *
 * The grouping follows the work: who you are hiring, the commercial relationship, and the
 * agency's own setup. Items not named here fall into "Workspace" rather than disappearing,
 * so adding a nav item can never silently hide it.
 */
const GROUPS: { title: string; hrefs: string[] }[] = [
  {
    title: "Hiring",
    hrefs: [
      "/dashboard/interviews",
      "/dashboard/applicants",
      "/dashboard/candidates",
      "/dashboard/pipeline",
      "/dashboard/offers",
    ],
  },
  {
    title: "Clients",
    hrefs: [
      "/dashboard/clients",
      "/dashboard/placements",
      "/dashboard/compliance",
      "/dashboard/billing",
    ],
  },
  { title: "Company", hrefs: ["/dashboard/reports", "/dashboard/jobs", "/dashboard/company"] },
];

/**
 * The employer workspace navigation.
 *
 * A left rail rather than a top bar: this is an application people work inside for hours,
 * the destination list has grown past what a horizontal bar holds comfortably, and a rail
 * gives each item a stable position that does not reflow as labels change length.
 *
 * Desktop only — the top bar and bottom nav still serve small screens, where a persistent
 * rail would cost more width than it earns.
 */
export function DashboardSidebar({
  isAgency,
  capabilities,
}: {
  isAgency: boolean;
  capabilities?: readonly Capability[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, serverCollapsed);

  function toggle() {
    try {
      window.localStorage.setItem(COLLAPSED_KEY, collapsed ? "0" : "1");
    } catch {
      // Preference simply does not persist.
    }
    // useSyncExternalStore only re-reads when told, and `storage` does not fire in the
    // tab that wrote the value.
    window.dispatchEvent(new Event(COLLAPSED_EVENT));
  }

  const items = visibleNavItems("recruiter", isAgency, capabilities);
  const grouped = GROUPS.map((group) => ({
    title: group.title,
    items: items.filter((item) => group.hrefs.includes(item.href)),
  })).filter((group) => group.items.length > 0);

  // Anything a group does not claim still appears, so a new nav item cannot vanish.
  const ungrouped = items.filter(
    (item) => !GROUPS.some((group) => group.hrefs.includes(item.href))
  );
  if (ungrouped.length > 0) grouped.push({ title: "Workspace", items: ungrouped });

  return (
    <aside
      aria-label="Workspace navigation"
      data-collapsed={collapsed ? "true" : "false"}
      className={`sticky top-0 hidden h-[100dvh] shrink-0 flex-col border-r border-border bg-background/60 transition-[width] duration-200 lg:flex ${
        collapsed ? "w-[4.25rem]" : "w-56"
      }`}
    >

      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        className="mx-2 mt-3 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4 shrink-0" />
        ) : (
          <>
            <PanelLeftClose className="h-4 w-4 shrink-0" />
            <span>Collapse</span>
          </>
        )}
      </button>

      <div className="flex-1 overflow-y-auto px-2 pb-4 pt-2">
        {grouped.map((group) => (
          <div key={group.title} className="mb-4">
            {!collapsed ? (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </p>
            ) : (
              // A rule instead of a heading keeps the grouping legible when collapsed.
              <div className="mx-3 mb-2 border-t border-border" aria-hidden="true" />
            )}

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isNavItemActive(pathname, search, item);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      // The label is the accessible name when collapsed; title gives
                      // sighted users the same information on hover.
                      aria-label={collapsed ? item.label : undefined}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      } ${collapsed ? "justify-center px-0" : ""}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

    </aside>
  );
}
