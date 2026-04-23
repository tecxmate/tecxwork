import Link from "next/link";
import { Briefcase } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  isNavItemActive,
  navItemsByRole,
  type NavRole,
} from "@/lib/navigation";

export function AppTopBar({
  href = "/",
  navRole,
  currentPath,
  desktopActions,
}: {
  href?: string;
  navRole?: NavRole;
  currentPath?: string;
  desktopActions?: React.ReactNode;
}) {
  const navItems = navRole ? navItemsByRole[navRole] : [];

  return (
    <header className="sticky top-0 z-10 border-b bg-white dark:bg-card">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center">
          <Link href={href} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-wordmark text-xl text-primary italic">tecxwork</span>
          </Link>
        </div>
        {navItems.length > 0 ? (
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = currentPath
                ? isNavItemActive(currentPath, "", item)
                : false;
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
        ) : (
          <div className="hidden flex-1 md:block" />
        )}
        <div className="ml-auto flex items-center gap-2 whitespace-nowrap sm:gap-3">
          <ThemeToggle />
          {desktopActions ? (
            <div className="hidden items-center gap-2 whitespace-nowrap sm:gap-3 md:flex">
              {desktopActions}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
