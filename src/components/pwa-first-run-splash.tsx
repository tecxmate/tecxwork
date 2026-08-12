"use client";

import { BRAND } from "@/lib/brand";

import { useEffect, useState } from "react";

const VISIBLE_MS = 1100;
const FADE_MS = 380;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function PwaFirstRunSplash() {
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!isStandalone()) return;
    const showT = window.setTimeout(() => setShow(true), 0);
    const closeT = window.setTimeout(() => setClosing(true), VISIBLE_MS);
    const removeT = window.setTimeout(() => {
      setShow(false);
    }, VISIBLE_MS + FADE_MS);
    return () => {
      window.clearTimeout(showT);
      window.clearTimeout(closeT);
      window.clearTimeout(removeT);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-white dark:bg-background"
      style={{
        opacity: closing ? 0 : 1,
        transition: `opacity ${FADE_MS}ms cubic-bezier(.4,0,.2,1)`,
        willChange: "opacity",
      }}
    >
      <style>{`
        @keyframes tw-first-run-pop {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .tw-first-run-pop { animation: tw-first-run-pop 220ms cubic-bezier(.4,1.4,.5,1) both; }
      `}</style>
      <img
        src={BRAND.logoSrc}
        alt={BRAND.alt}
        className="tw-first-run-pop h-28 w-28 rounded-3xl bg-white object-contain p-4 ring-1 ring-black/5"
      />
      <span className="flex items-baseline gap-2 text-primary">
        <span className="font-wordmark text-3xl italic">{BRAND.wordmark}</span>
        {BRAND.wordmarkCjk ? (
          <span className="font-heading text-3xl font-semibold">{BRAND.wordmarkCjk}</span>
        ) : null}
      </span>
    </div>
  );
}
