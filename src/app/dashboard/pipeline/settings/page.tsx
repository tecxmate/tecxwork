import { redirect } from "next/navigation";
import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../../recruiter-dashboard";
import { getRecruiterDashboardData } from "../../recruiter-data";
import { getAgencyActor } from "@/lib/agency-auth";
import { listStages } from "@/lib/pipeline-config";

export const dynamic = "force-dynamic";

export default async function PipelineSettingsPage() {
  // Reshaping the process everyone else works inside is a manager's call; a recruiter who
  // lands here by URL is sent back to the board rather than shown a form that will 403.
  const [data, actor] = await Promise.all([
    getRecruiterDashboardData(),
    getAgencyActor("pipeline:configure"),
  ]);
  if (!actor) redirect("/dashboard/pipeline");

  const stages = await listStages(actor.orgId);

  return (
    <RecruiterLocaleProvider initialLocale={data.locale}>
      <RecruiterDashboard
        recruiter={data.recruiter}
        capabilities={data.capabilities}
        bookings={data.bookings}
        section="pipelineSettings"
        showApplicants={data.showApplicants}
        jobModerationEnabled={data.jobModerationEnabled}
        salaryCurrencyOptions={data.salaryCurrencyOptions}
        pipelineStages={stages}
      />
    </RecruiterLocaleProvider>
  );
}
