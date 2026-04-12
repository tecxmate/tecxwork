import { Resend } from "resend";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM ?? "V-GEN <noreply@resend.dev>";

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
    timeZone: "Asia/Taipei",
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
  try {
    await resend.emails.send({
      from: FROM,
      to: data.applicantEmail,
      subject: `Interview Confirmed — ${data.company} on ${timeStr}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">Interview Confirmed</h2>
          <p style="color: #666; margin: 0 0 24px; font-size: 14px;">Your interview has been scheduled for the VSATW 2026 Career Fair.</p>

          <div style="background: #f8f6f4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #666; width: 100px;">Company</td><td style="padding: 6px 0; font-weight: 600;">${data.company}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">When</td><td style="padding: 6px 0; font-weight: 600;">${timeStr}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Where</td><td style="padding: 6px 0;">NTUT (Taipei Tech), Taipei</td></tr>
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
            VSATW 2026 — V-GEN TRIDENT<br>
            Designed & developed by <a href="https://tecxmate.com" style="color: #8C52FF;">TECXMATE.COM</a>
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send applicant email:", err);
  }

  // Email to recruiter
  try {
    await resend.emails.send({
      from: FROM,
      to: data.recruiterEmail,
      subject: `New Interview Booking — ${data.applicantName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">New Interview Booking</h2>
          <p style="color: #666; margin: 0 0 24px; font-size: 14px;">A candidate has been booked for an interview at the VSATW 2026 Career Fair.</p>

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
            VSATW 2026 — V-GEN TRIDENT<br>
            Designed & developed by <a href="https://tecxmate.com" style="color: #8C52FF;">TECXMATE.COM</a>
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send recruiter email:", err);
  }
}
