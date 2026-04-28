import { NextRequest, NextResponse } from "next/server";
import {
  db,
  users,
  recruiters,
  allowedDomains,
  recruiterEmailApprovals,
} from "@/lib/db";
import { COOKIE_NAME, createToken, hashPassword } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { ensureDefaultRecruiterSlots } from "@/lib/recruiter-onboarding";
import { parseJsonBody, recruiterSignupSchema } from "@/lib/validation";

/** POST — Recruiter self-signup with allowed-domain check */
export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, recruiterSignupSchema);
  if (!parsed.ok) return parsed.response;
  const {
    email: normalizedEmail,
    password,
    name,
    company,
    industry,
    description,
    contactEmail,
    confirmsLawfulHiring,
    confirmsNoDiscrimination,
    confirmsWorkAuthorizationChecks,
  } = parsed.data;

  if (
    !confirmsLawfulHiring ||
    !confirmsNoDiscrimination ||
    !confirmsWorkAuthorizationChecks
  ) {
    return NextResponse.json(
      {
        error:
          "You must confirm lawful hiring, non-discrimination, and work-authorization checks before creating a recruiter account.",
      },
      { status: 400 }
    );
  }

  const domain = normalizedEmail.split("@")[1];
  if (!domain) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const [emailApproval] = await db
    .select()
    .from(recruiterEmailApprovals)
    .where(
      and(
        eq(recruiterEmailApprovals.email, normalizedEmail),
        eq(recruiterEmailApprovals.status, "approved")
      )
    );

  const [allowed] = await db
    .select()
    .from(allowedDomains)
    .where(eq(allowedDomains.domain, domain));

  const [existingRecruiter] = await db
    .select({
      userId: users.id,
      email: users.email,
      role: users.role,
      recruiterId: recruiters.id,
      company: recruiters.company,
      industry: recruiters.industry,
    })
    .from(users)
    .innerJoin(recruiters, eq(recruiters.userId, users.id))
    .where(and(eq(users.email, normalizedEmail), eq(users.role, "recruiter")));

  if (existingRecruiter) {
    return NextResponse.json(
      {
        error:
          "An account with this email already exists. Please log in, or use 'Forgot password' to reset it.",
        code: "ACCOUNT_EXISTS",
      },
      { status: 409 }
    );
  }

  if (!emailApproval && !allowed) {
    return NextResponse.json(
      {
        error:
          "This email domain is not authorized. Contact the event admin to be added to the recruiter list.",
      },
      { status: 403 }
    );
  }

  try {
    const passwordHash = await hashPassword(password);

    // Create user
    const [user] = await db
      .insert(users)
      .values({ email: normalizedEmail, name, passwordHash, role: "recruiter" })
      .returning();

    // Create recruiter profile
    const [recruiter] = await db
      .insert(recruiters)
      .values({
        userId: user.id,
        company: company || emailApproval?.company || allowed?.company || "",
        industry: industry || emailApproval?.industry || allowed?.industry || "",
        description: description ?? "",
        contactEmail: contactEmail ?? normalizedEmail,
      })
      .returning();

    await ensureDefaultRecruiterSlots(recruiter.id);
    await db
      .delete(recruiterEmailApprovals)
      .where(eq(recruiterEmailApprovals.email, normalizedEmail));

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
