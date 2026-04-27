import { Resend } from "resend";
import { EVENT_CONFIG } from "@/lib/data";
import { db, emailLogs } from "@/lib/db";

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "TECXWORK <onboarding@resend.dev>";

/**
 * Log an email send attempt for tracking purposes.
 */
async function logEmail(
  type: string,
  recipientEmail: string,
  subject: string | undefined,
  success: boolean,
  errorMessage?: string
) {
  try {
    await db.insert(emailLogs).values({
      type,
      recipientEmail,
      subject,
      success,
      errorMessage,
    });
  } catch (err) {
    console.error("Failed to log email:", err);
  }
}

type BookingEmailData = {
  applicantName: string;
  applicantEmail: string;
  recruiterName: string;
  recruiterEmail: string;
  company: string;
  slotStart: Date;
  slotEnd: Date;
  cvLink: string;
  direction: "applicant_books_recruiter" | "recruiter_books_applicant";
};

function formatTime(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: EVENT_CONFIG.timezone,
    hour12: false,
  });
}

/**
 * Send booking confirmation emails to both the applicant and recruiter.
 * Non-blocking — errors are logged but don't fail the booking.
 */
export async function sendBookingEmails(data: BookingEmailData) {
  const resend = getResend();
  if (!resend) {
    console.log("RESEND_API_KEY not set — skipping emails");
    return;
  }

  const timeStr = formatTime(data.slotStart);
  const bookedBy =
    data.direction === "applicant_books_recruiter"
      ? data.applicantName
      : data.company;

  // Email to applicant
  const applicantSubject = `Interview Confirmed — ${data.company} on ${timeStr}`;
  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: data.applicantEmail,
      subject: applicantSubject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">Interview Confirmed</h2>
          <p style="color: #666; margin: 0 0 24px; font-size: 14px;">Your interview has been scheduled for the ${EVENT_CONFIG.organizerShort} ${EVENT_CONFIG.displayYear} Career Fair.</p>

          <div style="background: #f8f6f4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #666; width: 100px;">Company</td><td style="padding: 6px 0; font-weight: 600;">${data.company}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">When</td><td style="padding: 6px 0; font-weight: 600;">${timeStr}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Where</td><td style="padding: 6px 0;">${EVENT_CONFIG.location}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Duration</td><td style="padding: 6px 0;">15 minutes</td></tr>
            </table>
          </div>

          <div style="background: #f3eeff; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px;">
            <strong style="color: #8C52FF;">Important — CV Sharing</strong>
            <p style="margin: 8px 0 0; color: #555;">
              Share your Google Drive CV <strong>only</strong> with the recruiter's email:
              <br><a href="mailto:${data.recruiterEmail}" style="color: #8C52FF;">${data.recruiterEmail}</a>
            </p>
            <p style="margin: 8px 0 0; color: #555;">Do NOT set your link to "Anyone can view".</p>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 32px;">
            ${EVENT_CONFIG.name}<br>
            Powered by <a href="https://tecxmate.com" style="color: #8C52FF; text-decoration: none; font-weight: 500;">TECXMATE.COM</a>
          </p>
        </div>
      `,
    });
    console.log("Applicant email result:", JSON.stringify(result));
    await logEmail("booking_confirmation", data.applicantEmail, applicantSubject, true);
  } catch (err) {
    console.error("Failed to send applicant email:", err);
    await logEmail("booking_confirmation", data.applicantEmail, applicantSubject, false, String(err));
  }

  // Email to recruiter
  const recruiterSubject = `New Interview Booking — ${data.applicantName}`;
  try {
    const result2 = await resend.emails.send({
      from: EMAIL_FROM,
      to: data.recruiterEmail,
      subject: recruiterSubject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">New Interview Booking</h2>
          <p style="color: #666; margin: 0 0 24px; font-size: 14px;">A candidate has been booked for an interview at the ${EVENT_CONFIG.organizerShort} ${EVENT_CONFIG.displayYear} Career Fair.</p>

          <div style="background: #f8f6f4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #666; width: 100px;">Candidate</td><td style="padding: 6px 0; font-weight: 600;">${data.applicantName}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0;"><a href="mailto:${data.applicantEmail}" style="color: #8C52FF;">${data.applicantEmail}</a></td></tr>
              <tr><td style="padding: 6px 0; color: #666;">When</td><td style="padding: 6px 0; font-weight: 600;">${timeStr}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Booked by</td><td style="padding: 6px 0;">${bookedBy}</td></tr>
            </table>
          </div>

          <div style="margin-bottom: 24px;">
            <a href="${data.cvLink}" target="_blank" style="display: inline-block; background: #8C52FF; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
              View Candidate's CV
            </a>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 32px;">
            ${EVENT_CONFIG.name}<br>
            Powered by <a href="https://tecxmate.com" style="color: #8C52FF; text-decoration: none; font-weight: 500;">TECXMATE.COM</a>
          </p>
        </div>
      `,
    });
    console.log("Recruiter email result:", JSON.stringify(result2));
    await logEmail("booking_notification", data.recruiterEmail, recruiterSubject, true);
  } catch (err) {
    console.error("Failed to send recruiter email:", err);
    await logEmail("booking_notification", data.recruiterEmail, recruiterSubject, false, String(err));
  }
}

type RejectionEmailData = {
  applicantName: string;
  applicantEmail: string;
  company: string;
  recruiterNote?: string;
  action: "rejected" | "cancelled";
};

/**
 * Send rejection/cancellation email to applicant with optional recruiter note.
 */
export async function sendRejectionEmail(data: RejectionEmailData) {
  const resend = getResend();
  if (!resend) {
    console.log("RESEND_API_KEY not set — skipping rejection email");
    return;
  }

  const actionText = data.action === "rejected" ? "declined" : "cancelled";
  const subject = `Interview ${actionText} — ${data.company}`;

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: data.applicantEmail,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">Interview ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}</h2>
          <p style="color: #666; margin: 0 0 24px; font-size: 14px;">
            Your interview request with <strong>${data.company}</strong> has been ${actionText}.
          </p>

          ${data.recruiterNote ? `
          <div style="background: #f8f6f4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Message from the recruiter</p>
            <p style="margin: 0; font-size: 14px; color: #333; white-space: pre-wrap;">${data.recruiterNote}</p>
          </div>
          ` : ''}

          <p style="font-size: 14px; color: #666; margin-bottom: 24px;">
            Don't be discouraged — there are many other companies participating in the career fair.
            Visit the platform to explore other opportunities.
          </p>

          <div style="margin-bottom: 24px;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://tecxwork.com"}/browse" target="_blank" style="display: inline-block; background: #8C52FF; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
              Browse Other Companies
            </a>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 32px;">
            ${EVENT_CONFIG.name}<br>
            Powered by <a href="https://tecxmate.com" style="color: #8C52FF; text-decoration: none; font-weight: 500;">TECXMATE.COM</a>
          </p>
        </div>
      `,
    });
    console.log("Rejection email result:", JSON.stringify(result));
    await logEmail(data.action, data.applicantEmail, subject, true);
  } catch (err) {
    console.error("Failed to send rejection email:", err);
    await logEmail(data.action, data.applicantEmail, subject, false, String(err));
  }
}
