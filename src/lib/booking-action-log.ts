import { bookingActionLogs, db } from "@/lib/db";

type BookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "waitlisted"
  | "cancelled"
  | "reschedule_proposed";

type UserRole = "admin" | "recruiter" | "applicant";

type BookingActionLogParams = {
  bookingId: number;
  recruiterId?: number | null;
  applicantId?: number | null;
  actorRole: UserRole;
  actorUserId?: number | null;
  actorEmail?: string | null;
  action: string;
  statusBefore?: BookingStatus | null;
  statusAfter?: BookingStatus | null;
  requestedTime?: Date | null;
  proposedTime?: Date | null;
  metadata?: Record<string, unknown>;
};

export async function logBookingAction(params: BookingActionLogParams) {
  try {
    await db.insert(bookingActionLogs).values({
      bookingId: params.bookingId,
      recruiterId: params.recruiterId ?? null,
      applicantId: params.applicantId ?? null,
      actorRole: params.actorRole,
      actorUserId: params.actorUserId ?? null,
      actorEmail: params.actorEmail ?? null,
      action: params.action,
      statusBefore: params.statusBefore ?? null,
      statusAfter: params.statusAfter ?? null,
      requestedTime: params.requestedTime ?? null,
      proposedTime: params.proposedTime ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("Failed to log booking action event:", error);
  }
}
