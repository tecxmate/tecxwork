import type { ComponentType } from "react";
import {
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Home,
  KanbanSquare,
  SlidersHorizontal,
  User,
  Users,
} from "lucide-react";

import type { UserRole } from "@/lib/auth";

export type NavRole = UserRole | "guest";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  matches?: string[];
  exactMatch?: boolean;
};

export const navItemsByRole: Record<NavRole, NavItem[]> = {
  guest: [
    { href: "/", label: "Home", icon: Home, matches: ["/"] },
    {
      href: "/browse",
      label: "Companies",
      icon: Building2,
      matches: ["/browse", "/recruiter"],
    },
    { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness, matches: ["/jobs"] },
    {
      href: "/login",
      label: "Account",
      icon: User,
      matches: ["/login", "/register", "/forgot-password"],
    },
  ],
  applicant: [
    { href: "/", label: "Home", icon: Home, matches: ["/"] },
    {
      href: "/browse",
      label: "Companies",
      icon: Building2,
      matches: ["/browse", "/recruiter"],
    },
    { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness, matches: ["/jobs"] },
    { href: "/profile", label: "Profile", icon: User, matches: ["/profile"] },
  ],
  recruiter: [
    {
      href: "/dashboard/interviews",
      label: "Interviews",
      icon: BriefcaseBusiness,
      matches: ["/dashboard/interviews"],
    },
    {
      href: "/dashboard/applicants",
      label: "Applicants",
      icon: Users,
      matches: ["/dashboard/applicants"],
    },
    {
      href: "/dashboard/pipeline",
      label: "Pipeline",
      icon: KanbanSquare,
      matches: ["/dashboard/pipeline"],
    },
    {
      href: "/dashboard/jobs",
      label: "Jobs",
      icon: BriefcaseBusiness,
      matches: ["/dashboard/jobs"],
    },
    {
      href: "/dashboard/company",
      label: "My Company",
      icon: Building2,
      matches: ["/dashboard/company"],
    },
  ],
  admin: [
    {
      href: "/admin/recruiters",
      label: "Recruiters",
      icon: Building2,
      matches: ["/admin/recruiters"],
    },
    {
      href: "/admin/jobs",
      label: "Jobs",
      icon: BriefcaseBusiness,
      matches: ["/admin/jobs"],
    },
    {
      href: "/admin/applicants",
      label: "Applicants",
      icon: Users,
      matches: ["/admin/applicants"],
    },
    {
      href: "/admin/interviews",
      label: "Interviews",
      icon: CalendarClock,
      matches: ["/admin/interviews"],
    },
    {
      href: "/admin/settings",
      label: "Platform",
      icon: SlidersHorizontal,
      matches: ["/admin/settings"],
    },
  ],
};

export function isNavItemActive(pathname: string, search: string, item: NavItem) {
  const fullPath = search ? `${pathname}?${search}` : pathname;
  const patterns = item.matches ?? [item.href];

  return patterns.some((pattern) => {
    if (pattern === "/") {
      return pathname === "/";
    }

    if (pattern.includes("?")) {
      return fullPath === pattern;
    }

    if (item.exactMatch) {
      return pathname === pattern && search.length === 0;
    }

    return (
      (pathname === pattern && search.length === 0) ||
      pathname.startsWith(`${pattern}/`)
    );
  });
}
