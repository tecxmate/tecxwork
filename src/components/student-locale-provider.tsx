"use client";

import {
  startTransition,
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  STUDENT_LOCALE_COOKIE,
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

export function StudentLocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: StudentLocale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<StudentLocale>(initialLocale);

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
