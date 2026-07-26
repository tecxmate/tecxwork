import { redirect } from "next/navigation";
import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../recruiter-dashboard";
import { getRecruiterDashboardData } from "../recruiter-data";
import { getAgencyCrm } from "@/lib/agency-crm";

export const dynamic = "force-dynamic";

export default async function RecruiterCompliancePage() {
  const [data, crm] = await Promise.all([
    getRecruiterDashboardData(),
    getAgencyCrm(),
  ]);

  // Agency-only — compliance tracking is for the placement agency.
  if (!crm) redirect("/dashboard/pipeline");

  return (
    <RecruiterLocaleProvider initialLocale={data.locale}>
      <RecruiterDashboard
        recruiter={data.recruiter}
        bookings={data.bookings}
        section="compliance"
        showApplicants={data.showApplicants}
        jobModerationEnabled={data.jobModerationEnabled}
        salaryCurrencyOptions={data.salaryCurrencyOptions}
        agencyCrm={crm}
      />
    </RecruiterLocaleProvider>
  );
}
