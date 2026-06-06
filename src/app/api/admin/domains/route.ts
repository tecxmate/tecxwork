import { NextRequest, NextResponse } from "next/server";
import { db, allowedDomains } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { currentEventId } from "@/lib/tenant";
import { eq } from "drizzle-orm";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db
    .select()
    .from(allowedDomains)
    .where(eq(allowedDomains.eventId, await currentEventId()))
    .orderBy(allowedDomains.company);

  return NextResponse.json({ domains: result });
}

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { domain, company, industry } = body;

  if (!domain || !company || !industry) {
    return NextResponse.json(
      { error: "Domain, company, and industry are required" },
      { status: 400 }
    );
  }

  const normalized = domain.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(normalized)) {
    return NextResponse.json(
      { error: "Invalid domain format (e.g. tsmc.com)" },
      { status: 400 }
    );
  }

  try {
    const [created] = await db
      .insert(allowedDomains)
      .values({ domain: normalized, company, industry })
      .returning();

    return NextResponse.json({ domain: created }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return NextResponse.json(
        { error: "This domain is already in the allow-list" },
        { status: 409 }
      );
    }
    throw err;
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await db.delete(allowedDomains).where(eq(allowedDomains.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
