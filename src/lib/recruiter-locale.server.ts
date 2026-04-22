import { cookies, headers } from "next/headers";

import {
  RECRUITER_LOCALE_COOKIE,
  normalizeRecruiterLocale,
  type RecruiterLocale,
} from "@/lib/recruiter-messages";

export async function getRecruiterLocale(): Promise<RecruiterLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(RECRUITER_LOCALE_COOKIE)?.value;

  if (cookieLocale) {
    return normalizeRecruiterLocale(cookieLocale);
  }

  const headerStore = await headers();
  return normalizeRecruiterLocale(headerStore.get("accept-language"));
}
