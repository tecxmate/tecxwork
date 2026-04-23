import { studentEnMessages } from "@/messages/student/en";
import { studentViMessages } from "@/messages/student/vi";

export const STUDENT_LOCALE_COOKIE = "student_locale";

export type StudentLocale = "en" | "vi";

type DeepStringify<T> = T extends string
  ? string
  : {
      [K in keyof T]: DeepStringify<T[K]>;
    };

export type StudentMessages = DeepStringify<typeof studentEnMessages>;

export const studentMessages: Record<StudentLocale, StudentMessages> = {
  en: studentEnMessages,
  vi: studentViMessages,
};

export function normalizeStudentLocale(
  locale: string | null | undefined
): StudentLocale {
  const value = locale?.toLowerCase() || "";
  if (value.startsWith("vi")) {
    return "vi";
  }
  return "en";
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
