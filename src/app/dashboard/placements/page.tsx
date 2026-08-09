import { redirect } from "next/navigation";
import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../recruiter-dashboard";
import { getRecruiterDashboardData } from "../recruiter-data";
import { getAgencyCrm } from "@/lib/agency-crm";
import { getPlacementLifecycle } from "@/lib/placement-lifecycle";
import { getAgencyActor } from "@/lib/agency-auth";

export const dynamic = "force-dynamic";

export default async function RecruiterPlacementsPage() {
  // Agency-only, and only for roles that may see the commercial picture. The actor also
  // carries the orgId every query below must be scoped to.
  const [data, crm, actor] = await Promise.all([
    getRecruiterDashboardData(),
    getAgencyCrm(),
    getAgencyActor("placement:read"),
  ]);

  if (!crm || !actor) redirect("/dashboard/pipeline");

  const lifecycle = await getPlacementLifecycle(actor.orgId);

  return (
    <RecruiterLocaleProvider initialLocale={data.locale}>
      <RecruiterDashboard
        recruiter={data.recruiter}
        capabilities={data.capabilities}
        bookings={data.bookings}
        section="placements"
        showApplicants={data.showApplicants}
        jobModerationEnabled={data.jobModerationEnabled}
        salaryCurrencyOptions={data.salaryCurrencyOptions}
        agencyCrm={crm}
        placements={lifecycle}
      />
    </RecruiterLocaleProvider>
  );
}
