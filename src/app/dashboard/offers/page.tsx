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
    getAgencyActor("offer:write"),
  ]);
  // A hiring manager can approve but not draft, so they reach offers from the pipeline
  // rather than this screen; anyone without offer:write is sent back to the board.
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
