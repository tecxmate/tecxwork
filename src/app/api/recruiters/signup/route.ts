import { NextRequest, NextResponse } from "next/server";
import { db, users, recruiters, allowedDomains, slots } from "@/lib/db";
import { hashPassword, createToken, COOKIE_NAME } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { EVENT_CONFIG } from "@/lib/data";

/** POST — Recruiter self-signup with allowed-domain check */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    email,
    password,
    name,
    company,
    industry,
    description,
    positions,
    contactEmail,
    jdLink,
  } = body;

  if (!email || !password || !name || !company || !industry) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  // Verify email domain is allowed
  const domain = email.split("@")[1]?.trim().toLowerCase();
  if (!domain) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const [allowed] = await db
    .select()
    .from(allowedDomains)
    .where(eq(allowedDomains.domain, domain));

  if (!allowed) {
    return NextResponse.json(
      {
        error:
          "This email domain is not authorized. Contact the event admin to be added to the recruiter list.",
      },
      { status: 403 }
    );
  }

  try {
    // Create user
    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({ email, name, passwordHash, role: "recruiter" })
      .returning();

    // Create recruiter profile
    const [recruiter] = await db
      .insert(recruiters)
      .values({
        userId: user.id,
        company: company ?? allowed.company,
        industry: industry ?? allowed.industry,
        description: description ?? "",
        positions: positions ?? [],
        contactEmail: contactEmail ?? email,
        jdLink: jdLink ?? null,
      })
      .returning();

    // Generate default slots for event day using EVENT_CONFIG
    const dateObj = EVENT_CONFIG.date;
    const eventDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    const startHour: number = EVENT_CONFIG.startHour;
    const endHour: number = EVENT_CONFIG.endHour;
    const endMinutes: number = EVENT_CONFIG.endMinutes;
    const slotDuration: number = EVENT_CONFIG.slotDuration;
    const slotValues: { recruiterId: number; startTime: Date; endTime: Date }[] = [];
    for (let h = startHour; h < endHour + 1; h++) {
      for (let m = 0; m < 60; m += slotDuration) {
        if (h === endHour && m >= endMinutes) break;
        if (h > endHour) break;
        const start = new Date(
          `${eventDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+08:00`
        );
        const end = new Date(start.getTime() + slotDuration * 60 * 1000);
        slotValues.push({ recruiterId: recruiter.id, startTime: start, endTime: end });
      }
    }
    await db.insert(slots).values(slotValues);

    // Auto-login
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: "recruiter",
    });

    const res = NextResponse.json({ recruiter }, { status: 201 });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return res;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("unique")) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try logging in." },
        { status: 409 }
      );
    }
    throw err;
  }
}
