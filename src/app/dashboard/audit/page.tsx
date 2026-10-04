import { redirect } from "next/navigation";
import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../recruiter-dashboard";
import { getRecruiterDashboardData } from "../recruiter-data";
import { getAgencyActor } from "@/lib/agency-auth";
import { getAuditPage } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

/**
 * The audit trail, gated on `audit:read` — an oversight capability held by admins and
 * viewers. The rail already hides the tab for everyone else; this is the check that holds.
 */
export default async function RecruiterAuditPage() {
  const [data, actor] = await Promise.all([
    getRecruiterDashboardData(),
    getAgencyActor("audit:read"),
  ]);

  if (!actor) redirect("/dashboard/pipeline");

  const audit = await getAuditPage(actor.orgId);

  return (
    <RecruiterLocaleProvider initialLocale={data.locale}>
      <RecruiterDashboard
        recruiter={data.recruiter}
        capabilities={data.capabilities}
        bookings={data.bookings}
        section="audit"
        showApplicants={data.showApplicants}
        jobModerationEnabled={data.jobModerationEnabled}
        salaryCurrencyOptions={data.salaryCurrencyOptions}
        audit={{
          ...audit,
          events: audit.events.map((e) => ({
            ...e,
            createdAt: e.createdAt.toISOString(),
          })),
        }}
      />
    </RecruiterLocaleProvider>
  );
}
