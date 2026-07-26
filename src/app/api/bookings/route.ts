import { NextRequest, NextResponse } from "next/server";
import { db, bookings, applicantProfiles, recruiters, jobOpenings, applications } from "@/lib/db";
import { eq, and, inArray, or } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { createBookingSchema, parseJsonBody } from "@/lib/validation";
import { getPublicBaseUrl, sendApplicationSubmittedEmail } from "@/lib/email";
import { createBookingNotification } from "@/lib/notifications";
import { logBookingAction } from "@/lib/booking-action-log";

/**
 * POST — Student applies for an interview (Mode A).
 * Creates a PENDING application. Recruiter must accept to confirm.
 *
 * Body: { recruiterId, startTime (ISO), position, cvLink?, pipaConsent }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "applicant") {
    return NextResponse.json(
      { error: "Only applicants can apply" },
      { status: 403 }
    );
  }

  const parsed = await parseJsonBody(req, createBookingSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (!body.pipaConsent) {
    return NextResponse.json(
      { error: "PIPA consent is required" },
      { status: 400 }
    );
  }

  // Fetch applicant profile
  const [profile] = await db
    .select({
      id: applicantProfiles.id,
      name: applicantProfiles.name,
      email: applicantProfiles.email,
      cvLink: applicantProfiles.cvLink,
    })
    .from(applicantProfiles)
    .where(eq(applicantProfiles.userId, session.userId));

  if (!profile) {
    return NextResponse.json(
      { error: "Applicant profile not found" },
      { status: 404 }
    );
  }

  const requestedTime = new Date(body.startTime);
  let jobOpeningId = body.jobOpeningId ?? null;

  if (jobOpeningId) {
    const [job] = await db
      .select({ id: jobOpenings.id })
      .from(jobOpenings)
      .where(
        and(
          eq(jobOpenings.id, jobOpeningId),
          eq(jobOpenings.recruiterId, body.recruiterId)
        )
      )
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: "Selected job does not belong to this recruiter." },
        { status: 400 }
      );
    }
  } else {
    const [job] = await db
      .select({ id: jobOpenings.id })
      .from(jobOpenings)
      .where(
        and(
          eq(jobOpenings.recruiterId, body.recruiterId),
          eq(jobOpenings.title, body.position)
        )
      )
      .limit(1);
    jobOpeningId = job?.id ?? null;
  }

  // Check: same student + same time + accepted/pending booking = conflict
  const activeConflicts = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.applicantEmail, profile.email),
        eq(bookings.requestedTime, requestedTime),
        inArray(bookings.status, ["pending", "accepted"])
      )
    );

  if (activeConflicts.length > 0) {
    return NextResponse.json(
      {
        error:
          "You already have a pending or confirmed interview at this time.",
      },
      { status: 409 }
    );
  }

  // Check: same student + same recruiter + same position = already applied
  const positionConditions = [
    eq(bookings.applicantEmail, profile.email),
    eq(bookings.recruiterId, body.recruiterId),
    jobOpeningId
      ? or(
          eq(bookings.jobOpeningId, jobOpeningId),
          eq(bookings.position, body.position)
        )
      : eq(bookings.position, body.position),
  ];

  const positionConflict = await db
    .select({ id: bookings.id, status: bookings.status })
    .from(bookings)
    .where(and(...positionConditions));

  const activePosConflicts = positionConflict.filter(
    (b) =>
      b.status === "pending" ||
      b.status === "accepted" ||
      b.status === "waitlisted" ||
      b.status === "reschedule_proposed"
  );

  if (activePosConflicts.length > 0) {
    return NextResponse.json(
      {
        error: `You already applied for "${body.position}" at this company.`,
      },
      { status: 409 }
    );
  }

  // Create pending application — NO slot lock yet
  const [application] = await db
    .insert(bookings)
    .values({
      direction: "applicant_books_recruiter",
      recruiterId: body.recruiterId,
      jobOpeningId,
      applicantId: profile.id,
      position: body.position,
      requestedTime,
      applicantName: profile.name,
      applicantEmail: profile.email,
      cvLink: body.cvLink?.trim() || profile.cvLink,
      pipaConsent: true,
      status: "pending",
    })
    .returning();

  await logBookingAction({
    bookingId: application.id,
    recruiterId: application.recruiterId,
    applicantId: application.applicantId,
    actorRole: "applicant",
    actorUserId: session.userId,
    actorEmail: session.email,
    action: "student_applied",
    statusBefore: null,
    statusAfter: "pending",
    requestedTime: application.requestedTime,
    proposedTime: application.proposedTime,
    metadata: {
      direction: application.direction,
      jobOpeningId: application.jobOpeningId,
      position: application.position,
    },
  });

  // ATS pipeline: mirror this application into the recruiter's kanban board at
  // stage "applied". Only when a concrete job opening was resolved (the
  // applications row requires a job); idempotent on the (job, applicant) unique
  // index so re-applying never duplicates a pipeline card.
  if (jobOpeningId) {
    await db
      .insert(applications)
      .values({
        jobOpeningId,
        applicantId: profile.id,
        recruiterId: body.recruiterId,
        stage: "applied",
      })
      .onConflictDoNothing();
  }

  const [recruiter] = await db
    .select({
      company: recruiters.company,
      contactEmail: recruiters.contactEmail,
    })
    .from(recruiters)
    .where(eq(recruiters.id, body.recruiterId))
    .limit(1);

  if (recruiter) {
    // In-app confirmation to the student (free; also pushes to their devices
    // if they've enabled push).
    createBookingNotification({
      recipientEmail: profile.email,
      recipientRole: "applicant",
      status: "pending",
      companyName: recruiter.company,
      position: body.position,
      interviewTime: requestedTime,
    }).catch(() => {});

    // Email recruiters for every new application now that email quota is no
    // longer the event-day bottleneck.
    sendApplicationSubmittedEmail({
      applicantName: profile.name,
      applicantEmail: profile.email,
      recruiterEmail: recruiter.contactEmail,
      company: recruiter.company,
      position: body.position,
      requestedTime,
      cvLink: application.cvLink,
      applicantProfileUrl: `${getPublicBaseUrl()}/applicant/${profile.id}`,
    }).catch(() => {});

    // Notify the recruiter (in-app + push), as before.
    createBookingNotification({
      recipientEmail: recruiter.contactEmail,
      recipientRole: "recruiter",
      status: "pending",
      applicantName: profile.name,
      companyName: recruiter.company,
      position: body.position,
      interviewTime: requestedTime,
    }).catch(() => {});
  }

  return NextResponse.json({
    booking: application,
    message: "Application submitted! The recruiter will review your CV and confirm.",
  });
}
