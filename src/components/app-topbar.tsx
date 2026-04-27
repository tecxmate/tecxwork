import Link from "next/link";

import { AppTopBarAccountActions } from "@/components/app-topbar-account-actions";
import { AppTopBarActions } from "@/components/app-topbar-actions";
import { DesktopTopNav } from "@/components/desktop-top-nav";
import { NotificationBell } from "@/components/notification-bell";
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
  const showNotifications = Boolean(navRole && navRole !== "guest");
  const isGuest = !navRole || navRole === "guest";
  const mobileOverflow = true;

  return (
    <header className="app-header sticky top-0 z-10 border-b bg-white dark:bg-card">
      <div className="h-[env(safe-area-inset-top)] bg-primary md:hidden" />
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="flex items-center md:justify-self-start">
            <Link href={href} className="flex items-center gap-2">
              <img src="/icon.svg" alt="TECXWORK" className="h-8 w-8 rounded-md" />
              <span className="font-wordmark text-xl text-primary italic">tecxwork</span>
            </Link>
          </div>
          {navItems.length > 0 ? (
            <div className="hidden md:flex md:justify-self-center">
              <DesktopTopNav role={navRole!} currentPath={currentPath} />
            </div>
          ) : null}
          <div className="ml-auto flex items-center gap-2 whitespace-nowrap sm:gap-3 md:ml-0 md:justify-self-end">
            {isGuest && desktopActions ? (
              <div className="flex items-center gap-2 whitespace-nowrap md:hidden">
                {desktopActions}
              </div>
            ) : null}
            <AppTopBarActions
              mobileOverflow={mobileOverflow}
              desktopChildren={
                <>
                  {desktopActions}
                  {showNotifications ? <NotificationBell /> : null}
                  <ThemeToggle />
                  {showStudentLanguageSwitcher ? <StudentLanguageSwitcher /> : null}
                </>
              }
              mobileChildren={
                <>
                  <div className="flex items-center gap-3 px-1 py-1">
                    <ThemeToggle />
                    {showStudentLanguageSwitcher ? (
                      <div className="flex-1">
                        <StudentLanguageSwitcher />
                      </div>
                    ) : showActionsOnMobile && mobileActions ? (
                      <div className="flex-1">
                        {mobileActions}
                      </div>
                    ) : null}
                  </div>
                  {showActionsOnMobile && !mobileActions ? (
                    <div className="px-1 py-1">
                      {desktopActions}
                    </div>
                  ) : null}
                  {!isGuest ? (
                    <AppTopBarAccountActions role={navRole} />
                  ) : null}
                  {showNotifications ? <NotificationBell variant="inline" /> : null}
                </>
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
}
