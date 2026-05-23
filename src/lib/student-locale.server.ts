import { cookies, headers } from "next/headers";

import {
  STUDENT_LOCALE_COOKIE,
  normalizeStudentLocale,
  type StudentLocale,
} from "@/lib/student-messages";

export async function getStudentLocale(): Promise<StudentLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(STUDENT_LOCALE_COOKIE)?.value;

  if (cookieLocale) {
    return normalizeStudentLocale(cookieLocale);
  }

  const headerStore = await headers();
  return normalizeStudentLocale(headerStore.get("accept-language"));
}
