"use client";

import { BRAND } from "@/lib/brand";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MIN_SPLASH_MS = 280;
const MAX_SPLASH_MS = 4000;
const FADE_OUT_MS = 420;

export const BRAND_SPLASH_EVENT = "tw:brand-splash";

export type BrandSplashVariant = "full" | "compact";

export type BrandSplashDetail = { href: string; variant?: BrandSplashVariant };

export function BrandSplash() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);
  const [variant, setVariant] = useState<BrandSplashVariant>("full");
  const targetHref = useRef<string | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    function onStart(e: Event) {
      const detail = (e as CustomEvent<BrandSplashDetail>).detail;
      targetHref.current = detail?.href ?? "/";
      startedAt.current = Date.now();
      setVariant(detail?.variant ?? "full");
      setClosing(false);
      setShow(true);
    }
    window.addEventListener(BRAND_SPLASH_EVENT, onStart);
    return () => window.removeEventListener(BRAND_SPLASH_EVENT, onStart);
  }, []);

  useEffect(() => {
    if (!show || closing) return;
    if (targetHref.current && pathname !== targetHref.current) return;
    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
    const t = window.setTimeout(() => setClosing(true), remaining);
    return () => window.clearTimeout(t);
  }, [show, closing, pathname]);

  useEffect(() => {
    if (!show || closing) return;
    const t = window.setTimeout(() => setClosing(true), MAX_SPLASH_MS);
    return () => window.clearTimeout(t);
  }, [show, closing]);

  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(() => {
      setShow(false);
      setClosing(false);
      targetHref.current = null;
    }, FADE_OUT_MS);
    return () => window.clearTimeout(t);
  }, [closing]);

  if (!show) return null;

  const isCompact = variant === "compact";

  return (
    <div
      aria-hidden
      className={
        isCompact
          ? "pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
          : "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-white dark:bg-background"
      }
      style={{
        animation: "tw-splash-fade 160ms ease-out",
        opacity: closing ? 0 : 1,
        transition: `opacity ${FADE_OUT_MS}ms cubic-bezier(.4,0,.2,1)`,
        willChange: "opacity",
      }}
    >
      <style>{`
        @keyframes tw-splash-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tw-pop {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .tw-pop { animation: tw-pop 180ms cubic-bezier(.4,1.4,.5,1) both; }
      `}</style>
      <img
        src={BRAND.logoSrc}
        alt={BRAND.alt}
        className={`tw-pop h-28 w-28 rounded-3xl object-contain ${
          BRAND.logoNeedsPlate ? "bg-white p-4 ring-1 ring-black/5" : ""
        }`}
        style={
          isCompact
            ? { boxShadow: "0 0 60px 30px rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.18)" }
            : undefined
        }
      />
      {isCompact ? null : (
        <span className="flex items-baseline gap-2 text-primary">
          <span className="font-wordmark text-3xl italic">{BRAND.wordmark}</span>
          {BRAND.wordmarkCjk ? (
            <span className="font-heading text-3xl font-semibold">{BRAND.wordmarkCjk}</span>
          ) : null}
        </span>
      )}
    </div>
  );
}
