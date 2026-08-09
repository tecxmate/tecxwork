import { redirect } from "next/navigation";
import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../recruiter-dashboard";
import { getRecruiterDashboardData } from "../recruiter-data";
import { getAgencyActor } from "@/lib/agency-auth";
import { getOffersData } from "@/lib/offers-data";

export const dynamic = "force-dynamic";

export default async function RecruiterOffersPage() {
  const [data, actor] = await Promise.all([
    getRecruiterDashboardData(),
    getAgencyActor("offer:read"),
  ]);
  // Read, not write: a hiring manager approves offers without drafting them, and
  // approving something you cannot see is not a control.
  if (!actor) redirect("/dashboard/pipeline");

  const offers = await getOffersData(actor.orgId);

  return (
    <RecruiterLocaleProvider initialLocale={data.locale}>
      <RecruiterDashboard
        recruiter={data.recruiter}
        capabilities={data.capabilities}
        bookings={data.bookings}
        section="offers"
        showApplicants={data.showApplicants}
        jobModerationEnabled={data.jobModerationEnabled}
        salaryCurrencyOptions={data.salaryCurrencyOptions}
        offers={offers}
      />
    </RecruiterLocaleProvider>
  );
}
