"use client";

import Link from "next/link";
import { useStudentI18n } from "@/components/student-locale-provider";

import {
  isNavItemActive,
  navItemsByRole,
  type NavRole,
} from "@/lib/navigation";

export function DesktopTopNav({
  role,
  currentPath,
}: {
  role: NavRole;
  currentPath?: string;
}) {
  const { messages } = useStudentI18n();
  const items = navItemsByRole[role];

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
    }
    return fallback;
  }

  return (
    <nav className="flex items-center justify-center gap-1">
      {items.map((item) => {
        const active = currentPath ? isNavItemActive(currentPath, "", item) : false;
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
            {getLabel(item.href, item.label)}
          </Link>
        );
      })}
    </nav>
  );
}
