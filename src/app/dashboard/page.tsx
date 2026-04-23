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

  redirect("/dashboard/interviews");
}
