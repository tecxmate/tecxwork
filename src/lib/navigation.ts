import type { ComponentType } from "react";
import {
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  FileSignature,
  Building2,
  CalendarClock,
  Handshake,
  Home,
  KanbanSquare,
  Receipt,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Users,
} from "lucide-react";

import type { UserRole } from "@/lib/auth";
import type { Capability } from "@/lib/permissions";

export type NavRole = UserRole | "guest";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  matches?: string[];
  exactMatch?: boolean;
  // Only shown to agency-kind recruiters (Yang Luck HQ), hidden for a normal
  // client-company recruiter.
  agencyOnly?: boolean;
  // The capability the destination page requires. Without it the page redirects, so
  // showing the link would just be an invitation to be bounced.
  capability?: Capability;
};

/**
 * Nav items visible to a given role: agency-only tabs drop away for a client-company
 * recruiter, and capability-gated tabs drop away for org roles that lack the capability.
 *
 * Passing `capabilities` as undefined means "do not filter on capability" — for signed-out
 * visitors and applicants, who have no org role at all.
 */
export function visibleNavItems(
  role: NavRole,
  isAgency: boolean,
  capabilities?: readonly Capability[]
): NavItem[] {
  const items = navItemsByRole[role] ?? [];
  return items.filter((item) => {
    if (item.agencyOnly && !isAgency) return false;
    if (item.capability && capabilities && !capabilities.includes(item.capability))
      return false;
    return true;
  });
}

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
      href: "/dashboard/candidates",
      label: "Candidates",
      icon: Search,
      matches: ["/dashboard/candidates"],
      capability: "candidate:read",
    },
    {
      href: "/dashboard/pipeline",
      label: "Pipeline",
      icon: KanbanSquare,
      matches: ["/dashboard/pipeline"],
    },
    {
      href: "/dashboard/offers",
      label: "Offers",
      icon: FileSignature,
      matches: ["/dashboard/offers"],
      agencyOnly: true,
      capability: "offer:write",
    },
    {
      href: "/dashboard/clients",
      label: "Clients",
      icon: Handshake,
      matches: ["/dashboard/clients"],
      capability: "client:read",
      agencyOnly: true,
    },
    {
      href: "/dashboard/placements",
      label: "Placements",
      icon: BadgeCheck,
      matches: ["/dashboard/placements"],
      capability: "placement:read",
      agencyOnly: true,
    },
    {
      href: "/dashboard/compliance",
      label: "Compliance",
      icon: ShieldCheck,
      matches: ["/dashboard/compliance"],
      capability: "compliance:read",
      agencyOnly: true,
    },
    {
      href: "/dashboard/billing",
      label: "Billing",
      icon: Receipt,
      matches: ["/dashboard/billing"],
      agencyOnly: true,
      capability: "invoice:read",
    },
    {
      href: "/dashboard/reports",
      label: "Reports",
      icon: BarChart3,
      matches: ["/dashboard/reports"],
      agencyOnly: true,
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
