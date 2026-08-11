import { recruiterEnMessages } from "@/messages/recruiter/en";
import { recruiterViMessages } from "@/messages/recruiter/vi";
import { recruiterZhTwMessages } from "@/messages/recruiter/zh-TW";

export const RECRUITER_LOCALE_COOKIE = "recruiter_locale";

export type RecruiterLocale = "en" | "zh-TW" | "vi";

type DeepStringify<T> = T extends string
  ? string
  : {
      [K in keyof T]: DeepStringify<T[K]>;
    };

export type RecruiterMessages = DeepStringify<typeof recruiterEnMessages>;

export const recruiterMessages: Record<RecruiterLocale, RecruiterMessages> = {
  en: recruiterEnMessages,
  "zh-TW": recruiterZhTwMessages,
  vi: recruiterViMessages,
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

function localeFromLanguageTag(tag: string): RecruiterLocale | null {
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

export function detectPreferredRecruiterLocale(
  locale: string | readonly string[] | null | undefined
): RecruiterLocale {
  for (const tag of preferredLanguageTags(locale)) {
    const matchedLocale = localeFromLanguageTag(tag);
    if (matchedLocale) {
      return matchedLocale;
    }
  }
  return "en";
}

export function normalizeRecruiterLocale(
  locale: string | null | undefined
): RecruiterLocale {
  return detectPreferredRecruiterLocale(locale);
}

export function getRecruiterMessages(locale: RecruiterLocale): RecruiterMessages {
  return recruiterMessages[locale];
}
