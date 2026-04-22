import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterSignupScreen } from "@/app/recruiter/signup/recruiter-signup-screen";
import { getRecruiterLocale } from "@/lib/recruiter-locale.server";

export default async function RecruiterSignupPage() {
  const locale = await getRecruiterLocale();

  return (
    <RecruiterLocaleProvider initialLocale={locale}>
      <RecruiterSignupScreen />
    </RecruiterLocaleProvider>
  );
}
