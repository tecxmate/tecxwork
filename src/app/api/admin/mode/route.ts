import { NextRequest, NextResponse } from "next/server";
import { db, eventConfig } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const [config] = await db
    .select({ mode: eventConfig.mode })
    .from(eventConfig)
    .limit(1);

  return NextResponse.json({ mode: config?.mode ?? "both" });
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mode } = await req.json();
  if (!["applicant_books_recruiter", "recruiter_books_applicant", "both"].includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const [config] = await db.select({ id: eventConfig.id }).from(eventConfig).limit(1);
  if (!config) {
    return NextResponse.json({ error: "Event config not found" }, { status: 404 });
  }

  await db.update(eventConfig).set({ mode }).where(eq(eventConfig.id, config.id));

  return NextResponse.json({ mode });
}
