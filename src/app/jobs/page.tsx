import type { Metadata } from "next";

import { JobsListPage } from "@/app/jobs/jobs-list-page";
import { getEventBranding } from "@/lib/event-branding";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getEventBranding();
  return {
    title: `Job Opportunities | ${branding.name}`,
    description: "Browse openings posted by participating recruiters",
  };
}

export default async function JobsPage() {
  return <JobsListPage />;
}
