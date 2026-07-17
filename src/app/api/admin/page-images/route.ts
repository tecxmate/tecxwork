import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, eventConfig } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { isAllowedImageUrl } from "@/lib/image-host";

type Placement = "browse" | "jobs";

function sanitizeImages(rawImages: unknown) {
  if (!Array.isArray(rawImages)) return null;

  const sanitized: string[] = [];
  for (const raw of rawImages.slice(0, 2)) {
    if (typeof raw !== "string" || raw.trim() === "") continue;
    const trimmed = raw.trim();
    if (isAllowedImageUrl(trimmed)) {
      sanitized.push(trimmed);
    }
  }
  return sanitized;
}

export async function PUT(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const placement = body.placement as Placement;
  const images = sanitizeImages(body.images);

  if (placement !== "browse" && placement !== "jobs") {
    return NextResponse.json(
      { error: "placement must be 'browse' or 'jobs'" },
      { status: 400 }
    );
  }

  if (!images) {
    return NextResponse.json(
      { error: "images must be an array" },
      { status: 400 }
    );
  }

  const [config] = await db.select({ id: eventConfig.id }).from(eventConfig).limit(1);
  if (!config) {
    return NextResponse.json({ error: "Event config not found" }, { status: 404 });
  }

  await db
    .update(eventConfig)
    .set(
      placement === "browse"
        ? { browsePageImages: images }
        : { jobsPageImages: images }
    )
    .where(eq(eventConfig.id, config.id));

  return NextResponse.json({ ok: true });
}
