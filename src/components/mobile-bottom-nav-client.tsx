"use client";

import dynamic from "next/dynamic";

import type { NavRole } from "@/lib/navigation";
import type { Capability } from "@/lib/permissions";

const MobileBottomNavNoSsr = dynamic(
  () => import("@/components/mobile-bottom-nav").then((mod) => mod.MobileBottomNav),
  { ssr: false }
);

export function MobileBottomNavClient({
  role,
  isAgency = false,
  capabilities,
}: {
  role: NavRole;
  isAgency?: boolean;
  capabilities?: readonly Capability[];
}) {
  return (
    <MobileBottomNavNoSsr role={role} isAgency={isAgency} capabilities={capabilities} />
  );
}
