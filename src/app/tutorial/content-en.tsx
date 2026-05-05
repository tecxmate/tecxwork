import { EVENT_CONFIG } from "@/lib/data";

export const tutorialUiEn = {
  pageTitle: "Platform Tutorials",
  pageSubtitle: (admin: boolean) =>
    admin
      ? "Guides on how to use TECXWORK as a Student, Recruiter, or Admin."
      : "Guides on how to use TECXWORK as a Student or Recruiter.",
  studentTab: "Student Guide",
  recruiterTab: "Recruiter Guide",
  adminTab: "Admin Guide",
};

export function StudentSectionEn() {
  return (
    <section id="student-guide" className="scroll-mt-8">
      <h2 className="text-2xl font-bold border-b pb-2 mb-6">Student Guide</h2>
      <div className="space-y-6 text-sm leading-relaxed">
        <div>
          <h3 className="text-xl font-semibold mb-2">Overview</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Browse</strong> participating companies and their open positions</li>
            <li><strong>Apply</strong> for an interview at a chosen time — recruiters review your CV and confirm</li>
            <li><strong>Manage</strong> your own profile (skills, school, work experience, certifications, CV, photo)</li>
            <li><strong>Get notified</strong> in-app and via email when a recruiter accepts, rejects, or waitlists you</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Getting Started</h3>

          <h4 className="font-semibold mt-4 mb-2">1. Verify Your Email</h4>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>Go to the TECXWORK website</li>
            <li>Click <strong>&quot;Get Started&quot;</strong> → <strong>&quot;I&apos;m a Student&quot;</strong> → <strong>&quot;Sign Up&quot;</strong></li>
            <li>Enter your email — we&apos;ll send a 6-digit code (valid for 10 minutes)</li>
            <li>Enter the code to confirm you own that email address</li>
          </ol>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            Didn&apos;t get the code? Check spam, or click <em>Resend</em>. You can request up to 5 codes per hour.
          </div>

          <h4 className="font-semibold mt-4 mb-2">2. Complete Your Profile</h4>
          <p className="mb-2">After verifying your email, fill in your profile. The form auto-saves to your browser so you can come back if interrupted. Required fields depend on the event mode (admin sets this):</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Always required</strong>: full name, password (8+ characters), CV link (Google Drive), PIPA consent</li>
            <li><strong>Required in &quot;full&quot; mode</strong>: school (with Taiwan school auto-complete), major, study level, expected graduation</li>
            <li><strong>Optional but recommended</strong>: phone, nationality, study year, job-seeking status, work authorization, skills, preferred cities, preferred industries, LinkedIn / portfolio URLs, work experiences, certifications, brief description, profile photo</li>
          </ul>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            <strong>Tip:</strong> A complete profile shows higher in recruiter search results and gives them more reason to invite you.
          </div>

          <h4 className="font-semibold mt-4 mb-2">3. You&apos;re In</h4>
          <p>After submitting, you&apos;re logged in automatically and redirected to the <strong>Company Directory</strong> (browse page).</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Browsing &amp; Applying</h3>

          <h4 className="font-semibold mt-4 mb-2">Finding Companies and Jobs</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Companies</strong> — recruiters who registered for the event and their open positions</li>
            <li>Search bar filters by company, position, or job title</li>
            <li>Industry filter chips narrow the company list</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">Applying for an Interview</h4>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>Open a recruiter&apos;s page and read about the company, photos, and open jobs</li>
            <li>Pick the job you&apos;re interested in</li>
            <li>Use the date arrows to find the event day ({EVENT_CONFIG.displayDate}) and pick an available time slot</li>
            <li>Confirm your CV link is correct (you can override it for this specific application)</li>
            <li>Tick Personal Data Protection Act (PIPA) consent and click <strong>Apply</strong></li>
          </ol>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            Applying does <em>not</em> immediately reserve the slot. The recruiter has to review your CV and click &quot;Accept&quot; — at which point an interviewer slot is locked atomically and you both get a confirmation email.
          </div>

          <h4 className="font-semibold mt-4 mb-2">After You Apply</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Status starts as <strong>Pending</strong>. The recruiter sees it in their dashboard.</li>
            <li>You&apos;ll get an in-app notification (bell icon) and an email when they:
              <ul className="list-disc pl-5 mt-1">
                <li><strong>Accept</strong> — interview is confirmed; the recruiter will open your Google Drive CV link</li>
                <li><strong>Waitlist</strong> — slot is full, but they may invite you if it opens up</li>
                <li><strong>Reject</strong> — they&apos;ve passed; the email may include a personalized note</li>
              </ul>
            </li>
            <li>Cancel any pending or accepted application from your bookings page — releases the slot for someone else</li>
          </ul>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            <strong>Important:</strong> Share your CV via Google Drive and set access to &quot;Anyone with the link can view&quot; so companies can open your CV.
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Your Profile</h3>
          <p className="mb-2">Open <strong>Profile</strong> from the menu at any time. You can edit:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Name, phone, nationality, photo</li>
            <li>School, major, study level / year, graduation date</li>
            <li>Job-seeking status, work authorization</li>
            <li>Skills, preferred locations, preferred industries</li>
            <li>Work experiences (up to 5) and certifications (up to 10)</li>
            <li>CV link, LinkedIn URL, portfolio URL</li>
            <li>Brief description / about-me</li>
          </ul>
          <p>Changes save instantly. Recruiters see the latest version next time they open your profile.</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Forgot Password</h3>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>On the login page, click <strong>Forgot password?</strong></li>
            <li>Enter your email — you&apos;ll get a 6-digit reset code (valid 10 minutes)</li>
            <li>Enter the code, then choose a new password (8+ characters)</li>
          </ol>
          <p>The reset link is single-use and expires once you complete the flow.</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">FAQ</h3>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">Q: Can I apply to multiple companies?</p>
              <p>A: Yes. You can also apply to multiple <em>different</em> positions at the same company — but not the same position twice.</p>
            </div>
            <div>
              <p className="font-semibold">Q: Can two interviews overlap?</p>
              <p>A: No. The system blocks any pending or accepted interview at a time you&apos;re already booked.</p>
            </div>
            <div>
              <p className="font-semibold">Q: The recruiter rejected me — can I apply again?</p>
              <p>A: Yes, for a different position at the same company, or a different company entirely.</p>
            </div>
            <div>
              <p className="font-semibold">Q: Can I change my email?</p>
              <p>A: Not directly — email changes require admin help to keep records consistent.</p>
            </div>
            <div>
              <p className="font-semibold">Q: The site is in English / Chinese / Vietnamese — can I switch?</p>
              <p>A: Yes. The language toggle is in the menu.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RecruiterSectionEn() {
  return (
    <section id="recruiter-guide" className="scroll-mt-8">
      <h2 className="text-2xl font-bold border-b pb-2 mb-6">Recruiter Guide</h2>
      <div className="space-y-6 text-sm leading-relaxed">
        <div>
          <h3 className="text-xl font-semibold mb-2">Overview</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Post jobs</strong> with full details (salary, employment type, visa support, deadline) — admin reviews before they go live</li>
            <li><strong>Receive applications</strong> from students for each job</li>
            <li><strong>Accept, waitlist, or reject</strong> applications — accept locks an interviewer slot atomically</li>
            <li><strong>Browse student profiles</strong> and book promising candidates directly (when admin enables that mode)</li>
            <li><strong>Edit your company profile</strong> — description, photos, gallery, interviewer count, contact info</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Getting Started</h3>

          <h4 className="font-semibold mt-4 mb-2">1. Get Your Account Approved</h4>
          <p className="mb-2">Before you can sign up, the event admin must whitelist either:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Your <strong>email domain</strong> (e.g., <code>tsmc.com</code>) — anyone with that domain can register</li>
            <li>Your <strong>specific email</strong> (e.g., <code>jane@gmail.com</code>) — only that exact address can register</li>
          </ul>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            If signup says &quot;This email domain is not authorized,&quot; contact the event admin with the email you&apos;ll be using.
          </div>

          <h4 className="font-semibold mt-4 mb-2">2. Create Your Account</h4>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>Click <strong>&quot;Get Started&quot;</strong> → <strong>&quot;I&apos;m a Recruiter&quot;</strong> → <strong>&quot;Sign Up&quot;</strong></li>
            <li>Enter your work email — the system checks the allow-list / approval list</li>
            <li>Fill in: your name, password (8+ characters), company name, industry, contact email, brief description</li>
            <li>Confirm the three hiring statements (lawful hiring, non-discrimination, work-authorization checks)</li>
            <li>Click <strong>Create Account</strong></li>
          </ol>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            Already have an account? Use <strong>Log In</strong> instead — the signup form will refuse to recreate an existing account. Forgot the password? Use the password-reset flow.
          </div>

          <h4 className="font-semibold mt-4 mb-2">3. You&apos;re In</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Default interview slots are pre-generated for the event day ({EVENT_CONFIG.displayDate}) at the configured time range and duration</li>
            <li>Default interviewer count is 1 — change it on your dashboard if you have more interviewers running parallel slots</li>
            <li>You&apos;re redirected to <strong>Dashboard → Interviews</strong></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Posting Jobs</h3>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>Open <strong>Dashboard → Jobs</strong> and click <strong>New Job</strong></li>
            <li>Fill in: title, location, employment type, workplace type, seniority, salary range &amp; currency, language requirement, visa support, application deadline, description, responsibilities, requirements, benefits, and an optional JD link</li>
            <li>Save as draft any time</li>
            <li>When ready, click <strong>Submit for review</strong></li>
          </ol>
          <p className="mb-2">The admin moderates job text against a list of disallowed terms (e.g., discriminatory language). After review:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Approved</strong> → job appears on your public page</li>
            <li><strong>Rejected</strong> → admin&apos;s notes are shown; edit and resubmit</li>
            <li>Editing an approved job sends it back to draft and requires re-approval</li>
          </ul>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            Admin can disable moderation entirely — in that case, jobs auto-approve as soon as you save.
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Reviewing Applications</h3>
          <p className="mb-2">When a student applies, you see a <strong>Pending</strong> entry in your dashboard with:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Applicant name, email, requested time, position</li>
            <li>CV link (verified <code>https://</code> only — safe to click)</li>
            <li>An in-app notification + push notification on your phone (if enabled)</li>
          </ul>
          <p className="mb-2">Three actions:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Accept</strong> — system finds and atomically locks one of your available interviewer slots at the requested time. Both parties get a confirmation email and an interview is on the books. Only one slot can be accepted per applicant per timeslot.</li>
            <li><strong>Waitlist</strong> — applicant is told the slot is full but you may still get back to them. If you cancel an accepted interview at the same time, the next waitlisted applicant is automatically promoted to Pending.</li>
            <li><strong>Reject</strong> — optional message (kept brief, sanitized) is included in the email.</li>
          </ul>
          <div className="bg-destructive/10 p-3 rounded-md text-destructive border-l-4 border-destructive mb-4">
            <strong>Heads up:</strong> Accept/Cancel are real-time. If two recruiters from the same company review the same application simultaneously, the platform serializes them — exactly one Accept wins, the others see &quot;already accepted.&quot;
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Browsing &amp; Booking Applicants</h3>
          <p className="mb-4">Available when admin sets the event mode to <em>Recruiters book Applicants</em> or <em>Both</em>.</p>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>Open <strong>Dashboard → Applicants</strong></li>
            <li>Search by name, major, or skill; click any card to see the full profile</li>
            <li>Pick one of the applicant&apos;s availability slots</li>
            <li>Click <strong>Book this slot</strong> — atomically locks both their availability slot and one of your interviewer slots</li>
          </ol>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Editing Your Company Profile</h3>
          <p className="mb-2">From the dashboard, open your company profile editor. You can change:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Company description, website</li>
            <li>Logo and gallery photos (up to 4 — uploaded to Vercel Blob)</li>
            <li>Number of interviewers (1–10) — adding more grows the slot pool; reducing drops only unbooked slots</li>
            <li>Contact email shown to applicants</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Notifications</h3>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Bell icon shows new applications, cancellations, and waitlist promotions</li>
            <li>Enable web push notifications from the bell menu to get alerts even when the tab is closed</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">FAQ</h3>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">Q: Can multiple recruiters from the same company sign up?</p>
              <p>A: Yes. Each gets their own login, dashboard, and interviewer slot pool.</p>
            </div>
            <div>
              <p className="font-semibold">Q: How are interviewer slots created?</p>
              <p>A: Default interviewer count is 1 — that means one slot per timeframe. Bumping interviewer count to N gives you N parallel slots per time, so up to N applicants can be interviewed in the same window.</p>
            </div>
            <div>
              <p className="font-semibold">Q: A pre-approved email no longer works after I&apos;ve signed up.</p>
              <p>A: That&apos;s correct. Pre-approval is consumed at signup; afterwards, just log in normally.</p>
            </div>
            <div>
              <p className="font-semibold">Q: I edited an approved job — why is it back in draft?</p>
              <p>A: Any content edit re-submits the job to admin moderation to prevent post-approval changes that bypass review.</p>
            </div>
            <div>
              <p className="font-semibold">Q: What happens to data after the event?</p>
              <p>A: We maintain your profile to optimize your experience and provide long-term career support for future events. You can request permanent deletion at any time to comply with Taiwan&apos;s PIPA.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminSectionEn() {
  return (
    <section id="admin-guide" className="scroll-mt-8">
      <h2 className="text-2xl font-bold border-b pb-2 mb-6">Admin Guide</h2>
      <div className="space-y-6 text-sm leading-relaxed">
        <div>
          <h3 className="text-xl font-semibold mb-2">Overview</h3>
          <p className="mb-2">As event admin you control the platform end-to-end:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Recruiter access</strong> — domain allow-list and per-email pre-approvals</li>
            <li><strong>Event mode &amp; lock</strong> — control booking direction and freeze it during the event</li>
            <li><strong>Job moderation</strong> — review &amp; approve/reject every recruiter-posted job</li>
            <li><strong>People management</strong> — view, search, sort, remove students and recruiters</li>
            <li><strong>Bookings</strong> — view all bookings; export as CSV</li>
            <li><strong>Email reminders</strong> — bulk-send schedules to students and recruiters before the event</li>
            <li><strong>Homepage images</strong> — manage hero images shown on the landing page</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Logging In</h3>
          <p className="mb-2">Admin accounts are seeded directly in the database — there&apos;s no admin signup flow. Log in via the standard login page; the role check redirects you to <code>/admin</code>.</p>
          <div className="bg-destructive/10 p-3 rounded-md text-destructive border-l-4 border-destructive mb-4">
            <strong>Important:</strong> Rotate the admin password before opening the platform to recruiters and students. Use the standard <em>Forgot password</em> flow or update the seed.
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Dashboard Sections</h3>

          <h4 className="font-semibold mt-4 mb-2">1. Stats</h4>
          <p className="mb-2">Live counters for recruiters, students, slots, available slots, and bookings. Updated in real time.</p>

          <h4 className="font-semibold mt-4 mb-2">2. Event Mode &amp; Onboarding</h4>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full text-left border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 border-b">Setting</th>
                  <th className="px-4 py-2 border-b">What it controls</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">Mode: Applicants book Recruiters</td>
                  <td className="px-4 py-2 border-b">Students apply for jobs at chosen times; recruiters accept</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">Mode: Recruiters book Applicants</td>
                  <td className="px-4 py-2 border-b">Recruiters search profiles and book directly into student availability</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">Mode: Both (Bidirectional)</td>
                  <td className="px-4 py-2 border-b">Both flows are active</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">Mode lock</td>
                  <td className="px-4 py-2 border-b">Freezes the mode so it can&apos;t accidentally change during the event</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">Onboarding mode (full / minimal)</td>
                  <td className="px-4 py-2 border-b">Whether students must fill school+major+study level at signup or only the bare minimum</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">Job moderation</td>
                  <td className="px-4 py-2 border-b">When ON, every recruiter job needs your approval before going public</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            <strong>Tip:</strong> Lock the mode at least 1 hour before the event opens.
          </div>

          <h4 className="font-semibold mt-4 mb-2">3. Recruiter Access</h4>
          <p className="mb-2">Two complementary tools:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Allowed Domains</strong> — anyone with an email at the domain (e.g., <code>tsmc.com</code>) can self-register. Auto-fills company &amp; industry.</li>
            <li><strong>Email Approvals</strong> — pre-approve a specific email (useful for solo recruiters using personal email) with the company &amp; industry you want pre-filled.</li>
          </ul>
          <p>Removing either does NOT log out existing recruiters — only new signups are affected.</p>

          <h4 className="font-semibold mt-4 mb-2">4. Job Moderation</h4>
          <p className="mb-2">When job moderation is on, recruiter-submitted jobs land in a queue:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Approve</strong> → job goes public on the recruiter&apos;s page</li>
            <li><strong>Reject</strong> → optional notes are shown to the recruiter so they can fix and resubmit</li>
            <li><strong>Reset to draft</strong> → returns it to the recruiter without a decision</li>
          </ul>
          <p>The platform also auto-flags potentially discriminatory wording at submission time — but always do a final human review.</p>

          <h4 className="font-semibold mt-4 mb-2">5. People</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Recruiters and students each in their own tab</li>
            <li>Sortable columns and a real-time search filter</li>
            <li>Removing a person deletes their account, profile, slots, and bookings <em>in a single transaction</em> — no orphan rows</li>
          </ul>
          <div className="bg-destructive/10 p-3 rounded-md text-destructive border-l-4 border-destructive mb-4">
            <strong>Warning:</strong> Deletion is irreversible. Export bookings via the CSV export tool first if you might need them later.
          </div>

          <h4 className="font-semibold mt-4 mb-2">6. Bookings &amp; Export</h4>
          <p>The bookings panel shows every interview across all recruiters with status filters. Click <strong>Export CSV</strong> for a download with applicant, recruiter, time, status, and CV link — values are pre-escaped against spreadsheet formula injection.</p>

          <h4 className="font-semibold mt-4 mb-2">7. Email Reminders</h4>
          <p>Send pre-event interview schedule reminders to all students or all recruiters with one click. Each send is logged with success/error per recipient — view the email-stats panel to see delivery health.</p>

          <h4 className="font-semibold mt-4 mb-2">8. Homepage Images &amp; Timeframe</h4>
          <p className="mb-2">Manage the hero/homepage images (URLs validated against the Vercel Blob host allow-list) and adjust the event timeframe / display date if it shifts.</p>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <li>Uploaded images become slides in the homepage <strong>hero carousel</strong>: the event details (title, countdown, CTA) are slide 1, then each uploaded photo follows in order.</li>
            <li>The carousel auto-advances every 8s on the hero and 5s on each photo, then loops back to the hero. Visitors can swipe, click the dots, or hover/touch to pause.</li>
            <li>Upload <strong>0 photos</strong> → no carousel; only the static hero shows. <strong>1+ photos</strong> → carousel activates. Up to 4 images supported.</li>
            <li>The same images also feed the &quot;Event Highlights&quot; gallery further down the homepage.</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Pre-Event Checklist</h3>

          <h4 className="font-semibold mt-4 mb-2">2 weeks before</h4>
          <ul className="list-none pl-0 space-y-1 mb-4">
            <li><input type="checkbox" readOnly className="mr-2" /> Add all recruiter email domains and per-email approvals</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Decide on onboarding mode (full vs minimal) and event mode</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Share platform URL with universities and participating companies</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Verify Resend / push-notification env vars are set in production</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">1 week before</h4>
          <ul className="list-none pl-0 space-y-1 mb-4">
            <li><input type="checkbox" readOnly className="mr-2" /> Confirm recruiter signups match expectations; chase missing companies</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Review &amp; approve all submitted jobs in the moderation queue</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Run a test application end-to-end (apply → accept → email received)</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">1 day before</h4>
          <ul className="list-none pl-0 space-y-1 mb-4">
            <li><input type="checkbox" readOnly className="mr-2" /> Send the pre-event reminder emails to students and recruiters</li>
            <li><input type="checkbox" readOnly className="mr-2" /> <strong>Lock the event mode</strong></li>
            <li><input type="checkbox" readOnly className="mr-2" /> Verify all stats look right; export a baseline CSV snapshot</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">Event day</h4>
          <ul className="list-none pl-0 space-y-1 mb-4">
            <li><input type="checkbox" readOnly className="mr-2" /> Watch the dashboard; respond to support requests via your channel of choice</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Spot-check recruiter inboxes if anyone reports missing notifications</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">2 days after</h4>
          <ul className="list-none pl-0 space-y-1 mb-4">
            <li><input type="checkbox" readOnly className="mr-2" /> Final CSV export of all bookings</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Delete user data to comply with the Personal Data Protection Act (PIPA) (admin People → remove all)</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Notify recruiters that data has been purged</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Troubleshooting</h3>
          <div className="space-y-4">
            <div>
              <p className="font-semibold">&quot;Recruiter says they can&apos;t sign up&quot;</p>
              <p>→ Check the Allowed Domains and Email Approvals lists. Add the missing entry. They&apos;ll need to re-try with the same email they provided.</p>
            </div>
            <div>
              <p className="font-semibold">&quot;Student says the verification code never arrived&quot;</p>
              <p>→ Check the Email Stats panel — Resend may be rate-limiting or the address bounced. They can request up to 5 codes per hour. Confirm the email isn&apos;t in their spam folder.</p>
            </div>
            <div>
              <p className="font-semibold">&quot;Two students saw &apos;Accept failed&apos; for the same time&quot;</p>
              <p>→ That&apos;s the slot-locking working correctly: only one Accept can win per slot. The other recruiter / applicant should pick a different time.</p>
            </div>
            <div>
              <p className="font-semibold">&quot;Approved job not appearing&quot;</p>
              <p>→ Recruiter may have edited it after approval, sending it back to draft. Re-review the queue.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Technical Notes</h3>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Stack</strong>: Next.js 16 on Vercel; Neon Postgres (serverless WebSocket driver) with Drizzle ORM</li>
            <li><strong>Auth</strong>: JWT cookies, bcrypt hashing (12 rounds), 8-character minimum password</li>
            <li><strong>Validation</strong>: zod schemas at the API boundary on auth, signup, and booking endpoints</li>
            <li><strong>Concurrency</strong>: Postgres advisory locks + atomic CAS-style UPDATEs guarantee no double-booked slots; covered by integration tests (<code>npm test</code>)</li>
            <li><strong>Rate limits</strong>: Vercel Runtime Cache (60 req/min general API, 5/min on auth endpoints)</li>
            <li><strong>Email</strong>: Resend with HTML escaping &amp; URL allow-listing on every user-supplied field</li>
            <li><strong>Push</strong>: Web Push via VAPID keypair</li>
            <li><strong>Storage</strong>: Vercel Blob for avatars, logos, gallery, homepage images</li>
            <li><strong>I18n</strong>: en, zh-TW, vi locales</li>
            <li><strong>Designed &amp; Developed by</strong>: <a href="https://tecxmate.com" className="text-primary hover:underline">TECXMATE.COM</a></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
