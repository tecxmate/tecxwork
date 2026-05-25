import { Resend } from "resend";
import { EVENT_CONFIG } from "@/lib/data";
import { getEventBranding } from "@/lib/event-branding";
import { db, emailLogs } from "@/lib/db";

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "TECXWORK <onboarding@resend.dev>";

export function getPublicBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "https://tecxwork.com"
  ).replace(/\/+$/, "");
}

/**
 * Escape user-supplied strings before interpolating them into HTML email
 * templates. Email clients won't run JS, but unescaped HTML enables tag/link
 * injection (phishing) — e.g. a recruiter "note" closing the surrounding
 * <p> and inserting a fake CTA.
 */
function escapeHtml(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Only return URLs we'd safely place in href attributes. Rejects javascript:,
 * data:, vbscript:, etc. by requiring http(s) or mailto. Falls back to "#".
 */
function safeUrl(value: string | null | undefined): string {
  if (!value) return "#";
  const trimmed = String(value).trim();
  if (!/^(https?:|mailto:)/i.test(trimmed)) return "#";
  return escapeHtml(trimmed);
}

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

type ApplicationSubmittedEmailData = {
  applicantName: string;
  applicantEmail: string;
  recruiterEmail: string;
  company: string;
  position: string;
  requestedTime: Date;
  cvLink: string;
  applicantProfileUrl: string;
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
 * Notify the recruiter as soon as a student submits an application.
 * Non-blocking — errors are logged but don't fail the application.
 */
export async function sendApplicationSubmittedEmail(
  data: ApplicationSubmittedEmailData
) {
  const resend = getResend();
  const subject = `New Application — ${data.applicantName} for ${data.position}`;

  if (!resend) {
    console.log("RESEND_API_KEY not set — skipping application email");
    return;
  }

  const branding = await getEventBranding();
  const timeStr = formatTime(data.requestedTime);
  const safeApplicantName = escapeHtml(data.applicantName);
  const safeApplicantEmail = escapeHtml(data.applicantEmail);
  const safeCompany = escapeHtml(data.company);
  const safePosition = escapeHtml(data.position);
  const safeCvHref = safeUrl(data.cvLink);
  const safeProfileHref = safeUrl(data.applicantProfileUrl);

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: data.recruiterEmail,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">New Application Submitted</h2>
          <p style="color: #666; margin: 0 0 24px; font-size: 14px;">
            A student submitted an application to <strong>${safeCompany}</strong> for the ${branding.emailEventName}. Review it in your recruiter dashboard to accept, waitlist, or decline.
          </p>

          <div style="background: #f8f6f4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #666; width: 120px;">Candidate</td><td style="padding: 6px 0; font-weight: 600;">${safeApplicantName}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0;"><a href="mailto:${safeApplicantEmail}" style="color: #8C52FF;">${safeApplicantEmail}</a></td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Position</td><td style="padding: 6px 0; font-weight: 600;">${safePosition}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Requested time</td><td style="padding: 6px 0; font-weight: 600;">${timeStr}</td></tr>
            </table>
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px;">
            <a href="${safeProfileHref}" target="_blank" style="display: inline-block; background: #8C52FF; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
              View Applicant Profile
            </a>
            <a href="${safeCvHref}" target="_blank" style="display: inline-block; background: #f3eeff; color: #6D35D0; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
              View CV
            </a>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 32px;">
            ${branding.name}<br>
            Powered by <a href="https://work.tecxmate.com" style="color: #8C52FF; text-decoration: none; font-weight: 500;">TECXWORK</a>
          </p>
        </div>
      `,
    });
    console.log("Application submitted email result:", JSON.stringify(result));
    await logEmail("application_submitted", data.recruiterEmail, subject, true);
  } catch (err) {
    console.error("Failed to send application submitted email:", err);
    await logEmail("application_submitted", data.recruiterEmail, subject, false, String(err));
  }
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

  const branding = await getEventBranding();
  const timeStr = formatTime(data.slotStart);
  const bookedBy =
    data.direction === "applicant_books_recruiter"
      ? data.applicantName
      : data.company;

  const safeApplicantName = escapeHtml(data.applicantName);
  const safeCompany = escapeHtml(data.company);
  const safeRecruiterEmail = escapeHtml(data.recruiterEmail);
  const safeApplicantEmail = escapeHtml(data.applicantEmail);
  const safeBookedBy = escapeHtml(bookedBy);
  const safeCvHref = safeUrl(data.cvLink);

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
          <p style="color: #666; margin: 0 0 24px; font-size: 14px;">Your interview has been scheduled for the ${branding.emailEventName}.</p>

          <div style="background: #f8f6f4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #666; width: 100px;">Company</td><td style="padding: 6px 0; font-weight: 600;">${safeCompany}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">When</td><td style="padding: 6px 0; font-weight: 600;">${timeStr}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Where</td><td style="padding: 6px 0;">${branding.location}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Duration</td><td style="padding: 6px 0;">15 minutes</td></tr>
            </table>
          </div>

          <div style="background: #f3eeff; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px;">
            <strong style="color: #8C52FF;">Important — CV Sharing</strong>
            <p style="margin: 8px 0 0; color: #555;">
              Remember to set your Google Drive CV link sharing to <strong>"Anyone with the link can view"</strong> so the recruiter can open it.
            </p>
            <p style="margin: 8px 0 0; color: #555;">
              Recruiter's email: <a href="mailto:${safeRecruiterEmail}" style="color: #8C52FF;">${safeRecruiterEmail}</a>
            </p>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 32px;">
            ${branding.name}<br>
            Powered by <a href="https://work.tecxmate.com" style="color: #8C52FF; text-decoration: none; font-weight: 500;">TECXWORK</a>
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
          <p style="color: #666; margin: 0 0 24px; font-size: 14px;">A candidate has been booked for an interview at the ${branding.emailEventName}.</p>

          <div style="background: #f8f6f4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #666; width: 100px;">Candidate</td><td style="padding: 6px 0; font-weight: 600;">${safeApplicantName}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0;"><a href="mailto:${safeApplicantEmail}" style="color: #8C52FF;">${safeApplicantEmail}</a></td></tr>
              <tr><td style="padding: 6px 0; color: #666;">When</td><td style="padding: 6px 0; font-weight: 600;">${timeStr}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Booked by</td><td style="padding: 6px 0;">${safeBookedBy}</td></tr>
            </table>
          </div>

          <div style="margin-bottom: 24px;">
            <a href="${safeCvHref}" target="_blank" style="display: inline-block; background: #8C52FF; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
              View Candidate's CV
            </a>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 32px;">
            ${branding.name}<br>
            Powered by <a href="https://work.tecxmate.com" style="color: #8C52FF; text-decoration: none; font-weight: 500;">TECXWORK</a>
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

type WaitlistEmailData = {
  applicantName: string;
  applicantEmail: string;
  company: string;
  position?: string;
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

  const branding = await getEventBranding();
  const actionText = data.action === "rejected" ? "declined" : "cancelled";
  const subject = `Interview ${actionText} — ${data.company}`;
  const safeCompany = escapeHtml(data.company);
  const safeNote = data.recruiterNote ? escapeHtml(data.recruiterNote) : "";

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: data.applicantEmail,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">Interview ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}</h2>
          <p style="color: #666; margin: 0 0 24px; font-size: 14px;">
            Your interview request with <strong>${safeCompany}</strong> has been ${actionText}.
          </p>

          ${safeNote ? `
          <div style="background: #f8f6f4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Message from the recruiter</p>
            <p style="margin: 0; font-size: 14px; color: #333; white-space: pre-wrap;">${safeNote}</p>
          </div>
          ` : ''}

          <p style="font-size: 14px; color: #666; margin-bottom: 24px;">
            Don't be discouraged — there are many other companies participating in the career fair.
            Visit the platform to explore other opportunities.
          </p>

          <div style="margin-bottom: 24px;">
            <a href="${getPublicBaseUrl()}/browse" target="_blank" style="display: inline-block; background: #8C52FF; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
              Browse Other Companies
            </a>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 32px;">
            ${branding.name}<br>
            Powered by <a href="https://work.tecxmate.com" style="color: #8C52FF; text-decoration: none; font-weight: 500;">TECXWORK</a>
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

/**
 * Send waitlist email to applicant.
 */
export async function sendWaitlistEmail(data: WaitlistEmailData) {
  const resend = getResend();
  if (!resend) {
    console.log("RESEND_API_KEY not set — skipping waitlist email");
    return;
  }

  const branding = await getEventBranding();
  const subject = `Application waitlisted — ${data.company}`;
  const safeApplicantName = escapeHtml(data.applicantName);
  const safeCompany = escapeHtml(data.company);
  const safePosition = data.position ? escapeHtml(data.position) : "";

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: data.applicantEmail,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">Application Waitlisted</h2>
          <p style="color: #666; margin: 0 0 24px; font-size: 14px;">
            Hi ${safeApplicantName}, your application with <strong>${safeCompany}</strong>${safePosition ? ` for <strong>${safePosition}</strong>` : ""} has been added to the waitlist.
          </p>

          <div style="background: #f3eeff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #4c1d95;">
              If an interview slot becomes available, the recruiter may review and confirm your booking.
              You can continue browsing other companies while waiting.
            </p>
          </div>

          <div style="margin-bottom: 24px;">
            <a href="${getPublicBaseUrl()}/browse" target="_blank" style="display: inline-block; background: #8C52FF; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
              Browse Other Companies
            </a>
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 32px;">
            ${branding.name}<br>
            Powered by <a href="https://work.tecxmate.com" style="color: #8C52FF; text-decoration: none; font-weight: 500;">TECXWORK</a>
          </p>
        </div>
      `,
    });
    console.log("Waitlist email result:", JSON.stringify(result));
    await logEmail("waitlisted", data.applicantEmail, subject, true);
  } catch (err) {
    console.error("Failed to send waitlist email:", err);
    await logEmail("waitlisted", data.applicantEmail, subject, false, String(err));
  }
}

type StudentReminderData = {
  name: string;
  email: string;
  interviews: Array<{
    company: string;
    time: Date;
    recruiterEmail: string;
  }>;
};

/**
 * Send interview reminder email to a student with their schedule.
 */
export async function sendStudentReminderEmail(data: StudentReminderData) {
  const resend = getResend();
  if (!resend) {
    console.log("RESEND_API_KEY not set — skipping student reminder email");
    return false;
  }

  const branding = await getEventBranding();
  const subject = `Interview Reminder — ${branding.displayDate}`;
  const interviewRows = data.interviews
    .map((i) => {
      const timeStr = i.time.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: EVENT_CONFIG.timezone,
      });
      return `<tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-weight: 600;">${escapeHtml(i.company)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">${timeStr}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(i.recruiterEmail)}" style="color: #8C52FF;">${escapeHtml(i.recruiterEmail)}</a></td>
      </tr>`;
    })
    .join("");

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: data.email,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">Interview Reminder</h2>
          <p style="color: #666; margin: 0 0 24px; font-size: 14px;">
            Hi ${escapeHtml(data.name)}, here's your interview schedule for the ${branding.emailEventName} on <strong>${branding.displayDate}</strong>.
          </p>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f8f6f4;">
                <th style="padding: 10px 12px; text-align: left; font-weight: 600;">Company</th>
                <th style="padding: 10px 12px; text-align: left; font-weight: 600;">Time</th>
                <th style="padding: 10px 12px; text-align: left; font-weight: 600;">Contact</th>
              </tr>
            </thead>
            <tbody>
              ${interviewRows}
            </tbody>
          </table>

          <div style="background: #f3eeff; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px;">
            <strong style="color: #8C52FF;">Reminders</strong>
            <ul style="margin: 8px 0 0; padding-left: 18px; color: #555;">
              <li>Arrive 10 minutes early</li>
              <li>Bring your student ID</li>
              <li>Set your Google Drive CV link to "Anyone with the link can view" so the recruiter can open it</li>
            </ul>
          </div>

          <p style="font-size: 14px; color: #666;">
            Location: <strong>${branding.location}</strong>
          </p>

          <p style="font-size: 12px; color: #999; margin-top: 32px;">
            ${branding.name}<br>
            Powered by <a href="https://work.tecxmate.com" style="color: #8C52FF; text-decoration: none; font-weight: 500;">TECXWORK</a>
          </p>
        </div>
      `,
    });
    await logEmail("student_reminder", data.email, subject, true);
    return true;
  } catch (err) {
    console.error("Failed to send student reminder email:", err);
    await logEmail("student_reminder", data.email, subject, false, String(err));
    return false;
  }
}

type RecruiterReminderData = {
  name: string;
  email: string;
  company: string;
  interviews: Array<{
    applicantName: string;
    applicantEmail: string;
    time: Date;
    cvLink: string;
  }>;
};

/**
 * Send interview reminder email to a recruiter with their schedule.
 */
export async function sendRecruiterReminderEmail(data: RecruiterReminderData) {
  const resend = getResend();
  if (!resend) {
    console.log("RESEND_API_KEY not set — skipping recruiter reminder email");
    return false;
  }

  const branding = await getEventBranding();
  const subject = `Interview Schedule — ${data.interviews.length} interviews on ${branding.displayDate}`;
  const interviewRows = data.interviews
    .map((i) => {
      const timeStr = i.time.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: EVENT_CONFIG.timezone,
      });
      return `<tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">${timeStr}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-weight: 600;">${escapeHtml(i.applicantName)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(i.applicantEmail)}" style="color: #8C52FF;">${escapeHtml(i.applicantEmail)}</a></td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee;"><a href="${safeUrl(i.cvLink)}" target="_blank" style="color: #8C52FF;">View CV</a></td>
      </tr>`;
    })
    .join("");

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: data.email,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; padding: 32px 20px;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">Interview Schedule</h2>
          <p style="color: #666; margin: 0 0 24px; font-size: 14px;">
            Hi ${escapeHtml(data.name)}, here's your interview schedule for <strong>${escapeHtml(data.company)}</strong> at the ${branding.emailEventName} on <strong>${branding.displayDate}</strong>.
          </p>

          <div style="background: #30D158; color: white; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 16px; font-weight: 600;">
            ${data.interviews.length} interview${data.interviews.length > 1 ? "s" : ""} scheduled
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f8f6f4;">
                <th style="padding: 10px 12px; text-align: left; font-weight: 600;">Time</th>
                <th style="padding: 10px 12px; text-align: left; font-weight: 600;">Candidate</th>
                <th style="padding: 10px 12px; text-align: left; font-weight: 600;">Email</th>
                <th style="padding: 10px 12px; text-align: left; font-weight: 600;">CV</th>
              </tr>
            </thead>
            <tbody>
              ${interviewRows}
            </tbody>
          </table>

          <p style="font-size: 14px; color: #666;">
            Location: <strong>${branding.location}</strong>
          </p>

          <p style="font-size: 12px; color: #999; margin-top: 32px;">
            ${branding.name}<br>
            Powered by <a href="https://work.tecxmate.com" style="color: #8C52FF; text-decoration: none; font-weight: 500;">TECXWORK</a>
          </p>
        </div>
      `,
    });
    await logEmail("recruiter_reminder", data.email, subject, true);
    return true;
  } catch (err) {
    console.error("Failed to send recruiter reminder email:", err);
    await logEmail("recruiter_reminder", data.email, subject, false, String(err));
    return false;
  }
}
