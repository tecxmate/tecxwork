import { redirect } from "next/navigation";
import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../recruiter-dashboard";
import { getRecruiterDashboardData } from "../recruiter-data";
import { getAgencyActor } from "@/lib/agency-auth";
import { getActivation } from "@/lib/activation";
import { getTenantById } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/**
 * The workspace landing page.
 *
 * Agency-only: a client-company recruiter has no clients, job orders or placements of their
 * own, so the setup path would be a list of things they cannot do. They keep going straight
 * to their interviews.
 */
export default async function DashboardHomePage() {
  const [data, actor] = await Promise.all([
    getRecruiterDashboardData(),
    getAgencyActor(),
  ]);

  if (!actor) redirect("/dashboard/interviews");

  const [activation, org] = await Promise.all([
    getActivation(actor.orgId),
    getTenantById(actor.orgId),
  ]);
  if (!activation) redirect("/dashboard/interviews");

  return (
    <RecruiterLocaleProvider initialLocale={data.locale}>
      <RecruiterDashboard
        recruiter={data.recruiter}
        capabilities={data.capabilities}
        bookings={data.bookings}
        section="home"
        showApplicants={data.showApplicants}
        jobModerationEnabled={data.jobModerationEnabled}
        salaryCurrencyOptions={data.salaryCurrencyOptions}
        home={{
          workspaceName: org?.name ?? data.recruiter.company,
          steps: activation.steps.map((s) => ({
            id: s.id,
            title: s.title,
            detail: s.detail,
            href: s.href,
            done: s.done,
          })),
          applicable: activation.applicable,
          completed: activation.completed,
          complete: activation.complete,
          seats: activation.seats,
          planName: activation.planName,
          trial: activation.trial
            ? { daysLeft: activation.trial.daysLeft, expired: activation.trial.expired }
            : null,
          complianceAttention: activation.complianceAttention,
        }}
      />
    </RecruiterLocaleProvider>
  );
}
