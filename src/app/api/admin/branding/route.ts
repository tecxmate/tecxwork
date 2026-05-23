import { NextRequest, NextResponse } from "next/server";
import { db, eventConfig } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

const FIELDS = [
  "eventName",
  "emailEventName",
  "tagline",
  "organizer",
  "organizerShort",
  "hostedAt",
  "hostedAtFull",
  "displayDate",
  "displayYear",
  "location",
] as const;

type Field = (typeof FIELDS)[number];

const MAX_LEN: Record<Field, number> = {
  eventName: 200,
  emailEventName: 200,
  tagline: 300,
  organizer: 200,
  organizerShort: 40,
  hostedAt: 200,
  hostedAtFull: 300,
  displayDate: 100,
  displayYear: 16,
  location: 300,
};

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [row] = await db
    .select({
      eventName: eventConfig.eventName,
      emailEventName: eventConfig.emailEventName,
      tagline: eventConfig.tagline,
      organizer: eventConfig.organizer,
      organizerShort: eventConfig.organizerShort,
      hostedAt: eventConfig.hostedAt,
      hostedAtFull: eventConfig.hostedAtFull,
      displayDate: eventConfig.displayDate,
      displayYear: eventConfig.displayYear,
      location: eventConfig.location,
      eventDate: eventConfig.eventDate,
      eventEndDate: eventConfig.eventEndDate,
      heroOverlayEnabled: eventConfig.heroOverlayEnabled,
    })
    .from(eventConfig)
    .limit(1);

  return NextResponse.json(row ?? null);
}

export async function PUT(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const update: Partial<Record<Field, string>> & {
    eventDate?: Date;
    eventEndDate?: Date | null;
  } = {};

  for (const field of FIELDS) {
    const value = (body as Record<string, unknown>)[field];
    if (value === undefined) continue;
    if (typeof value !== "string") {
      return NextResponse.json(
        { error: `${field} must be a string` },
        { status: 400 }
      );
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: `${field} cannot be empty` },
        { status: 400 }
      );
    }
    if (trimmed.length > MAX_LEN[field]) {
      return NextResponse.json(
        { error: `${field} exceeds ${MAX_LEN[field]} characters` },
        { status: 400 }
      );
    }
    update[field] = trimmed;
  }

  if (typeof body.eventDate === "string") {
    const d = new Date(body.eventDate);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid eventDate" }, { status: 400 });
    }
    update.eventDate = d;
  }
  if (body.eventEndDate === null) {
    update.eventEndDate = null;
  } else if (typeof body.eventEndDate === "string") {
    const d = new Date(body.eventEndDate);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid eventEndDate" }, { status: 400 });
    }
    update.eventEndDate = d;
  }

  if (typeof body.heroOverlayEnabled === "boolean") {
    (update as Record<string, unknown>).heroOverlayEnabled = body.heroOverlayEnabled;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields provided" }, { status: 400 });
  }

  const [config] = await db
    .select({ id: eventConfig.id })
    .from(eventConfig)
    .limit(1);
  if (!config) {
    return NextResponse.json(
      { error: "Event config not found" },
      { status: 404 }
    );
  }

  await db.update(eventConfig).set(update).where(eq(eventConfig.id, config.id));

  return NextResponse.json({ ok: true, updated: Object.keys(update) });
}
