"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function RouteLoadingSignal() {
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
    }, 240);

    return () => {
      window.clearTimeout(completeTimer);
      document.documentElement.classList.remove("route-loading");
    };
  }, [pathname]);

  return null;
}
