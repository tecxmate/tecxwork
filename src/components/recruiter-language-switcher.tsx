"use client";

import { Button } from "@/components/ui/button";
import { useRecruiterI18n } from "@/components/recruiter-locale-provider";
import type { RecruiterLocale } from "@/lib/recruiter-messages";

export function RecruiterLanguageSwitcher() {
  const { locale, setLocale, messages } = useRecruiterI18n();

  function set(nextLocale: RecruiterLocale) {
    if (nextLocale !== locale) {
      setLocale(nextLocale);
    }
  }

  return (
    <div
      className="grid h-11 grid-cols-2 items-center gap-1 rounded-lg border border-border bg-background/80 p-1"
      aria-label={messages.language.switchLabel}
    >
      <Button
        type="button"
        variant="ghost"
        className={[
          "h-9 w-full justify-center px-3",
          locale === "en" ? "bg-primary/10 text-primary hover:bg-primary/10" : "",
        ].join(" ")}
        onClick={() => set("en")}
      >
        EN
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={[
          "h-9 w-full justify-center px-3",
          locale === "zh-TW"
            ? "bg-primary/10 text-primary hover:bg-primary/10"
            : "",
        ].join(" ")}
        onClick={() => set("zh-TW")}
      >
        中
      </Button>
    </div>
  );
}
