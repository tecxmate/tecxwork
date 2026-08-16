import { redirect } from "next/navigation";
import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../recruiter-dashboard";
import { getRecruiterDashboardData } from "../recruiter-data";
import { getAgencyActor } from "@/lib/agency-auth";
import { getTeam } from "@/lib/members";
import { listApiKeys } from "@/lib/api-keys";
import { capabilitiesFor } from "@/lib/permissions";
import { hasFeature } from "@/lib/plans";

export const dynamic = "force-dynamic";

/**
 * Workspace team management.
 *
 * `member:invite` is admin-only, so anyone else is sent back to the pipeline rather than
 * shown an empty screen — the nav already hides the tab for them, and this is the check
 * that actually holds.
 */
export default async function RecruiterTeamPage() {
  const [data, actor] = await Promise.all([
    getRecruiterDashboardData(),
    getAgencyActor("member:invite"),
  ]);

  if (!actor) redirect("/dashboard/pipeline");

  const [team, apiKeys] = await Promise.all([
    getTeam(actor.orgId),
    listApiKeys(actor.orgId),
  ]);

  return (
    <RecruiterLocaleProvider initialLocale={data.locale}>
      <RecruiterDashboard
        recruiter={data.recruiter}
        capabilities={data.capabilities}
        bookings={data.bookings}
        section="team"
        showApplicants={data.showApplicants}
        jobModerationEnabled={data.jobModerationEnabled}
        salaryCurrencyOptions={data.salaryCurrencyOptions}
        team={{
          members: team.members.map((m) => ({
            ...m,
            joinedAt: m.joinedAt.toISOString(),
          })),
          invites: team.invites.map((i) => ({
            ...i,
            expiresAt: i.expiresAt.toISOString(),
          })),
          seats: team.seats,
          apiKeys: apiKeys.map((k) => ({
            ...k,
            lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
            expiresAt: k.expiresAt ? k.expiresAt.toISOString() : null,
            createdAt: k.createdAt.toISOString(),
          })),
          // The form offers only what this member could delegate; the server
          // re-checks, so this is UX rather than the control.
          grantableScopes: [...capabilitiesFor(actor.role)],
          apiAccessEnabled: hasFeature(actor.plan, "api_access"),
        }}
      />
    </RecruiterLocaleProvider>
  );
}
