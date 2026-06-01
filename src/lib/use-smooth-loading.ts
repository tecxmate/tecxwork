"use client";

import { useEffect, useRef, useState } from "react";

export function useSmoothLoading(
  active: boolean,
  {
    showDelayMs = 140,
    minVisibleMs = 520,
  }: {
    showDelayMs?: number;
    minVisibleMs?: number;
  } = {}
) {
  const [visible, setVisible] = useState(active);
  const shownAt = useRef(0);

  useEffect(() => {
    let timer: number | undefined;

    if (active) {
      if (visible && shownAt.current === 0) {
        shownAt.current = Date.now();
      }

      if (!visible) {
        timer = window.setTimeout(() => {
          shownAt.current = Date.now();
          setVisible(true);
        }, showDelayMs);
      }

      return () => {
        if (timer) window.clearTimeout(timer);
      };
    }

    if (!visible) return;

    const elapsed = Date.now() - shownAt.current;
    const remaining = Math.max(0, minVisibleMs - elapsed);
    timer = window.setTimeout(() => setVisible(false), remaining);

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [active, minVisibleMs, showDelayMs, visible]);

  return visible;
}
