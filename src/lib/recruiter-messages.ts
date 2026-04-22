import { recruiterEnMessages } from "@/messages/recruiter/en";
import { recruiterZhTwMessages } from "@/messages/recruiter/zh-TW";

export const RECRUITER_LOCALE_COOKIE = "recruiter_locale";

export type RecruiterLocale = "en" | "zh-TW";

type DeepStringify<T> = T extends string
  ? string
  : {
      [K in keyof T]: DeepStringify<T[K]>;
    };

export type RecruiterMessages = DeepStringify<typeof recruiterEnMessages>;

export const recruiterMessages: Record<RecruiterLocale, RecruiterMessages> = {
  en: recruiterEnMessages,
  "zh-TW": recruiterZhTwMessages,
};

export function normalizeRecruiterLocale(
  locale: string | null | undefined
): RecruiterLocale {
  const value = locale?.toLowerCase() || "";
  if (value.startsWith("zh")) {
    return "zh-TW";
  }
  return "en";
}

export function getRecruiterMessages(locale: RecruiterLocale): RecruiterMessages {
  return recruiterMessages[locale];
}
