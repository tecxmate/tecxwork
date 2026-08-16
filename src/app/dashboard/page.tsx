import { redirect } from "next/navigation";

export default function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  return redirectFromLegacy(searchParams);
}

async function redirectFromLegacy(
  searchParams?: Promise<{ tab?: string }>
) {
  const resolved = searchParams ? await searchParams : undefined;
  const tab = resolved?.tab;

  if (tab === "applicants") {
    redirect("/dashboard/applicants");
  }
  if (tab === "company") {
    redirect("/dashboard/company");
  }

  // Home decides where an agency lands; it redirects client-company recruiters
  // straight on to their interviews, so this stays a single entry point.
  redirect("/dashboard/home");
}
