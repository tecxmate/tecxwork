import { NextRequest, NextResponse } from "next/server";
import { db, eventConfig } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const { homepageImages } = body;

  if (!Array.isArray(homepageImages)) {
    return NextResponse.json(
      { error: "homepageImages must be an array" },
      { status: 400 }
    );
  }

  const [config] = await db.select({ id: eventConfig.id }).from(eventConfig).limit(1);

  if (!config) {
    return NextResponse.json({ error: "Event config not found" }, { status: 404 });
  }

  await db
    .update(eventConfig)
    .set({ homepageImages: homepageImages.slice(0, 4) })
    .where(eq(eventConfig.id, config.id));

  return NextResponse.json({ ok: true });
}
