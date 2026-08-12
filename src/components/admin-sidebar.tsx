"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { isNavItemActive, visibleNavItems } from "@/lib/navigation";

/**
 * Shared with the recruiter rail on purpose: an admin who is also a recruiter should not
 * find one workspace collapsed and the other expanded, and the two rails are the same
 * control doing the same job.
 */
const COLLAPSED_KEY = "tecxwork_sidebar_collapsed";
const COLLAPSED_EVENT = "tecxwork:sidebar";

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
 * Sections, following what the admin is actually doing rather than route order.
 *
 * Five destinations do not strictly need grouping, but the split is real: two screens are
 * gates that hold a queue waiting on a decision, two are registries you read, and one is
 * configuration. Anything a group does not claim still appears under "More", so adding a
 * nav item can never silently hide it — that group renders only when it catches something.
 */
const GROUPS: { title: string; hrefs: string[] }[] = [
  { title: "Moderation", hrefs: ["/admin/jobs", "/admin/recruiters"] },
  { title: "Registry", hrefs: ["/admin/interviews", "/admin/applicants"] },
  { title: "Configuration", hrefs: ["/admin/settings"] },
];

/**
 * The admin workspace navigation.
 *
 * Same rail as the employer workspace (`dashboard-sidebar.tsx`) — same collapse
 * behaviour, same active treatment, same collapsed-state affordances — so moving between
 * the two does not feel like moving between two products. Kept as its own component
 * rather than parameterising one: the two carry different groupings and the admin rail
 * takes no capability filtering, and a single component threading both would be harder to
 * read than two that each state their own case.
 *
 * Desktop only. The top bar and bottom nav still serve small screens, where a persistent
 * rail costs more width than it earns.
 */
export function AdminSidebar() {
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

  const items = visibleNavItems("admin", false);
  const grouped = GROUPS.map((group) => ({
    title: group.title,
    items: items.filter((item) => group.hrefs.includes(item.href)),
  })).filter((group) => group.items.length > 0);

  const ungrouped = items.filter(
    (item) => !GROUPS.some((group) => group.hrefs.includes(item.href))
  );
  if (ungrouped.length > 0) grouped.push({ title: "More", items: ungrouped });

  return (
    <aside
      aria-label="Admin navigation"
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
