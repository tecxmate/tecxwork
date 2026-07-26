import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { authorizeApplication, isOrgManager } from "@/lib/ats-auth";
import {
  activity,
  scorecards,
  users,
  applicantProfiles,
  talentPools,
  talentPoolMembers,
} from "@/lib/db/schema";

export async function GET(
  _req: NextRequest,
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

  const db = getDb();
  const [acts, cards] = await Promise.all([
    db
      .select({
        id: activity.id,
        type: activity.type,
        body: activity.body,
        authorName: activity.authorName,
        createdAt: activity.createdAt,
      })
      .from(activity)
      .where(eq(activity.applicationId, applicationId))
      .orderBy(asc(activity.createdAt)),
    db
      .select({
        id: scorecards.id,
        interviewerName: scorecards.interviewerName,
        recommendation: scorecards.recommendation,
        ratings: scorecards.ratings,
        comment: scorecards.comment,
        createdAt: scorecards.createdAt,
      })
      .from(scorecards)
      .where(eq(scorecards.applicationId, applicationId))
      .orderBy(asc(scorecards.createdAt)),
  ]);

  const [cand] = await db
    .select({
      consentAt: applicantProfiles.consentAt,
      consentPurpose: applicantProfiles.consentPurpose,
      retentionUntil: applicantProfiles.retentionUntil,
      anonymizedAt: applicantProfiles.anonymizedAt,
    })
    .from(applicantProfiles)
    .where(eq(applicantProfiles.id, auth.app.applicantId))
    .limit(1);

  const retentionDue = cand?.retentionUntil
    ? new Date(`${cand.retentionUntil}T00:00:00Z`).getTime() <= Date.now() + 30 * 86_400_000
    : false;

  const isManager = isOrgManager(auth.member.role);
  const pools = isManager
    ? await db
        .select({ id: talentPools.id, name: talentPools.name })
        .from(talentPoolMembers)
        .innerJoin(talentPools, eq(talentPoolMembers.poolId, talentPools.id))
        .where(
          and(
            eq(talentPoolMembers.candidateId, auth.app.applicantId),
            eq(talentPools.orgId, auth.member.orgId)
          )
        )
    : [];

  return NextResponse.json({
    activity: acts,
    scorecards: cards,
    candidate: {
      consentAt: cand?.consentAt ?? null,
      consentPurpose: cand?.consentPurpose ?? null,
      retentionUntil: cand?.retentionUntil ?? null,
      anonymizedAt: cand?.anonymizedAt ?? null,
      retentionDue,
      canErase: isManager,
      canManagePools: isManager,
      pools,
    },
  });
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
  const text = String((body as { body?: unknown })?.body ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Note body required" }, { status: 400 });
  }

  const db = getDb();
  const [u] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, auth.member.userId))
    .limit(1);

  const [note] = await db
    .insert(activity)
    .values({
      orgId: auth.member.orgId,
      applicationId,
      type: "note",
      body: text.slice(0, 2000),
      authorUserId: auth.member.userId,
      authorName: u?.name ?? auth.member.email,
    })
    .returning({
      id: activity.id,
      type: activity.type,
      body: activity.body,
      authorName: activity.authorName,
      createdAt: activity.createdAt,
    });

  return NextResponse.json({ note });
}
