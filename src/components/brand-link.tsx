"use client";

import { useRouter } from "next/navigation";
import { type MouseEvent } from "react";
import { BRAND_SPLASH_EVENT, type BrandSplashDetail } from "@/components/brand-splash";

export function BrandLink({ href = "/" }: { href?: string }) {
  const router = useRouter();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    window.dispatchEvent(
      new CustomEvent<BrandSplashDetail>(BRAND_SPLASH_EVENT, { detail: { href } })
    );
    router.push(href);
  }

  return (
    <a href={href} onClick={handleClick} className="flex items-center gap-2">
      <img src="/icon.svg" alt="Yang Luck 揚運國際" className="h-8 w-8 rounded-md" />
      <span className="flex items-baseline gap-1.5 text-primary">
        <span className="font-wordmark text-xl italic">Yang Luck</span>
        <span className="font-heading text-xl font-semibold">揚運</span>
      </span>
    </a>
  );
}
