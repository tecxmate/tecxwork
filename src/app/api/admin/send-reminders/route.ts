import { NextResponse } from "next/server";
import { db, bookings, recruiters, users, slots, applicantSlots } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";
import {
  sendStudentReminderEmail,
  sendRecruiterReminderEmail,
} from "@/lib/email";

/**
 * POST /api/admin/send-reminders
 * Sends reminder emails to all students and recruiters with accepted bookings.
 */
export async function POST() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all accepted bookings with slot info
  const acceptedBookings = await db
    .select({
      id: bookings.id,
      applicantName: bookings.applicantName,
      applicantEmail: bookings.applicantEmail,
      cvLink: bookings.cvLink,
      recruiterId: bookings.recruiterId,
      slotId: bookings.slotId,
      applicantSlotId: bookings.applicantSlotId,
      requestedTime: bookings.requestedTime,
    })
    .from(bookings)
    .where(eq(bookings.status, "accepted"));

  if (acceptedBookings.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "No accepted bookings to send reminders for",
      studentsSent: 0,
      recruitersSent: 0,
    });
  }

  // Get slot times for bookings that have slots
  const slotIds = acceptedBookings
    .map((b) => b.slotId)
    .filter((id): id is number => id !== null);

  const slotTimes =
    slotIds.length > 0
      ? await db
          .select({ id: slots.id, startTime: slots.startTime })
          .from(slots)
          .where(inArray(slots.id, slotIds))
      : [];

  const slotTimeMap = new Map(slotTimes.map((s) => [s.id, s.startTime]));
  const applicantSlotIds = acceptedBookings
    .map((b) => b.applicantSlotId)
    .filter((id): id is number => id !== null);

  const applicantSlotTimes =
    applicantSlotIds.length > 0
      ? await db
          .select({ id: applicantSlots.id, startTime: applicantSlots.startTime })
          .from(applicantSlots)
          .where(inArray(applicantSlots.id, applicantSlotIds))
      : [];

  const applicantSlotTimeMap = new Map(
    applicantSlotTimes.map((s) => [s.id, s.startTime])
  );

  // Get recruiter info
  const recruiterIds = [...new Set(acceptedBookings.map((b) => b.recruiterId))];
  const recruiterData = await db
    .select({
      id: recruiters.id,
      company: recruiters.company,
      contactEmail: recruiters.contactEmail,
      userId: recruiters.userId,
    })
    .from(recruiters)
    .where(inArray(recruiters.id, recruiterIds));

  const recruiterUserIds = recruiterData.map((r) => r.userId);
  const recruiterUsers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, recruiterUserIds));

  const userNameMap = new Map(recruiterUsers.map((u) => [u.id, u.name]));
  const recruiterMap = new Map(
    recruiterData.map((r) => [
      r.id,
      {
        company: r.company,
        contactEmail: r.contactEmail,
        name: userNameMap.get(r.userId) ?? "Recruiter",
      },
    ])
  );

  // Group bookings by student email
  const studentBookings = new Map<
    string,
    {
      name: string;
      interviews: Array<{ company: string; time: Date; recruiterId: number }>;
    }
  >();

  // Group bookings by recruiter
  const recruiterBookings = new Map<
    number,
    Array<{
      applicantName: string;
      applicantEmail: string;
      time: Date;
      cvLink: string;
    }>
  >();

  for (const booking of acceptedBookings) {
    const time =
      (booking.slotId && slotTimeMap.get(booking.slotId)) ||
      (booking.applicantSlotId &&
        applicantSlotTimeMap.get(booking.applicantSlotId)) ||
      (booking.requestedTime ? new Date(booking.requestedTime) : null);

    if (!time) continue;

    const rec = recruiterMap.get(booking.recruiterId);
    if (!rec) continue;

    // Add to student's schedule
    const studentData = studentBookings.get(booking.applicantEmail) ?? {
      name: booking.applicantName,
      interviews: [],
    };
    studentData.interviews.push({
      company: rec.company,
      time,
      recruiterId: booking.recruiterId,
    });
    studentBookings.set(booking.applicantEmail, studentData);

    // Add to recruiter's schedule
    const recBookings = recruiterBookings.get(booking.recruiterId) ?? [];
    recBookings.push({
      applicantName: booking.applicantName,
      applicantEmail: booking.applicantEmail,
      time,
      cvLink: booking.cvLink,
    });
    recruiterBookings.set(booking.recruiterId, recBookings);
  }

  // Send student reminders
  let studentsSent = 0;
  for (const [email, data] of studentBookings) {
    // Sort by time
    data.interviews.sort((a, b) => a.time.getTime() - b.time.getTime());
    const success = await sendStudentReminderEmail({
      name: data.name,
      email,
      interviews: data.interviews,
    });
    if (success) studentsSent++;
  }

  // Send recruiter reminders
  let recruitersSent = 0;
  for (const [recruiterId, interviews] of recruiterBookings) {
    const rec = recruiterMap.get(recruiterId);
    if (!rec) continue;

    // Sort by time
    interviews.sort((a, b) => a.time.getTime() - b.time.getTime());
    const success = await sendRecruiterReminderEmail({
      name: rec.name,
      email: rec.contactEmail,
      company: rec.company,
      interviews,
    });
    if (success) recruitersSent++;
  }

  return NextResponse.json({
    ok: true,
    studentsSent,
    recruitersSent,
    totalStudents: studentBookings.size,
    totalRecruiters: recruiterBookings.size,
  });
}
