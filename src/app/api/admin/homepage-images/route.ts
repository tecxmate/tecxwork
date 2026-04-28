import { NextRequest, NextResponse } from "next/server";
import { db, eventConfig } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
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

  // Only accept https URLs from our blob host. Blocks javascript:/data:
  // URLs from being stored and rendered later in <img src>/<a href>.
  const sanitized: string[] = [];
  for (const raw of homepageImages.slice(0, 4)) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    try {
      const u = new URL(trimmed);
      if (
        u.protocol === "https:" &&
        u.hostname.endsWith(".public.blob.vercel-storage.com")
      ) {
        sanitized.push(trimmed);
      }
    } catch {
      // not a valid URL — skip
    }
  }

  const [config] = await db.select({ id: eventConfig.id }).from(eventConfig).limit(1);

  if (!config) {
    return NextResponse.json({ error: "Event config not found" }, { status: 404 });
  }

  await db
    .update(eventConfig)
    .set({ homepageImages: sanitized })
    .where(eq(eventConfig.id, config.id));

  return NextResponse.json({ ok: true });
}
