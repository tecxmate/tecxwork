import type { ComponentType } from "react";
import {
  BriefcaseBusiness,
  Building2,
  Home,
  Shield,
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
      matches: ["/dashboard", "/dashboard/interviews"],
    },
    {
      href: "/dashboard/applicants",
      label: "Applicants",
      icon: Users,
      matches: ["/dashboard/applicants"],
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
    { href: "/admin", label: "Overview", icon: Shield, matches: ["/admin"] },
    {
      href: "/admin/recruiters",
      label: "Recruiters",
      icon: Building2,
      matches: ["/admin/recruiters"],
    },
    {
      href: "/admin/applicants",
      label: "Applicants",
      icon: Users,
      matches: ["/admin/applicants"],
    },
    {
      href: "/admin/jobs",
      label: "Jobs",
      icon: BriefcaseBusiness,
      matches: ["/admin/jobs"],
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

    return (
      (pathname === pattern && search.length === 0) ||
      pathname.startsWith(`${pattern}/`)
    );
  });
}
