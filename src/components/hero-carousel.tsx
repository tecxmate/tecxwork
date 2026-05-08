"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const HERO_DWELL_MS = 8000;
const PHOTO_DWELL_MS = 5000;

export function HeroCarousel({
  images,
  children,
}: {
  images: string[];
  children: ReactNode;
}) {
  const hasOverlay = Boolean(children);
  const slideCount = (hasOverlay ? 1 : 0) + images.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const touchingRef = useRef(false);
  const userScrollUntilRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (slideCount <= 1 || paused || reducedMotion) return;
    const dwell = index === 0 ? HERO_DWELL_MS : PHOTO_DWELL_MS;
    const t = window.setTimeout(() => {
      setIndex((i) => (i + 1) % slideCount);
    }, dwell);
    return () => window.clearTimeout(t);
  }, [index, slideCount, paused, reducedMotion]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (touchingRef.current || Date.now() < userScrollUntilRef.current) return;
    const target = track.children[index] as HTMLElement | undefined;
    if (!target) return;
    track.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
  }, [index]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    let settleTimer = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = track.clientWidth;
        if (!w) return;
        const i = Math.round(track.scrollLeft / w);
        setIndex((prev) => (prev === i ? prev : i));
      });
    };
    const onTouchStart = () => {
      touchingRef.current = true;
      setPaused(true);
      window.clearTimeout(settleTimer);
    };
    const onTouchEnd = () => {
      touchingRef.current = false;
      userScrollUntilRef.current = Date.now() + 600;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => setPaused(false), 1200);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("touchstart", onTouchStart, { passive: true });
    track.addEventListener("touchend", onTouchEnd, { passive: true });
    track.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("touchstart", onTouchStart);
      track.removeEventListener("touchend", onTouchEnd);
      track.removeEventListener("touchcancel", onTouchEnd);
      cancelAnimationFrame(raf);
      window.clearTimeout(settleTimer);
    };
  }, []);

  if (slideCount === 0) {
    return null;
  }
  if (slideCount === 1 && hasOverlay) {
    return <>{children}</>;
  }

  return (
    <section
      className="relative border-b bg-gradient-to-b from-primary/5 to-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="hero-carousel-track flex w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth [overscroll-behavior-x:contain] [-webkit-overflow-scrolling:touch]"
        aria-roledescription="carousel"
      >
        {hasOverlay && (
          <div className="snap-start shrink-0 basis-full" aria-roledescription="slide">
            {children}
          </div>
        )}
        {images.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="relative snap-start shrink-0 basis-full bg-background"
            aria-roledescription="slide"
          >
            <img
              src={url}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-contain"
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-2">
        {Array.from({ length: slideCount }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={hasOverlay && i === 0 ? "Show event details" : `Show photo ${hasOverlay ? i : i + 1}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`pointer-events-auto h-2 rounded-full transition-all ${
              i === index
                ? "w-6 bg-primary"
                : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70"
            }`}
          />
        ))}
      </div>

      <style>{`
        .hero-carousel-track { scrollbar-width: none; -ms-overflow-style: none; }
        .hero-carousel-track::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
