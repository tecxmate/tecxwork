"use client";

import { Button } from "@/components/ui/button";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import type { RecruiterLocale } from "@/lib/recruiter-messages";
import { cn } from "@/lib/utils";

export function RecruiterLanguageSwitcher({ className }: { className?: string } = {}) {
  const { locale, setLocale, messages } = useRecruiterI18n();

  function set(nextLocale: RecruiterLocale) {
    if (nextLocale !== locale) {
      setLocale(nextLocale);
    }
  }

  return (
    <div
      className={cn("grid h-9 w-full grid-cols-2 items-center gap-1 rounded-lg bg-muted p-0.5 shadow-inner", className)}
      aria-label={messages.language.switchLabel}
    >
      <Button
        type="button"
        variant="ghost"
        className={[
          "h-8 flex-1 basis-0 justify-center rounded-md px-2 text-xs",
          locale === "en" ? "bg-background shadow-sm text-primary hover:bg-background" : "hover:bg-background/50",
        ].join(" ")}
        onClick={() => set("en")}
      >
        EN
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={[
          "h-8 flex-1 basis-0 justify-center rounded-md px-2 text-xs",
          locale === "zh-TW"
            ? "bg-background shadow-sm text-primary hover:bg-background"
            : "hover:bg-background/50",
        ].join(" ")}
        onClick={() => set("zh-TW")}
      >
        中
      </Button>
    </div>
  );
}
