import { NextRequest, NextResponse } from "next/server";
import { db, bookings, notifications, recruiters } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq, and, desc, inArray, count } from "drizzle-orm";

function asMetadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50);

  const conditions = [eq(notifications.recipientEmail, session.email)];
  if (unreadOnly) {
    conditions.push(eq(notifications.read, false));
  }

  const result = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  const [unread] = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientEmail, session.email),
        eq(notifications.read, false)
      )
    );

  let enrichedResult = result;
  if (
    session.role === "applicant" &&
    result.some((n) => n.type === "booking_reschedule_proposed")
  ) {
    const proposals = await db
      .select({
        id: bookings.id,
        recruiterId: bookings.recruiterId,
        position: bookings.position,
        proposedTime: bookings.proposedTime,
        company: recruiters.company,
      })
      .from(bookings)
      .innerJoin(recruiters, eq(bookings.recruiterId, recruiters.id))
      .where(
        and(
          eq(bookings.applicantEmail, session.email),
          eq(bookings.status, "reschedule_proposed")
        )
      );

    enrichedResult = result.map((notification) => {
      if (notification.type !== "booking_reschedule_proposed") {
        return notification;
      }

      const metadata = asMetadataRecord(notification.metadata);
      if (typeof metadata.url === "string") {
        return notification;
      }

      const matchingProposal =
        proposals.find((proposal) => {
          const metadataTime =
            typeof metadata.interviewTime === "string"
              ? metadata.interviewTime
              : "";
          const proposalTime = proposal.proposedTime?.toISOString() ?? "";
          return (
            proposal.company === metadata.companyName &&
            proposal.position === metadata.position &&
            proposalTime === metadataTime
          );
        }) ?? (proposals.length === 1 ? proposals[0] : null);

      if (!matchingProposal) {
        return notification;
      }

      return {
        ...notification,
        metadata: {
          ...metadata,
          bookingId: matchingProposal.id,
          recruiterId: matchingProposal.recruiterId,
          url: `/recruiter/${matchingProposal.recruiterId}?proposal=${matchingProposal.id}`,
        },
      };
    });
  }

  return NextResponse.json({
    notifications: enrichedResult,
    unreadCount: unread?.value ?? 0,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { notificationIds, markAllRead } = body;

  if (markAllRead) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.recipientEmail, session.email));

    return NextResponse.json({ ok: true });
  }

  if (Array.isArray(notificationIds) && notificationIds.length > 0) {
    const ids = notificationIds.filter((v): v is number => typeof v === "number");
    if (ids.length > 0) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            inArray(notifications.id, ids),
            eq(notifications.recipientEmail, session.email)
          )
        );
    }
  }

  return NextResponse.json({ ok: true });
}
