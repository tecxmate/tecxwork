import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getMember, isOrgManager } from "@/lib/ats-auth";
import { talentPools, talentPoolMembers } from "@/lib/db/schema";

// Agency talent pools (hotlists) — manager-only.
export async function GET() {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isOrgManager(member.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDb();
  const [poolRows, memberRows] = await Promise.all([
    db
      .select({ id: talentPools.id, name: talentPools.name, description: talentPools.description })
      .from(talentPools)
      .where(eq(talentPools.orgId, member.orgId))
      .orderBy(talentPools.name),
    db
      .select({ poolId: talentPoolMembers.poolId })
      .from(talentPoolMembers)
      .innerJoin(talentPools, eq(talentPoolMembers.poolId, talentPools.id))
      .where(eq(talentPools.orgId, member.orgId)),
  ]);

  const counts = new Map<number, number>();
  for (const m of memberRows) counts.set(m.poolId, (counts.get(m.poolId) ?? 0) + 1);

  return NextResponse.json({
    pools: poolRows.map((p) => ({ ...p, memberCount: counts.get(p.id) ?? 0 })),
  });
}

export async function POST(req: NextRequest) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isOrgManager(member.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = String((body as { name?: unknown })?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const db = getDb();
  const [pool] = await db
    .insert(talentPools)
    .values({ orgId: member.orgId, name: name.slice(0, 80), createdByUserId: member.userId })
    .returning({ id: talentPools.id, name: talentPools.name, description: talentPools.description });

  return NextResponse.json({ pool: { ...pool, memberCount: 0 } });
}
