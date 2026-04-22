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
      className="flex items-center gap-1 rounded-lg border border-border bg-background/80 p-1"
      aria-label={messages.language.switchLabel}
    >
      <Languages className="ml-1 size-4 text-muted-foreground" />
      <Button
        type="button"
        variant={locale === "en" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => set("en")}
      >
        {messages.language.english}
      </Button>
      <Button
        type="button"
        variant={locale === "zh-TW" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => set("zh-TW")}
      >
        {messages.language.traditionalChinese}
      </Button>
    </div>
  );
}
