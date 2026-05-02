"use client";

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
        @keyframes tw-eye-open {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.08); }
        }
        @keyframes tw-pop {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .tw-eye {
          transform-box: fill-box;
          transform-origin: center;
          animation: tw-eye-open 220ms cubic-bezier(.5,1.6,.6,1) both;
        }
        .tw-eye-r { animation-delay: 40ms; }
        .tw-pop { animation: tw-pop 180ms cubic-bezier(.4,1.4,.5,1) both; }
      `}</style>
      <svg
        viewBox="0 0 512 512"
        className="tw-pop h-28 w-28 rounded-3xl"
        xmlns="http://www.w3.org/2000/svg"
        style={
          isCompact
            ? { boxShadow: "0 0 60px 30px rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.18)" }
            : undefined
        }
      >
        <rect width="512" height="512" rx="104" fill="#8C52FF" />
        <rect
          x="132"
          y="190"
          width="248"
          height="192"
          rx="34"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="28"
          strokeLinejoin="round"
        />
        <path
          d="M198 190v-28c0-18 14-32 32-32h52c18 0 32 14 32 32v28"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M132 256h248"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="28"
          strokeLinecap="round"
        />
        <path
          className="tw-eye"
          d="M216 286v48"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="24"
          strokeLinecap="round"
        />
        <path
          className="tw-eye tw-eye-r"
          d="M296 286v48"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="24"
          strokeLinecap="round"
        />
      </svg>
      {isCompact ? null : (
        <span className="font-wordmark text-3xl text-primary italic">tecxwork</span>
      )}
    </div>
  );
}
