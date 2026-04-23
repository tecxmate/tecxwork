"use client";

import { Languages } from "lucide-react";

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
      className="grid h-11 grid-cols-[auto_1fr_1fr] items-center gap-1 rounded-lg border border-border bg-background/80 p-1"
      aria-label={messages.language.switchLabel}
    >
      <div className="flex h-full items-center justify-center px-2 text-muted-foreground">
        <Languages className="size-4" />
      </div>
      <Button
        type="button"
        variant={locale === "en" ? "secondary" : "ghost"}
        className="h-9 w-full justify-center px-3"
        onClick={() => set("en")}
      >
        {messages.language.english}
      </Button>
      <Button
        type="button"
        variant={locale === "zh-TW" ? "secondary" : "ghost"}
        className="h-9 w-full justify-center px-3"
        onClick={() => set("zh-TW")}
      >
        {messages.language.traditionalChinese}
      </Button>
    </div>
  );
}
