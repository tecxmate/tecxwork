import { redirect } from "next/navigation";
import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../recruiter-dashboard";
import { getRecruiterDashboardData } from "../recruiter-data";
import { getAgencyActor } from "@/lib/agency-auth";
import { getBillingData } from "@/lib/billing";

export const dynamic = "force-dynamic";

export default async function RecruiterBillingPage() {
  const [data, actor] = await Promise.all([
    getRecruiterDashboardData(),
    getAgencyActor("invoice:read"),
  ]);
  if (!actor) redirect("/dashboard/pipeline");

  const billing = await getBillingData(actor.orgId);

  return (
    <RecruiterLocaleProvider initialLocale={data.locale}>
      <RecruiterDashboard
        recruiter={data.recruiter}
        capabilities={data.capabilities}
        bookings={data.bookings}
        section="billing"
        showApplicants={data.showApplicants}
        jobModerationEnabled={data.jobModerationEnabled}
        salaryCurrencyOptions={data.salaryCurrencyOptions}
        billing={billing}
      />
    </RecruiterLocaleProvider>
  );
}
