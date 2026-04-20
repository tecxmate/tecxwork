"use client";

import { useState, useEffect } from "react";
import { X, Share, MoreVertical, Plus } from "lucide-react";

const DISMISSED_KEY = "vgen_install_dismissed";

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    // Only show on mobile, only if not dismissed, only if not already in standalone
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone);

    if (isStandalone) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    if (!isIOS && !isAndroid) return;

    // Show after a short delay so it doesn't compete with page load
    const timer = setTimeout(() => {
      setPlatform(isIOS ? "ios" : "android");
      setShow(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  if (!show || !platform) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-md px-4 pb-6">
        <div className="relative overflow-hidden rounded-2xl border bg-card shadow-lg">
          <button
            onClick={dismiss}
            className="absolute right-3 top-3 cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="px-4 pb-4 pt-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                V
              </div>
              <div>
                <p className="text-sm font-semibold">Add TECXWORK to Home Screen</p>
                <p className="text-xs text-muted-foreground">
                  Quick access to interviews & CV QR
                </p>
              </div>
            </div>

            {platform === "ios" ? (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">How to install:</p>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    1
                  </span>
                  <p>
                    Tap the <Share className="inline h-3.5 w-3.5 text-primary" /> <span className="font-medium text-foreground">Share</span> button at the bottom of Safari
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    2
                  </span>
                  <p>
                    Scroll down and tap <Plus className="inline h-3.5 w-3.5 text-primary" /> <span className="font-medium text-foreground">Add to Home Screen</span>
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    3
                  </span>
                  <p>
                    Tap <span className="font-medium text-foreground">Add</span> in the top right
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">How to install:</p>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    1
                  </span>
                  <p>
                    Tap the <MoreVertical className="inline h-3.5 w-3.5 text-primary" /> <span className="font-medium text-foreground">menu</span> in the top right of Chrome
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    2
                  </span>
                  <p>
                    Tap <span className="font-medium text-foreground">Add to Home screen</span> or <span className="font-medium text-foreground">Install app</span>
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    3
                  </span>
                  <p>
                    Tap <span className="font-medium text-foreground">Install</span> to confirm
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={dismiss}
              className="mt-3 w-full cursor-pointer text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
