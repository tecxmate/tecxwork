import Link from "next/link";
import { Settings } from "lucide-react";

import {
  AppTopBarAccountActions,
  type AppTopBarAccountLabels,
} from "@/components/app-topbar-account-actions";
import { AppTopBarActions } from "@/components/app-topbar-actions";
import { BrandLink } from "@/components/brand-link";
import { DesktopTopNav } from "@/components/desktop-top-nav";
import {
  NotificationBell,
  type NotificationBellLabels,
} from "@/components/notification-bell";
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
  accountLabels,
  notificationLabels,
}: {
  href?: string;
  navRole?: NavRole;
  currentPath?: string;
  desktopActions?: React.ReactNode;
  mobileActions?: React.ReactNode;
  showActionsOnMobile?: boolean;
  accountLabels?: AppTopBarAccountLabels;
  notificationLabels?: NotificationBellLabels;
}) {
  const navItems = navRole ? navItemsByRole[navRole] : [];
  const showStudentLanguageSwitcher =
    navRole === "guest" || navRole === "applicant" || navRole === "admin";
  const showNotifications = Boolean(navRole && navRole !== "guest");
  const isGuest = !navRole || navRole === "guest";
  const mobileOverflow = true;
  const brandHref =
    navRole === "admin" ? "/" : navItems[0]?.href ?? href;

  return (
    <header className="app-header sticky top-0 z-10 border-b bg-white dark:bg-card">
      <div className="h-[env(safe-area-inset-top)] bg-primary md:hidden" />
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="flex items-center md:justify-self-start">
            <BrandLink href={brandHref} />
          </div>
          {navItems.length > 0 ? (
            <div className="hidden md:flex md:justify-self-center">
              <DesktopTopNav role={navRole!} currentPath={currentPath} />
            </div>
          ) : null}
          <div className="ml-auto flex items-center gap-2 whitespace-nowrap sm:gap-3 md:ml-0 md:justify-self-end">
            {isGuest && desktopActions ? (
              <div className="flex items-center gap-2 whitespace-nowrap">
                {desktopActions}
              </div>
            ) : null}
            <AppTopBarActions
              mobileOverflow={mobileOverflow}
              desktopChildren={
                <>
                  {!isGuest ? desktopActions : null}
                  {navRole === "admin" ? (
                    <Link
                      href="/admin/settings"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Admin settings"
                      title="Admin settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                  ) : null}
                  {showNotifications ? <NotificationBell labels={notificationLabels} /> : null}
                  <ThemeToggle />
                  {showStudentLanguageSwitcher ? <StudentLanguageSwitcher className="sm:w-48" /> : null}
                </>
              }
              mobileChildren={
                <>
                  <div className="flex items-center gap-3 px-2 py-2">
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
                  {showActionsOnMobile && !mobileActions && desktopActions && !isGuest ? (
                    <div className="px-2 py-2">
                      {desktopActions}
                    </div>
                  ) : null}
                  {!isGuest ? (
                    <AppTopBarAccountActions role={navRole} labels={accountLabels} />
                  ) : null}
                  {showNotifications ? (
                    <NotificationBell variant="inline" labels={notificationLabels} />
                  ) : null}
                </>
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
}
