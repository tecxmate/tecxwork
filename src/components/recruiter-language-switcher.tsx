"use client";

import { Button } from "@/components/ui/button";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import type { RecruiterLocale } from "@/lib/recruiter-messages";
import { cn } from "@/lib/utils";

const LOCALE_OPTIONS: { locale: RecruiterLocale; label: string }[] = [
  { locale: "en", label: "EN" },
  { locale: "zh-TW", label: "中" },
  { locale: "vi", label: "VI" },
];

export function RecruiterLanguageSwitcher({ className }: { className?: string } = {}) {
  const { locale, setLocale, messages } = useRecruiterI18n();

  function set(nextLocale: RecruiterLocale) {
    if (nextLocale !== locale) {
      setLocale(nextLocale);
    }
  }

  return (
    <div
      className={cn("grid h-9 w-full grid-cols-3 items-center gap-1 rounded-lg bg-muted p-0.5 shadow-inner", className)}
      aria-label={messages.language.switchLabel}
    >
      {LOCALE_OPTIONS.map((option) => (
        <Button
          key={option.locale}
          type="button"
          variant="ghost"
          className={[
            "h-8 flex-1 basis-0 justify-center rounded-md px-2 text-xs",
            locale === option.locale
              ? "bg-background shadow-sm text-primary hover:bg-background"
              : "hover:bg-background/50",
          ].join(" ")}
          onClick={() => set(option.locale)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
