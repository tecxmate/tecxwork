"use client";

import { useRouter } from "next/navigation";
import { type MouseEvent } from "react";
import { BRAND_SPLASH_EVENT, type BrandSplashDetail } from "@/components/brand-splash";
import { BrandMark } from "@/components/brand-mark";

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
      <BrandMark />
    </a>
  );
}
