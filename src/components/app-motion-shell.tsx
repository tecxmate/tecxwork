"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function buildRouteKey(
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>
) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function AppMotionShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = useMemo(
    () => buildRouteKey(pathname, searchParams),
    [pathname, searchParams]
  );
  const isFirstRoute = useRef(true);
  const [transitionKey, setTransitionKey] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (isFirstRoute.current) {
      isFirstRoute.current = false;
      return;
    }

    const activateFrame = window.requestAnimationFrame(() => {
      setTransitionKey((value) => value + 1);
      setIsNavigating(true);
      document.documentElement.classList.add("route-loading");
    });
    const completeTimer = window.setTimeout(() => {
      setIsNavigating(false);
      document.documentElement.classList.remove("route-loading");
    }, 520);

    return () => {
      window.cancelAnimationFrame(activateFrame);
      window.clearTimeout(completeTimer);
      document.documentElement.classList.remove("route-loading");
    };
  }, [routeKey]);

  return (
    <>
      <div
        key={`${routeKey}-${transitionKey}`}
        className={[
          "page-shell motion-safe:animate-page-enter",
          isNavigating ? "route-transition-active" : "",
        ].join(" ")}
      >
        {children}
      </div>
    </>
  );
}
