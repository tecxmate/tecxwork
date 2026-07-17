import { NextRequest, NextResponse } from "next/server";
import { db, eventConfig } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { isAllowedImageUrl } from "@/lib/image-host";
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
  // strings so the locale mapping stays intact. Only accept https URLs from an
  // allowed image host — blocks javascript:/data: URLs from being stored.
  const sanitized: string[] = [];
  for (const raw of homepageImages.slice(0, 3)) {
    if (typeof raw !== "string" || raw.trim() === "") {
      sanitized.push("");
      continue;
    }
    const trimmed = raw.trim();
    if (isAllowedImageUrl(trimmed)) {
      sanitized.push(trimmed);
      continue;
    }
    sanitized.push("");
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
