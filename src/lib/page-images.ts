import { eq } from "drizzle-orm";
import { db, eventConfig } from "@/lib/db";
import { getTenantContextOrNull } from "@/lib/tenant";

export async function getPageImages(placement: "browse" | "jobs") {
  const ctx = await getTenantContextOrNull();
  if (!ctx) return [];
  const [config] = await db
    .select({
      browsePageImages: eventConfig.browsePageImages,
      jobsPageImages: eventConfig.jobsPageImages,
    })
    .from(eventConfig)
    .where(eq(eventConfig.eventId, ctx.eventId))
    .limit(1);

  const images =
    placement === "browse" ? config?.browsePageImages : config?.jobsPageImages;
  return (images ?? []).filter(Boolean).slice(0, 2);
}

export async function getJobsPageHeroEnabled() {
  const ctx = await getTenantContextOrNull();
  if (!ctx) return false;
  const [config] = await db
    .select({
      jobsPageHeroEnabled: eventConfig.jobsPageHeroEnabled,
    })
    .from(eventConfig)
    .where(eq(eventConfig.eventId, ctx.eventId))
    .limit(1);

  return config?.jobsPageHeroEnabled ?? false;
}
