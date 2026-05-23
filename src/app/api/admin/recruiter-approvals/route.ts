import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getAdminSession } from "@/lib/auth";
import { db, recruiterEmailApprovals } from "@/lib/db";

export async function DELETE(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await db
    .delete(recruiterEmailApprovals)
    .where(eq(recruiterEmailApprovals.id, parseInt(id)));

  return NextResponse.json({ ok: true });
}
