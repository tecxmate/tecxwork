import { db, notifications } from "@/lib/db";
import { sendPushNotification } from "@/lib/web-push";

type NotificationType =
  | "booking_pending"
  | "booking_accepted"
  | "booking_rejected"
  | "booking_waitlisted"
  | "booking_cancelled"
  | "booking_reschedule_proposed"
  | "interview_reminder"
  | "system";

type RecipientRole = "admin" | "recruiter" | "applicant";
type TimeInput = Date | string;

type CreateNotificationParams = {
  recipientEmail: string;
  recipientRole: RecipientRole;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification(params: CreateNotificationParams) {
  const pushUrl =
    typeof params.metadata?.url === "string" ? params.metadata.url : "/";

  const [notification] = await db
    .insert(notifications)
    .values({
      recipientEmail: params.recipientEmail,
      recipientRole: params.recipientRole,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata ?? {},
    })
    .returning();

  sendPushNotification(params.recipientEmail, {
    title: params.title,
    message: params.message,
    url: pushUrl,
  }).catch(() => {});

  return notification;
}

export async function createBookingNotification(params: {
  recipientEmail: string;
  recipientRole: RecipientRole;
  status: "pending" | "accepted" | "rejected" | "waitlisted" | "cancelled" | "reschedule_proposed";
  companyName?: string;
  applicantName?: string;
  position?: string;
  interviewTime?: TimeInput;
  note?: string;
  bookingId?: number;
  recruiterId?: number;
  actionUrl?: string;
}) {
  const { recipientRole, status, companyName, applicantName, position, interviewTime, note } = params;
  const interviewDate = interviewTime
    ? interviewTime instanceof Date
      ? interviewTime
      : new Date(interviewTime)
    : null;
  const hasValidInterviewDate =
    interviewDate !== null && !Number.isNaN(interviewDate.getTime());

  const typeMap: Record<string, NotificationType> = {
    pending: "booking_pending",
    accepted: "booking_accepted",
    rejected: "booking_rejected",
    waitlisted: "booking_waitlisted",
    cancelled: "booking_cancelled",
    reschedule_proposed: "booking_reschedule_proposed",
  };

  let title: string;
  let message: string;

  if (recipientRole === "applicant") {
    const timeStr = hasValidInterviewDate
      ? interviewDate.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Taipei",
        })
      : "";

    switch (status) {
      case "pending":
        title = "Application Submitted";
        message = `Your application to ${companyName} for ${position} is pending review.`;
        break;
      case "accepted":
        title = "Interview Confirmed!";
        message = `Your interview with ${companyName} for ${position} is confirmed at ${timeStr}.`;
        break;
      case "rejected":
        title = "Application Declined";
        message = `Your application to ${companyName} for ${position} was not accepted.${note ? ` Note: ${note}` : ""}`;
        break;
      case "waitlisted":
        title = "Application Waitlisted";
        message = `You've been waitlisted for ${companyName} - ${position}. We'll notify you if a slot opens.`;
        break;
      case "cancelled":
        title = "Interview Cancelled";
        message = `Your interview with ${companyName} for ${position} has been cancelled.${note ? ` Note: ${note}` : ""}`;
        break;
      case "reschedule_proposed":
        title = "New Time Proposed";
        message = `${companyName} suggested a new interview time${timeStr ? `: ${timeStr}` : ""}. Accept or decline in the app.${note ? ` Note: ${note}` : ""}`;
        break;
      default:
        title = "Booking Update";
        message = `Your booking status has been updated.`;
    }
  } else {
    switch (status) {
      case "pending":
        title = "New Application";
        message = `${applicantName} applied for ${position}.`;
        break;
      case "accepted":
        title = "Interview Scheduled";
        message = `Interview with ${applicantName} for ${position} confirmed.`;
        break;
      default:
        title = "Booking Update";
        message = `Booking with ${applicantName} updated.`;
    }
  }

  return createNotification({
    recipientEmail: params.recipientEmail,
    recipientRole: params.recipientRole,
    type: typeMap[status],
    title,
    message,
    metadata: {
      companyName,
      applicantName,
      position,
      interviewTime: hasValidInterviewDate
        ? interviewDate.toISOString()
        : undefined,
      note,
      bookingId: params.bookingId,
      recruiterId: params.recruiterId,
      url: params.actionUrl,
    },
  });
}
