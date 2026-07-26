import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { authorizeApplication, isOrgManager } from "@/lib/ats-auth";
import { talentPools, talentPoolMembers } from "@/lib/db/schema";

async function resolve(applicationId: number, poolId: number) {
  const auth = await authorizeApplication(applicationId);
  if ("error" in auth) return { error: auth.error, status: auth.status };
  if (!isOrgManager(auth.member.role))
    return { error: "Forbidden", status: 403 as const };

  const db = getDb();
  const [pool] = await db
    .select({ id: talentPools.id, name: talentPools.name, orgId: talentPools.orgId })
    .from(talentPools)
    .where(eq(talentPools.id, poolId))
    .limit(1);
  if (!pool || pool.orgId !== auth.member.orgId)
    return { error: "Invalid pool", status: 400 as const };
  return { auth, pool, db };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const applicationId = Number(id);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const poolId = Number((body as { poolId?: unknown })?.poolId);
  if (!Number.isInteger(applicationId) || !Number.isInteger(poolId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const r = await resolve(applicationId, poolId);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  await r.db
    .insert(talentPoolMembers)
    .values({
      poolId: r.pool.id,
      candidateId: r.auth.app.applicantId,
      addedByUserId: r.auth.member.userId,
    })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true, pool: { id: r.pool.id, name: r.pool.name } });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const applicationId = Number(id);
  const poolId = Number(new URL(req.url).searchParams.get("poolId"));
  if (!Number.isInteger(applicationId) || !Number.isInteger(poolId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const r = await resolve(applicationId, poolId);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  await r.db
    .delete(talentPoolMembers)
    .where(
      and(
        eq(talentPoolMembers.poolId, r.pool.id),
        eq(talentPoolMembers.candidateId, r.auth.app.applicantId)
      )
    );

  return NextResponse.json({ ok: true });
}
