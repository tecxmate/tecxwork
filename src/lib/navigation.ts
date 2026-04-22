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
      label: "Company",
      icon: Building2,
      matches: ["/browse", "/recruiter"],
    },
    { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness, matches: ["/jobs"] },
    { href: "/profile", label: "Profile", icon: User, matches: ["/profile"] },
  ],
  recruiter: [
    {
      href: "/dashboard?tab=bookings",
      label: "我的面談",
      icon: BriefcaseBusiness,
      matches: ["/dashboard?tab=bookings", "/dashboard"],
    },
    {
      href: "/dashboard?tab=applicants",
      label: "瀏覽候選人",
      icon: Users,
      matches: ["/dashboard?tab=applicants"],
    },
    {
      href: "/dashboard?tab=company",
      label: "我的公司",
      icon: Building2,
      matches: ["/dashboard?tab=company"],
    },
  ],
  admin: [
    { href: "/admin", label: "Admin", icon: Shield, matches: ["/admin"] },
    { href: "/browse", label: "People", icon: Users, matches: ["/browse", "/recruiter"] },
    { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness, matches: ["/jobs"] },
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
