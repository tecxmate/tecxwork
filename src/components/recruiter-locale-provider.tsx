"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  RECRUITER_LOCALE_COOKIE,
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

export function RecruiterLocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: RecruiterLocale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<RecruiterLocale>(initialLocale);

  const value = useMemo<RecruiterLocaleContextValue>(() => {
    const messages = getRecruiterMessages(locale);

    return {
      locale,
      messages,
      setLocale: (nextLocale) => {
        setLocaleState(nextLocale);
        document.cookie = `${RECRUITER_LOCALE_COOKIE}=${encodeURIComponent(
          nextLocale
        )}; path=/; max-age=31536000; samesite=lax`;
      },
    };
  }, [locale]);

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
