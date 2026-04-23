import { redirect } from "next/navigation";

import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../recruiter-dashboard";
import { getRecruiterDashboardData } from "../recruiter-data";

export default async function RecruiterApplicantsPage() {
  const data = await getRecruiterDashboardData();

  if (!data.showApplicants) {
    redirect("/dashboard/interviews");
  }

  return (
    <RecruiterLocaleProvider initialLocale={data.locale}>
      <RecruiterDashboard
        recruiter={data.recruiter}
        bookings={data.bookings}
        section="applicants"
        showApplicants={data.showApplicants}
      />
    </RecruiterLocaleProvider>
  );
}
