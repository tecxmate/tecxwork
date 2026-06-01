import { db, eventConfig } from "@/lib/db";

export async function getPageImages(placement: "browse" | "jobs") {
  const [config] = await db
    .select({
      browsePageImages: eventConfig.browsePageImages,
      jobsPageImages: eventConfig.jobsPageImages,
    })
    .from(eventConfig)
    .limit(1);

  const images =
    placement === "browse" ? config?.browsePageImages : config?.jobsPageImages;
  return (images ?? []).filter(Boolean).slice(0, 2);
}

export async function getJobsPageHeroEnabled() {
  const [config] = await db
    .select({
      jobsPageHeroEnabled: eventConfig.jobsPageHeroEnabled,
    })
    .from(eventConfig)
    .limit(1);

  return config?.jobsPageHeroEnabled ?? true;
}
