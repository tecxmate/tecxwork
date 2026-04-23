import Link from "next/link";
import { Briefcase } from "lucide-react";

import { DesktopTopNav } from "@/components/desktop-top-nav";
import { StudentLanguageSwitcher } from "@/components/student-language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { navItemsByRole, type NavRole } from "@/lib/navigation";

export function AppTopBar({
  href = "/",
  navRole,
  currentPath,
  desktopActions,
  showActionsOnMobile = false,
}: {
  href?: string;
  navRole?: NavRole;
  currentPath?: string;
  desktopActions?: React.ReactNode;
  showActionsOnMobile?: boolean;
}) {
  const navItems = navRole ? navItemsByRole[navRole] : [];
  const showStudentLanguageSwitcher =
    navRole === "guest" || navRole === "applicant" || navRole === "admin";

  return (
    <header className="sticky top-0 z-10 border-b bg-white dark:bg-card">
      <div className="relative mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center">
          <Link href={href} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-wordmark text-xl text-primary italic">tecxwork</span>
          </Link>
        </div>
        {navItems.length > 0 ? (
          <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden -translate-x-1/2 items-center md:flex">
            <div className="pointer-events-auto">
              <DesktopTopNav role={navRole!} currentPath={currentPath} />
            </div>
          </div>
        ) : null}
        <div className="ml-auto flex items-center gap-2 whitespace-nowrap sm:gap-3">
          {desktopActions ? (
            <div
              className={[
                "items-center gap-2 whitespace-nowrap sm:gap-3",
                showActionsOnMobile ? "flex" : "hidden md:flex",
              ].join(" ")}
            >
              {desktopActions}
            </div>
          ) : null}
          <ThemeToggle />
          {showStudentLanguageSwitcher ? <StudentLanguageSwitcher /> : null}
        </div>
      </div>
    </header>
  );
}
