import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../recruiter-dashboard";
import { getRecruiterDashboardData } from "../recruiter-data";
import { getAgencyCrm } from "@/lib/agency-crm";
import { getPlacementLifecycle } from "@/lib/placement-lifecycle";
import { getDb } from "@/lib/db";
import { recruiters } from "@/lib/db/schema";
import { getRecruiterFromSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RecruiterPlacementsPage() {
  const [data, crm, auth] = await Promise.all([
    getRecruiterDashboardData(),
    getAgencyCrm(),
    getRecruiterFromSession(),
  ]);

  // Agency-only: a client-company recruiter has no placements of their own to manage.
  // getAgencyCrm() already returns null for them, so this covers both checks.
  if (!crm || !auth) redirect("/dashboard/pipeline");

  const [me] = await getDb()
    .select({ orgId: recruiters.orgId })
    .from(recruiters)
    .where(eq(recruiters.id, auth.recruiterId))
    .limit(1);
  if (!me?.orgId) redirect("/dashboard/pipeline");

  const lifecycle = await getPlacementLifecycle(me.orgId);

  return (
    <RecruiterLocaleProvider initialLocale={data.locale}>
      <RecruiterDashboard
        recruiter={data.recruiter}
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
