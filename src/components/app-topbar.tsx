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
  mobileActions,
  showActionsOnMobile = false,
}: {
  href?: string;
  navRole?: NavRole;
  currentPath?: string;
  desktopActions?: React.ReactNode;
  mobileActions?: React.ReactNode;
  showActionsOnMobile?: boolean;
}) {
  const navItems = navRole ? navItemsByRole[navRole] : [];
  const showStudentLanguageSwitcher =
    navRole === "guest" || navRole === "applicant" || navRole === "admin";

  return (
    <header className="sticky top-0 z-10 border-b bg-white dark:bg-card">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="flex items-center md:justify-self-start">
          <Link href={href} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-wordmark text-xl text-primary italic">tecxwork</span>
          </Link>
          </div>
          {navItems.length > 0 ? (
            <div className="hidden md:justify-self-center">
              <DesktopTopNav role={navRole!} currentPath={currentPath} />
            </div>
          ) : (
            <div className="hidden md:block" />
          )}
          <div className="ml-auto flex items-center gap-2 whitespace-nowrap sm:gap-3 md:ml-0 md:justify-self-end">
          {showActionsOnMobile ? (
            <div className="flex items-center gap-2 whitespace-nowrap sm:gap-3 md:hidden">
              {mobileActions ?? desktopActions}
            </div>
          ) : null}
          {desktopActions ? (
            <div className="hidden items-center gap-2 whitespace-nowrap sm:gap-3 md:flex">
              {desktopActions}
            </div>
          ) : null}
          <ThemeToggle />
          {showStudentLanguageSwitcher ? <StudentLanguageSwitcher /> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
