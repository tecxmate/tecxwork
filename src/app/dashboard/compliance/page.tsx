import { redirect } from "next/navigation";
import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../recruiter-dashboard";
import { getRecruiterDashboardData } from "../recruiter-data";
import { getAgencyCrm } from "@/lib/agency-crm";
import { getAgencyActor } from "@/lib/agency-auth";

export const dynamic = "force-dynamic";

export default async function RecruiterCompliancePage() {
  const [data, crm, actor] = await Promise.all([
    getRecruiterDashboardData(),
    getAgencyCrm(),
    getAgencyActor("compliance:read"),
  ]);

  // Agency-only — compliance tracking is for the placement agency. Role decides the rest.
  if (!crm || !actor) redirect("/dashboard/pipeline");

  return (
    <RecruiterLocaleProvider initialLocale={data.locale}>
      <RecruiterDashboard
        recruiter={data.recruiter}
        capabilities={data.capabilities}
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
