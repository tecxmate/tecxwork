"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle({
  variant = "icon",
}: {
  variant?: "icon" | "menu";
}) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div
        className={
          variant === "menu"
            ? "h-10 w-full"
            : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted p-0.5 shadow-inner"
        }
      />
    );
  }

  const isDark = theme === "dark";

  if (variant === "menu") {
    return (
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span>{isDark ? "Light mode" : "Dark mode"}</span>
      </button>
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted p-0.5 shadow-inner">
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="flex h-full w-full items-center justify-center rounded-md bg-background text-primary shadow-sm transition-all hover:bg-background/90"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </div>
  );
}
