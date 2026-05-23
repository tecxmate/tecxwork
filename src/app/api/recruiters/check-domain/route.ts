import { NextRequest, NextResponse } from "next/server";
import { db, allowedDomains, recruiterEmailApprovals, recruiters, users } from "@/lib/db";
import { and, eq } from "drizzle-orm";

/** GET ?email=... — check if recruiter email is allowed, return pre-fill info */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const domain = normalizedEmail.split("@")[1].trim().toLowerCase();

  const [emailApproval] = await db
    .select()
    .from(recruiterEmailApprovals)
    .where(
      and(
        eq(recruiterEmailApprovals.email, normalizedEmail),
        eq(recruiterEmailApprovals.status, "approved")
      )
    );

  if (emailApproval) {
    return NextResponse.json({
      allowed: true,
      company: emailApproval.company,
      industry: emailApproval.industry,
      approvalType: "email",
    });
  }

  const [existingRecruiter] = await db
    .select({
      company: recruiters.company,
      industry: recruiters.industry,
    })
    .from(users)
    .innerJoin(recruiters, eq(recruiters.userId, users.id))
    .where(and(eq(users.email, normalizedEmail), eq(users.role, "recruiter")));

  if (existingRecruiter) {
    return NextResponse.json({
      allowed: true,
      company: existingRecruiter.company,
      industry: existingRecruiter.industry,
      approvalType: "existing-recruiter",
    });
  }

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
    approvalType: "domain",
  });
}
