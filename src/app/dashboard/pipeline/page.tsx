import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../recruiter-dashboard";
import { getRecruiterDashboardData } from "../recruiter-data";
import { getPipelineBoard } from "@/lib/pipeline-data";
import { resolveRecruiterActor } from "@/lib/actor";

export const dynamic = "force-dynamic";

export default async function RecruiterPipelinePage() {
  // The actor is resolved once, here at the edge, and passed down. Everything below this
  // line takes identity as an argument rather than reading it from the request.
  const [data, actor] = await Promise.all([
    getRecruiterDashboardData(),
    resolveRecruiterActor(),
  ]);
  const pipelineBoard = actor ? await getPipelineBoard(actor) : null;

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
