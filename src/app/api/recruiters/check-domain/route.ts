import { NextRequest, NextResponse } from "next/server";
import { db, allowedDomains } from "@/lib/db";
import { eq } from "drizzle-orm";

/** GET ?email=... — check if recruiter email is allowed, return pre-fill info */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const domain = email.split("@")[1].trim().toLowerCase();

  const [match] = await db
    .select()
    .from(allowedDomains)
    .where(eq(allowedDomains.domain, domain));

  if (!match) {
    return NextResponse.json(
      { allowed: false, error: "This email domain is not authorized. Contact the event admin to be added." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    allowed: true,
    company: match.company,
    industry: match.industry,
  });
}
