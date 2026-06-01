import { bookingRescheduleLogs, db } from "@/lib/db";

type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "waitlisted"
  | "cancelled"
  | "reschedule_proposed";

type UserRole = "admin" | "recruiter" | "applicant";

type BookingRescheduleLogParams = {
  bookingId: number;
  recruiterId?: number | null;
  applicantId?: number | null;
  actorRole: UserRole;
  actorEmail?: string | null;
  action: string;
  statusBefore?: BookingStatus | null;
  statusAfter?: BookingStatus | null;
  requestedTime?: Date | null;
  proposedTime?: Date | null;
  metadata?: Record<string, unknown>;
};

export async function logBookingReschedule(
  params: BookingRescheduleLogParams
) {
  try {
    await db.insert(bookingRescheduleLogs).values({
      bookingId: params.bookingId,
      recruiterId: params.recruiterId ?? null,
      applicantId: params.applicantId ?? null,
      actorRole: params.actorRole,
      actorEmail: params.actorEmail ?? null,
      action: params.action,
      statusBefore: params.statusBefore ?? null,
      statusAfter: params.statusAfter ?? null,
      requestedTime: params.requestedTime ?? null,
      proposedTime: params.proposedTime ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("Failed to log booking reschedule event:", error);
  }
}
