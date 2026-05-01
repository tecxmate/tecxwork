"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";

const MIN_SPLASH_MS = 280;
const MAX_SPLASH_MS = 4000;
const FADE_OUT_MS = 420;

export function BrandLink({ href = "/" }: { href?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [splash, setSplash] = useState(false);
  const [closing, setClosing] = useState(false);
  const startedAt = useRef(0);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    startedAt.current = Date.now();
    setClosing(false);
    setSplash(true);
    router.push(href);
  }

  useEffect(() => {
    if (!splash || closing) return;
    if (pathname !== href) return;
    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
    const t = window.setTimeout(() => setClosing(true), remaining);
    return () => window.clearTimeout(t);
  }, [splash, closing, pathname, href]);

  useEffect(() => {
    if (!splash || closing) return;
    const t = window.setTimeout(() => setClosing(true), MAX_SPLASH_MS);
    return () => window.clearTimeout(t);
  }, [splash, closing]);

  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(() => {
      setSplash(false);
      setClosing(false);
    }, FADE_OUT_MS);
    return () => window.clearTimeout(t);
  }, [closing]);

  return (
    <>
      <a href={href} onClick={handleClick} className="flex items-center gap-2">
        <img src="/icon.svg" alt="TECXWORK" className="h-8 w-8 rounded-md" />
        <span className="font-wordmark text-xl text-primary italic">tecxwork</span>
      </a>
      {splash ? <SplashOverlay closing={closing} fadeOutMs={FADE_OUT_MS} /> : null}
    </>
  );
}

function SplashOverlay({ closing, fadeOutMs }: { closing: boolean; fadeOutMs: number }) {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-white dark:bg-background"
      style={{
        animation: "tw-splash-fade 160ms ease-out",
        opacity: closing ? 0 : 1,
        transition: `opacity ${fadeOutMs}ms cubic-bezier(.4,0,.2,1)`,
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
      <span className="font-wordmark text-3xl text-primary italic">tecxwork</span>
    </div>
  );
}
