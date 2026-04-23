"use client";

import { Button } from "@/components/ui/button";
import { useStudentI18n } from "@/components/student-locale-provider";
import type { StudentLocale } from "@/lib/student-messages";

export function StudentLanguageSwitcher() {
  const { locale, setLocale, messages } = useStudentI18n();

  function updateLocale(nextLocale: StudentLocale) {
    if (nextLocale !== locale) {
      setLocale(nextLocale);
    }
  }

  return (
    <div
      className="grid h-10 grid-cols-3 items-center gap-1 rounded-lg border border-border bg-background/80 p-1"
      aria-label={messages.language.switchLabel}
    >
      <Button
        type="button"
        variant="ghost"
        className={[
          "h-8 w-full justify-center px-2 text-xs",
          locale === "en" ? "bg-primary/10 text-primary hover:bg-primary/10" : "",
        ].join(" ")}
        onClick={() => updateLocale("en")}
      >
        {messages.language.english}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={[
          "h-8 w-full justify-center px-2 text-xs",
          locale === "vi" ? "bg-primary/10 text-primary hover:bg-primary/10" : "",
        ].join(" ")}
        onClick={() => updateLocale("vi")}
      >
        {messages.language.vietnamese}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={[
          "h-8 w-full justify-center px-2 text-xs",
          locale === "zh-TW" ? "bg-primary/10 text-primary hover:bg-primary/10" : "",
        ].join(" ")}
        onClick={() => updateLocale("zh-TW")}
      >
        {messages.language.chineseTraditional}
      </Button>
    </div>
  );
}
