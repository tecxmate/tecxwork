"use client";

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
        @keyframes tw-first-run-eye {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.08); }
        }
        .tw-first-run-pop { animation: tw-first-run-pop 220ms cubic-bezier(.4,1.4,.5,1) both; }
        .tw-first-run-eye {
          transform-box: fill-box;
          transform-origin: center;
          animation: tw-first-run-eye 260ms cubic-bezier(.5,1.6,.6,1) both;
        }
        .tw-first-run-eye-r { animation-delay: 50ms; }
      `}</style>
      <svg
        viewBox="0 0 512 512"
        className="tw-first-run-pop h-28 w-28 rounded-3xl"
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
          className="tw-first-run-eye"
          d="M216 286v48"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="24"
          strokeLinecap="round"
        />
        <path
          className="tw-first-run-eye tw-first-run-eye-r"
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
