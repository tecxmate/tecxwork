import { NextRequest, NextResponse } from "next/server";
import { eq, isNotNull, notInArray } from "drizzle-orm";

import { db, recruiters } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { invalidateRecruitersCache } from "@/lib/cache";

/**
 * PUT — Replace the full pinned-company ordering.
 *
 * Body: { order: number[] } — recruiter IDs in display order (index 0 = top).
 * Any recruiter not in the list is unpinned. The whole set is rewritten in one
 * transaction so the directory can never see a half-applied reorder.
 */
export async function PUT(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const order = body?.order;
  if (
    !Array.isArray(order) ||
    !order.every((id) => Number.isInteger(id))
  ) {
    return NextResponse.json(
      { error: "order must be an array of recruiter ids" },
      { status: 400 }
    );
  }

  const ids = order as number[];
  if (new Set(ids).size !== ids.length) {
    return NextResponse.json(
      { error: "order contains duplicate ids" },
      { status: 400 }
    );
  }

  await db.transaction(async (tx) => {
    // Clear pins on anything no longer in the list (or all, if list is empty).
    if (ids.length === 0) {
      await tx
        .update(recruiters)
        .set({ pinnedRank: null })
        .where(isNotNull(recruiters.pinnedRank));
      return;
    }

    await tx
      .update(recruiters)
      .set({ pinnedRank: null })
      .where(notInArray(recruiters.id, ids));

    // Assign dense 0-based ranks following the requested order. One typed
    // UPDATE per id — avoids an all-parameter SQL CASE whose result type
    // Postgres can't infer. The pinned set is small (sponsors), so this is fine.
    for (let index = 0; index < ids.length; index += 1) {
      await tx
        .update(recruiters)
        .set({ pinnedRank: index })
        .where(eq(recruiters.id, ids[index]));
    }
  });

  await invalidateRecruitersCache();

  return NextResponse.json({ ok: true, order: ids });
}
