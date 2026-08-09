import { redirect } from "next/navigation";
import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../recruiter-dashboard";
import { getRecruiterDashboardData } from "../recruiter-data";
import { getPipelineReport } from "@/lib/pipeline-report";

export const dynamic = "force-dynamic";

export default async function RecruiterReportsPage() {
  const [data, report] = await Promise.all([
    getRecruiterDashboardData(),
    getPipelineReport(),
  ]);

  // Agency-only analytics.
  if (!report) redirect("/dashboard/pipeline");

  return (
    <RecruiterLocaleProvider initialLocale={data.locale}>
      <RecruiterDashboard
        recruiter={data.recruiter}
        capabilities={data.capabilities}
        bookings={data.bookings}
        section="reports"
        showApplicants={data.showApplicants}
        jobModerationEnabled={data.jobModerationEnabled}
        salaryCurrencyOptions={data.salaryCurrencyOptions}
        pipelineReport={report}
      />
    </RecruiterLocaleProvider>
  );
}
