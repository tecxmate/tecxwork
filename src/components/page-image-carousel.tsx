"use client";

import { useEffect, useRef, useState } from "react";

const PHOTO_DWELL_MS = 5000;

export function PageImageCarousel({ images }: { images: string[] }) {
  const visibleImages = images.filter(Boolean).slice(0, 2);
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
    if (visibleImages.length <= 1 || paused || reducedMotion) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % visibleImages.length);
    }, PHOTO_DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, reducedMotion, visibleImages.length]);

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
        const width = track.clientWidth;
        if (!width) return;
        const nextIndex = Math.round(track.scrollLeft / width);
        setIndex((current) => (current === nextIndex ? current : nextIndex));
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

  if (visibleImages.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden border-b bg-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="page-image-carousel-track flex w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth [overscroll-behavior-x:contain] [-webkit-overflow-scrolling:touch]"
        aria-roledescription="carousel"
      >
        {visibleImages.map((url, imageIndex) => (
          <div
            key={`${url}-${imageIndex}`}
            className="relative aspect-[16/7] max-h-64 min-h-36 shrink-0 basis-full snap-start bg-background sm:aspect-[21/7]"
            aria-roledescription="slide"
          >
            <img
              src={url}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
              loading={imageIndex === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {visibleImages.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-2">
          {visibleImages.map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              aria-label={`Show image ${dotIndex + 1}`}
              aria-current={dotIndex === index}
              onClick={() => setIndex(dotIndex)}
              className={`pointer-events-auto h-2 rounded-full transition-all ${
                dotIndex === index
                  ? "w-6 bg-white shadow"
                  : "w-2 bg-white/60 hover:bg-white"
              }`}
            />
          ))}
        </div>
      ) : null}

      <style>{`
        .page-image-carousel-track { scrollbar-width: none; -ms-overflow-style: none; }
        .page-image-carousel-track::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
