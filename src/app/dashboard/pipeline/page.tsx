import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../recruiter-dashboard";
import { getRecruiterDashboardData } from "../recruiter-data";
import { getPipelineBoard } from "@/lib/pipeline-data";

export const dynamic = "force-dynamic";

export default async function RecruiterPipelinePage() {
  const [data, pipelineBoard] = await Promise.all([
    getRecruiterDashboardData(),
    getPipelineBoard(),
  ]);

  return (
    <RecruiterLocaleProvider initialLocale={data.locale}>
      <RecruiterDashboard
        recruiter={data.recruiter}
        capabilities={data.capabilities}
        bookings={data.bookings}
        section="pipeline"
        showApplicants={data.showApplicants}
        jobModerationEnabled={data.jobModerationEnabled}
        salaryCurrencyOptions={data.salaryCurrencyOptions}
        pipelineBoard={pipelineBoard}
      />
    </RecruiterLocaleProvider>
  );
}
