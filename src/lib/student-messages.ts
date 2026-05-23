import { studentEnMessages } from "@/messages/student/en";
import { studentViMessages } from "@/messages/student/vi";
import { studentZhTwMessages } from "@/messages/student/zh-TW";

export const STUDENT_LOCALE_COOKIE = "student_locale";

export type StudentLocale = "en" | "vi" | "zh-TW";

type DeepStringify<T> = T extends string
  ? string
  : {
      [K in keyof T]: DeepStringify<T[K]>;
    };

export type StudentMessages = DeepStringify<typeof studentEnMessages>;

export const studentMessages: Record<StudentLocale, StudentMessages> = {
  en: studentEnMessages,
  vi: studentViMessages,
  "zh-TW": studentZhTwMessages,
};

function preferredLanguageTags(
  locale: string | readonly string[] | null | undefined
): string[] {
  if (!locale) return [];
  const values = typeof locale === "string" ? locale.split(",") : [...locale];

  return values
    .map((value) => {
      const [tag, ...params] = value.trim().split(";");
      const qualityParam = params.find((param) => param.trim().startsWith("q="));
      const quality = qualityParam
        ? Number.parseFloat(qualityParam.trim().slice(2))
        : 1;

      return {
        tag: tag.trim().toLowerCase(),
        quality: Number.isFinite(quality) ? quality : 1,
      };
    })
    .filter(({ tag, quality }) => tag && quality > 0)
    .sort((a, b) => b.quality - a.quality)
    .map(({ tag }) => tag);
}

function localeFromLanguageTag(tag: string): StudentLocale | null {
  if (tag.startsWith("zh")) {
    return "zh-TW";
  }
  if (tag.startsWith("vi")) {
    return "vi";
  }
  if (tag.startsWith("en")) {
    return "en";
  }
  return null;
}

export function detectPreferredStudentLocale(
  locale: string | readonly string[] | null | undefined
): StudentLocale {
  for (const tag of preferredLanguageTags(locale)) {
    const matchedLocale = localeFromLanguageTag(tag);
    if (matchedLocale) {
      return matchedLocale;
    }
  }
  return "en";
}

export function normalizeStudentLocale(
  locale: string | null | undefined
): StudentLocale {
  return detectPreferredStudentLocale(locale);
}

export function getStudentMessages(locale: StudentLocale): StudentMessages {
  return studentMessages[locale];
}

export function interpolate(
  template: string,
  values: Record<string, string | number>
): string {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, template);
}
