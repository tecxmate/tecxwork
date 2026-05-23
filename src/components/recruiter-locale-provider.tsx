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
  RECRUITER_LOCALE_COOKIE,
  detectPreferredRecruiterLocale,
  getRecruiterMessages,
  type RecruiterLocale,
  type RecruiterMessages,
} from "@/lib/recruiter-messages";

type RecruiterLocaleContextValue = {
  locale: RecruiterLocale;
  messages: RecruiterMessages;
  setLocale: (locale: RecruiterLocale) => void;
};

const RecruiterLocaleContext = createContext<RecruiterLocaleContextValue | null>(null);

function hasLocaleCookie(cookieName: string) {
  return document.cookie
    .split(";")
    .some((cookie) => cookie.trim().startsWith(`${cookieName}=`));
}

export function RecruiterLocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: RecruiterLocale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<RecruiterLocale>(initialLocale);

  useEffect(() => {
    if (hasLocaleCookie(RECRUITER_LOCALE_COOKIE)) return;

    const browserLocale = detectPreferredRecruiterLocale(
      navigator.languages?.length ? navigator.languages : navigator.language
    );

    document.cookie = `${RECRUITER_LOCALE_COOKIE}=${encodeURIComponent(
      browserLocale
    )}; path=/; max-age=31536000; samesite=lax`;

    if (browserLocale !== locale) {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [locale, router]);

  const value = useMemo<RecruiterLocaleContextValue>(() => {
    const messages = getRecruiterMessages(locale);

    return {
      locale,
      messages,
      setLocale: (nextLocale) => {
        if (nextLocale === locale) return;
        setLocaleState(nextLocale);
        document.cookie = `${RECRUITER_LOCALE_COOKIE}=${encodeURIComponent(
          nextLocale
        )}; path=/; max-age=31536000; samesite=lax`;
        startTransition(() => {
          router.refresh();
        });
      },
    };
  }, [locale, router]);

  return (
    <RecruiterLocaleContext.Provider value={value}>
      {children}
    </RecruiterLocaleContext.Provider>
  );
}

export function useRecruiterI18n() {
  const context = useContext(RecruiterLocaleContext);

  if (!context) {
    throw new Error("useRecruiterI18n must be used within RecruiterLocaleProvider");
  }

  return context;
}
