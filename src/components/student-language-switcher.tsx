"use client";

import { Button } from "@/components/ui/button";
import { useStudentI18n } from "@/components/student-locale-provider";
import type { StudentLocale } from "@/lib/student-messages";

export function StudentLanguageSwitcher({
  orientation = "horizontal",
}: {
  orientation?: "horizontal" | "vertical";
}) {
  const { locale, setLocale, messages } = useStudentI18n();
  const vertical = orientation === "vertical";

  function updateLocale(nextLocale: StudentLocale) {
    if (nextLocale !== locale) {
      setLocale(nextLocale);
    }
  }

  return (
    <div
      className={
        vertical
          ? "flex w-full flex-col gap-1"
          : "flex h-9 w-full sm:w-auto items-center gap-1 rounded-lg bg-muted p-0.5 shadow-inner"
      }
      aria-label={messages.language.switchLabel}
    >
      <Button
        type="button"
        variant="ghost"
        className={[
          vertical
            ? "h-10 w-full justify-start rounded-xl px-3 text-sm"
            : "h-8 flex-1 sm:flex-none justify-center px-2 text-xs rounded-md",
          locale === "en" ? "bg-background shadow-sm text-primary hover:bg-background" : "hover:bg-background/50",
        ].join(" ")}
        onClick={() => updateLocale("en")}
      >
        {messages.language.english}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={[
          vertical
            ? "h-10 w-full justify-start rounded-xl px-3 text-sm"
            : "h-8 flex-1 sm:flex-none justify-center px-2 text-xs rounded-md",
          locale === "vi" ? "bg-background shadow-sm text-primary hover:bg-background" : "hover:bg-background/50",
        ].join(" ")}
        onClick={() => updateLocale("vi")}
      >
        {messages.language.vietnamese}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={[
          vertical
            ? "h-10 w-full justify-start rounded-xl px-3 text-sm"
            : "h-8 flex-1 sm:flex-none justify-center px-2 text-xs rounded-md",
          locale === "zh-TW" ? "bg-background shadow-sm text-primary hover:bg-background" : "hover:bg-background/50",
        ].join(" ")}
        onClick={() => updateLocale("zh-TW")}
      >
        {messages.language.chineseTraditional}
      </Button>
    </div>
  );
}
