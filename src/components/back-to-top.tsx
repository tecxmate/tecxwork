"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "backToTopPosition";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<"left" | "right">(() => {
    if (typeof window === "undefined") return "right";

    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "left" || saved === "right" ? saved : "right";
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop() {
    if (isDragging) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePointerDown(e: React.PointerEvent) {
    setDragStart({ x: e.clientX, y: e.clientY });
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!dragStart) return;

    const dx = e.clientX - dragStart.x;
    const threshold = 50;

    if (Math.abs(dx) > threshold) {
      const newPosition = dx > 0 ? "right" : "left";
      setPosition(newPosition);
      localStorage.setItem(STORAGE_KEY, newPosition);
      setIsDragging(true);
      setTimeout(() => setIsDragging(false), 100);
    }

    setDragStart(null);
  }

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={cn(
        "fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 flex h-12 w-12 cursor-pointer touch-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-95 md:bottom-6",
        position === "right" ? "right-4" : "left-4"
      )}
      aria-label="Back to top"
    >
      <ChevronUp className="h-6 w-6" />
    </button>
  );
}
