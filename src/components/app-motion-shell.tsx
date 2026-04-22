"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function AppMotionShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFirstRoute = useRef(true);

  useEffect(() => {
    if (isFirstRoute.current) {
      isFirstRoute.current = false;
      return;
    }

    document.documentElement.classList.add("route-loading");
    const completeTimer = window.setTimeout(() => {
      document.documentElement.classList.remove("route-loading");
    }, 260);

    return () => {
      window.clearTimeout(completeTimer);
      document.documentElement.classList.remove("route-loading");
    };
  }, [pathname]);

  return <div className="page-shell">{children}</div>;
}
