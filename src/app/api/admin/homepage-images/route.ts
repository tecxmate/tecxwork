import { NextRequest, NextResponse } from "next/server";
import { db, eventConfig } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { currentEventId } from "@/lib/tenant";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { homepageImages } = body;

  if (!Array.isArray(homepageImages)) {
    return NextResponse.json(
      { error: "homepageImages must be an array" },
      { status: 400 }
    );
  }

  // Slots are positional (index 0 = en, 1 = vi, 2 = zh-TW). Preserve empty
  // strings so the locale mapping stays intact. Only accept https URLs from
  // our blob host — blocks javascript:/data: URLs from being stored.
  const sanitized: string[] = [];
  for (const raw of homepageImages.slice(0, 3)) {
    if (typeof raw !== "string" || raw.trim() === "") {
      sanitized.push("");
      continue;
    }
    const trimmed = raw.trim();
    try {
      const u = new URL(trimmed);
      if (
        u.protocol === "https:" &&
        u.hostname.endsWith(".public.blob.vercel-storage.com")
      ) {
        sanitized.push(trimmed);
        continue;
      }
    } catch {
      // not a valid URL — fall through
    }
    sanitized.push("");
  }

  const [config] = await db
    .select({ id: eventConfig.id })
    .from(eventConfig)
    .where(eq(eventConfig.eventId, await currentEventId()))
    .limit(1);

  if (!config) {
    return NextResponse.json({ error: "Event config not found" }, { status: 404 });
  }

  await db
    .update(eventConfig)
    .set({ homepageImages: sanitized })
    .where(eq(eventConfig.id, config.id));

  return NextResponse.json({ ok: true });
}
