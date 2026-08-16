import { redirect } from "next/navigation";
import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../recruiter-dashboard";
import { getRecruiterDashboardData } from "../recruiter-data";
import { getAgencyCrm } from "@/lib/agency-crm";
import { getAgencyActor } from "@/lib/agency-auth";

export const dynamic = "force-dynamic";

export default async function RecruiterClientsPage() {
  const [data, actor] = await Promise.all([
    getRecruiterDashboardData(),
    getAgencyActor("client:read"),
  ]);

  // Agency-only view — a normal client recruiter has no clients of their own. Role decides the rest.
  if (!actor) redirect("/dashboard/pipeline");

  const crm = await getAgencyCrm(actor.orgId);
  if (!crm) redirect("/dashboard/pipeline");

  return (
    <RecruiterLocaleProvider initialLocale={data.locale}>
      <RecruiterDashboard
        recruiter={data.recruiter}
        capabilities={data.capabilities}
        bookings={data.bookings}
        section="clients"
        showApplicants={data.showApplicants}
        jobModerationEnabled={data.jobModerationEnabled}
        salaryCurrencyOptions={data.salaryCurrencyOptions}
        agencyCrm={crm}
      />
    </RecruiterLocaleProvider>
  );
}
