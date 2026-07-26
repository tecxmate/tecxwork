"use client";

import dynamic from "next/dynamic";

import type { NavRole } from "@/lib/navigation";

const MobileBottomNavNoSsr = dynamic(
  () => import("@/components/mobile-bottom-nav").then((mod) => mod.MobileBottomNav),
  { ssr: false }
);

export function MobileBottomNavClient({
  role,
  isAgency = false,
}: {
  role: NavRole;
  isAgency?: boolean;
}) {
  return <MobileBottomNavNoSsr role={role} isAgency={isAgency} />;
}
