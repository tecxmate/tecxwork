import { redirect } from "next/navigation";
import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { RecruiterDashboard } from "../recruiter-dashboard";
import { getRecruiterDashboardData } from "../recruiter-data";
import { searchCandidates } from "@/lib/candidate-search";
import { getAgencyActor } from "@/lib/agency-auth";

export const dynamic = "force-dynamic";

/**
 * Filters come from the URL, so a search is shareable and the back button works. That also
 * means this page re-runs the query on every filter change, which is why the search is done
 * in SQL rather than by loading the pool and filtering in the browser.
 */
export default async function RecruiterCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const one = (k: string) => {
    const v = params[k];
    return typeof v === "string" ? v : undefined;
  };

  const data = await getRecruiterDashboardData();
  if (!data.recruiter) redirect("/login");

  // The candidate pool is the agency's own asset and is full of PII. Being a signed-in
  // recruiter is not enough to read it — a client company's recruiter sees only the
  // candidates submitted to their own jobs, never the searchable database behind them.
  const actor = await getAgencyActor("candidate:read");
  if (!actor) redirect("/dashboard");

  const docs = one("docs");
  const result = await searchCandidates({
    q: one("q"),
    nationality: one("nationality"),
    studyLevel: one("studyLevel"),
    skills: (one("skills") ?? "").split(",").filter(Boolean),
    docs: docs === "valid" || docs === "attention" ? docs : "any",
    page: Number(one("page")) || 1,
  });

  return (
    <RecruiterLocaleProvider initialLocale={data.locale}>
      <RecruiterDashboard
        recruiter={data.recruiter}
        capabilities={data.capabilities}
        bookings={data.bookings}
        section="candidates"
        showApplicants={data.showApplicants}
        jobModerationEnabled={data.jobModerationEnabled}
        salaryCurrencyOptions={data.salaryCurrencyOptions}
        candidateSearch={result}
      />
    </RecruiterLocaleProvider>
  );
}
