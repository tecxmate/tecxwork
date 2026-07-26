import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { authorizeApplication } from "@/lib/ats-auth";
import { scorecards, users } from "@/lib/db/schema";

const RECOMMENDATIONS = ["strong_no", "no", "yes", "strong_yes"] as const;
type Recommendation = (typeof RECOMMENDATIONS)[number];

function isRecommendation(v: unknown): v is Recommendation {
  return typeof v === "string" && (RECOMMENDATIONS as readonly string[]).includes(v);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isInteger(applicationId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const auth = await authorizeApplication(applicationId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as { recommendation?: unknown; comment?: unknown; ratings?: unknown };
  if (!isRecommendation(b.recommendation)) {
    return NextResponse.json(
      { error: `recommendation must be one of: ${RECOMMENDATIONS.join(", ")}` },
      { status: 400 }
    );
  }
  // ratings: optional [{ attribute: string, rating: 1..4 }]
  let ratings: { attribute: string; rating: number }[] | null = null;
  if (Array.isArray(b.ratings)) {
    ratings = b.ratings
      .filter(
        (r): r is { attribute: string; rating: number } =>
          !!r &&
          typeof (r as { attribute?: unknown }).attribute === "string" &&
          typeof (r as { rating?: unknown }).rating === "number"
      )
      .map((r) => ({
        attribute: r.attribute.slice(0, 60),
        rating: Math.max(1, Math.min(4, Math.round(r.rating))),
      }));
  }
  const comment = String(b.comment ?? "").slice(0, 2000);

  const db = getDb();
  const [u] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, auth.member.userId))
    .limit(1);

  const [card] = await db
    .insert(scorecards)
    .values({
      orgId: auth.member.orgId,
      applicationId,
      interviewerUserId: auth.member.userId,
      interviewerName: u?.name ?? auth.member.email,
      recommendation: b.recommendation,
      ratings,
      comment,
    })
    .returning({
      id: scorecards.id,
      interviewerName: scorecards.interviewerName,
      recommendation: scorecards.recommendation,
      ratings: scorecards.ratings,
      comment: scorecards.comment,
      createdAt: scorecards.createdAt,
    });

  return NextResponse.json({ scorecard: card });
}
