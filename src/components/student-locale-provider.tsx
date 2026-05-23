"use client";

import {
  startTransition,
  createContext,
  useEffect,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  STUDENT_LOCALE_COOKIE,
  detectPreferredStudentLocale,
  getStudentMessages,
  type StudentLocale,
  type StudentMessages,
} from "@/lib/student-messages";

type StudentLocaleContextValue = {
  locale: StudentLocale;
  messages: StudentMessages;
  setLocale: (locale: StudentLocale) => void;
};

const StudentLocaleContext = createContext<StudentLocaleContextValue | null>(null);

function hasLocaleCookie(cookieName: string) {
  return document.cookie
    .split(";")
    .some((cookie) => cookie.trim().startsWith(`${cookieName}=`));
}

export function StudentLocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: StudentLocale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<StudentLocale>(initialLocale);

  useEffect(() => {
    if (hasLocaleCookie(STUDENT_LOCALE_COOKIE)) return;

    const browserLocale = detectPreferredStudentLocale(
      navigator.languages?.length ? navigator.languages : navigator.language
    );

    document.cookie = `${STUDENT_LOCALE_COOKIE}=${encodeURIComponent(
      browserLocale
    )}; path=/; max-age=31536000; samesite=lax`;

    if (browserLocale !== locale) {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [locale, router]);

  const value = useMemo<StudentLocaleContextValue>(() => {
    const messages = getStudentMessages(locale);

    return {
      locale,
      messages,
      setLocale: (nextLocale) => {
        if (nextLocale === locale) return;
        setLocaleState(nextLocale);
        document.cookie = `${STUDENT_LOCALE_COOKIE}=${encodeURIComponent(
          nextLocale
        )}; path=/; max-age=31536000; samesite=lax`;
        startTransition(() => {
          router.refresh();
        });
      },
    };
  }, [locale, router]);

  return (
    <StudentLocaleContext.Provider value={value}>
      {children}
    </StudentLocaleContext.Provider>
  );
}

export function useStudentI18n() {
  const context = useContext(StudentLocaleContext);

  if (!context) {
    throw new Error("useStudentI18n must be used within StudentLocaleProvider");
  }

  return context;
}
