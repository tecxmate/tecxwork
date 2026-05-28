"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const PHOTO_DWELL_MS = 6000;

/**
 * Samples a downscaled copy of the image and returns the average relative
 * luminance (0–1) of the central band where the hero text sits. Returns null
 * if the pixels can't be read (e.g. CORS-tainted canvas).
 */
function getCenterLuminance(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = 32;
        const h = 32;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        // Sample the vertical center band (rows 8–24) — where the title sits.
        const { data } = ctx.getImageData(0, 8, w, 16);
        let sum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
          count += 1;
        }
        resolve(count ? sum / count : null);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function PageHero({
  images,
  title,
  subtitle,
}: {
  images: string[];
  title: string;
  subtitle?: string;
}) {
  const visibleImages = images.filter(Boolean).slice(0, 3);
  const [index, setIndex] = useState(0);
  const [lumas, setLumas] = useState<(number | null)[]>([]);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const imageKey = visibleImages.join("|");
  useEffect(() => {
    let cancelled = false;
    Promise.all(visibleImages.map(getCenterLuminance)).then((result) => {
      if (!cancelled) setLumas(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageKey]);

  useEffect(() => {
    if (visibleImages.length <= 1 || paused || reducedMotion) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % visibleImages.length);
    }, PHOTO_DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, reducedMotion, visibleImages.length]);

  // No images: keep the original plain header look.
  if (visibleImages.length === 0) {
    return (
      <section className="border-b bg-card px-4 py-6 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:mt-3 sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  const luma = lumas[index];
  // Bright photo → dark text; dark/unknown photo → light text (safe default).
  const darkText = luma != null && luma > 0.6;

  return (
    <section
      className="relative isolate flex min-h-[260px] items-center justify-center overflow-hidden border-b sm:min-h-[320px] lg:min-h-[380px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {visibleImages.map((url, i) => (
        <img
          key={`${url}-${i}`}
          src={url}
          alt=""
          aria-hidden
          loading={i === 0 ? "eager" : "lazy"}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out",
            i === index ? "opacity-100" : "opacity-0"
          )}
        />
      ))}

      {/* Semi-transparent scrim: lighten over bright photos, darken over dark ones. */}
      <div
        className={cn(
          "absolute inset-0 transition-colors duration-700",
          darkText
            ? "bg-gradient-to-b from-white/55 via-white/35 to-white/55"
            : "bg-gradient-to-b from-black/45 via-black/30 to-black/55"
        )}
      />

      <div
        className={cn(
          "relative z-10 mx-auto max-w-7xl px-4 text-center transition-colors duration-700 sm:px-6",
          darkText ? "text-neutral-900" : "text-white"
        )}
      >
        <h1
          className={cn(
            "font-heading text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl",
            darkText ? "" : "[text-shadow:0_1px_12px_rgba(0,0,0,0.35)]"
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className={cn(
              "mx-auto mt-3 max-w-2xl text-sm sm:text-base",
              darkText
                ? "text-neutral-700"
                : "text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]"
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {visibleImages.length > 1 ? (
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">
          {visibleImages.map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              aria-label={`Show image ${dotIndex + 1}`}
              aria-current={dotIndex === index}
              onClick={() => setIndex(dotIndex)}
              className={cn(
                "h-2 rounded-full transition-all",
                dotIndex === index
                  ? darkText
                    ? "w-6 bg-neutral-900/80"
                    : "w-6 bg-white shadow"
                  : darkText
                    ? "w-2 bg-neutral-900/40 hover:bg-neutral-900/70"
                    : "w-2 bg-white/60 hover:bg-white"
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
