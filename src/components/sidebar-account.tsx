"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

/**
 * The account block at the foot of the workspace rail.
 *
 * Standard SaaS placement: who you are signed in as sits in the bottom-left corner, and
 * the settings that are not navigation — theme, language, sign out — hang off it rather
 * than off the top bar. Before this they lived in a hamburger menu in the header, which
 * put account controls and page navigation in the same overflow.
 *
 * The primary line is the **organisation**, not the role. "Recruiter" tells someone what
 * they can do, which they already know; the company name tells them which account they
 * are acting in, which matters when a person has more than one.
 */
export function SidebarAccount({
  name,
  role,
  collapsed,
  logoutLabel,
  children,
}: {
  /** Organisation name — the line that identifies the account. */
  name: string;
  /** Secondary line: the role in that organisation. */
  role: string;
  collapsed: boolean;
  logoutLabel: string;
  /** Extra controls for the menu, e.g. a language switcher. */
  children?: React.ReactNode;
}) {
  const router = useRouter();

  /**
   * Which rail width the menu was opened against, or null for closed.
   *
   * Collapsing the rail while the menu is open should close it — it is anchored to a
   * trigger that just changed size. Deriving that from the stored width, rather than
   * resetting state in an effect, keeps it a single render and satisfies the repo's
   * no-setState-in-effect rule.
   */
  const [openedWith, setOpenedWith] = useState<boolean | null>(null);
  const open = openedWith !== null && openedWith === collapsed;

  const setOpen = (next: boolean) => setOpenedWith(next ? collapsed : null);

  // Escape closes it. Outside clicks go through the backdrop below, which also stops the
  // click reaching whatever is underneath.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenedWith(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={collapsed ? `${name} — ${role}` : undefined}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
          open ? "bg-muted" : "hover:bg-muted",
          collapsed && "justify-center px-0"
        )}
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary"
        >
          {initial}
        </span>
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{role}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      ) : null}
      {open ? (
        // Opens upward: the trigger is the last thing in the rail, so there is no room
        // below it.
        <div
          role="menu"
          className="dropdown-panel absolute bottom-full left-0 z-50 mb-2 w-64 overflow-hidden rounded-xl border bg-card p-1.5 shadow-lg"
        >
          {/* Collapsed, the trigger shows only an initial — so the menu has to say who
              this is, or the sign-out button is unlabelled in context. */}
          <div className="px-2 py-2">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{role}</p>
          </div>
          <div className="my-1 h-px w-full bg-border" />

          <div className="flex items-center gap-2 px-2 py-1.5">
            <ThemeToggle />
            {children ? <div className="min-w-0 flex-1">{children}</div> : null}
          </div>

          <div className="my-1 h-px w-full bg-border" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {logoutLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
