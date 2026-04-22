import Link from "next/link";
import { Briefcase } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

export function AppTopBar({
  href = "/",
  desktopActions,
}: {
  href?: string;
  desktopActions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b bg-white dark:bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href={href} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Briefcase className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-wordmark text-xl text-primary italic">tecxwork</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {desktopActions ? (
            <div className="hidden items-center gap-2 sm:gap-3 md:flex">
              {desktopActions}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
