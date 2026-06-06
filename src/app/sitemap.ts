import type { MetadataRoute } from "next";
import { and, eq } from "drizzle-orm";
import { db, jobOpenings } from "@/lib/db";
import { getDefaultEvent } from "@/lib/tenant";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_BASE_URL ??
  "https://work.tecxmate.com";

const LOCALES = ["en", "vi", "zh-TW"] as const;

function withAlternates(path: string) {
  const url = `${SITE_URL}${path}`;
  return {
    url,
    alternates: {
      languages: {
        en: url,
        vi: url,
        "zh-TW": url,
        "x-default": url,
      } as Record<string, string>,
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { ...withAlternates("/"), lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { ...withAlternates("/browse"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { ...withAlternates("/jobs"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { ...withAlternates("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { ...withAlternates("/get-started"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { ...withAlternates("/tutorial"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { ...withAlternates("/privacy-policy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { ...withAlternates("/terms-of-service"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  let jobRoutes: MetadataRoute.Sitemap = [];
  try {
    // Static route — resolve the event without request headers.
    const event = await getDefaultEvent();
    const jobs = await db
      .select({ id: jobOpenings.id, createdAt: jobOpenings.createdAt })
      .from(jobOpenings)
      .where(
        event
          ? and(
              eq(jobOpenings.moderationStatus, "approved"),
              eq(jobOpenings.eventId, event.id)
            )
          : eq(jobOpenings.moderationStatus, "approved")
      );
    jobRoutes = jobs.map((j) => ({
      ...withAlternates(`/jobs/${j.id}`),
      lastModified: j.createdAt ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB unavailable at build time — return static routes only.
  }

  void LOCALES;

  return [...staticRoutes, ...jobRoutes];
}
