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
    });
    const completeTimer = window.setTimeout(() => {
      setIsNavigating(false);
    }, 520);

    return () => {
      window.cancelAnimationFrame(activateFrame);
      window.clearTimeout(completeTimer);
    };
  }, [routeKey]);

  return (
    <>
      <div
        aria-hidden="true"
        className={[
          "route-progress",
          isNavigating ? "route-progress-active" : "route-progress-idle",
        ].join(" ")}
      />
      <div
        key={`${routeKey}-${transitionKey}`}
        className="page-shell motion-safe:animate-page-enter"
      >
        {children}
      </div>
    </>
  );
}
