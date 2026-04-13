import { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Tutorial | V-GEN TRIDENT",
  description: "Guides for Students, Recruiters, and Admins on V-GEN TRIDENT",
};

export default function TutorialPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold mb-2">Platform Tutorials</h1>
        <p className="text-muted-foreground mb-8">Guides on how to use V-GEN as a Student, Recruiter, or Admin.</p>

        <div className="flex gap-4 mb-12 border-b pb-4 overflow-x-auto">
          <a href="#student-guide" className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 font-medium whitespace-nowrap">Student Guide</a>
          <a href="#recruiter-guide" className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 font-medium whitespace-nowrap">Recruiter Guide</a>
          <a href="#admin-guide" className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 font-medium whitespace-nowrap">Admin Guide</a>
        </div>

        <div className="flex flex-col gap-16">
          {/* STUDENT GUIDE */}
          <section id="student-guide" className="scroll-mt-8">
            <h2 className="text-2xl font-bold border-b pb-2 mb-6">Student Guide</h2>
            <div className="space-y-6 text-sm leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold mb-2">Overview</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Browse</strong> participating companies and their open positions</li>
                  <li><strong>Book</strong> interview slots directly with recruiters</li>
                  <li><strong>Register</strong> your profile so recruiters can discover and book you</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2">Getting Started</h3>
                <h4 className="font-semibold mt-4 mb-2">1. Create Your Account</h4>
                <ol className="list-decimal pl-5 space-y-1 mb-4">
                  <li>Go to the V-GEN website</li>
                  <li>Click <strong>&quot;I&apos;m a Student&quot;</strong></li>
                  <li>Click <strong>&quot;Sign Up&quot;</strong></li>
                  <li>Fill in the registration form:
                    <ul className="list-disc pl-5 mt-1">
                      <li><strong>Full Name</strong> (required)</li>
                      <li><strong>Email</strong> (required — use your university email)</li>
                      <li><strong>Password</strong> (at least 6 characters)</li>
                      <li><strong>Major / Department</strong> (optional but recommended)</li>
                      <li><strong>Skills</strong> (type a skill and press Enter to add; click to remove)</li>
                      <li><strong>CV Link</strong> (required — Google Drive link to your CV)</li>
                      <li><strong>About You</strong> (brief introduction)</li>
                    </ul>
                  </li>
                  <li>Check the <strong>PIPA consent</strong> checkbox</li>
                  <li>Click <strong>&quot;Sign Up&quot;</strong></li>
                </ol>

                <h4 className="font-semibold mt-4 mb-2">2. Set Your Availability (Optional)</h4>
                <p className="mb-2">After signing up, you&apos;ll be asked to create availability slots:</p>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Click <strong>&quot;Create Availability (10 AM – 5:30 PM)&quot;</strong> to let recruiters book you</li>
                  <li>Or click <strong>&quot;Skip for now&quot;</strong> if you only want to book recruiters yourself</li>
                </ul>
                <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary">
                  <strong>Tip:</strong> Creating availability is recommended! It lets recruiters who see your profile book an interview with you directly.
                </div>

                <h4 className="font-semibold mt-4 mb-2">3. You&apos;re In!</h4>
                <p>After registration, you&apos;ll be redirected to the <strong>Company Directory</strong>.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Browsing &amp; Booking</h3>
                
                <h4 className="font-semibold mt-4 mb-2">Finding Companies</h4>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Use the <strong>search bar</strong> to search by company name or position</li>
                  <li>Use the <strong>industry filter chips</strong> (Technology, Finance, Semiconductor, etc.) to narrow results</li>
                  <li>Each company card shows:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Company name and industry</li>
                      <li>Brief description</li>
                      <li>Open positions</li>
                    </ul>
                  </li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">Booking an Interview</h4>
                <ol className="list-decimal pl-5 space-y-1 mb-4">
                  <li>Click <strong>&quot;View &amp; Book&quot;</strong> on any company card</li>
                  <li>You&apos;ll see the company details and a <strong>slot picker</strong></li>
                  <li>Use the <strong>left/right arrows</strong> to navigate dates (event day: June 6, 2026)</li>
                  <li>Click an available time slot (green = available)</li>
                  <li>Review your profile info (auto-filled from your account)</li>
                  <li>Optionally update the <strong>CV Link</strong> for this specific interview</li>
                  <li>Check the <strong>PIPA consent</strong> checkbox</li>
                  <li>Click <strong>&quot;Confirm Booking&quot;</strong></li>
                </ol>

                <h4 className="font-semibold mt-4 mb-2">After Booking</h4>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>You&apos;ll see a confirmation with the interview time</li>
                  <li><strong>Important:</strong> Share your CV on Google Drive with the recruiter&apos;s email address shown on screen</li>
                  <li>Do NOT set your Drive link to &quot;Anyone can view&quot; — share only with the specific recruiter</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Your Profile</h3>
                <p className="mb-2">Your profile is visible to recruiters and includes:</p>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Name, email, major</li>
                  <li>Skills</li>
                  <li>CV link</li>
                  <li>Brief description</li>
                </ul>
                <p>This information was set during registration. To update it, contact the event admin.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">FAQ</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">Q: Can I book multiple companies?</p>
                    <p>A: Yes! You can book one slot per company.</p>
                  </div>
                  <div>
                    <p className="font-semibold">Q: What if the time slot I want is taken?</p>
                    <p>A: Choose a different time. Slots are first-come, first-served.</p>
                  </div>
                  <div>
                    <p className="font-semibold">Q: Do I need to be at the event in person?</p>
                    <p>A: Check with the event organizer (VSATW) for event format details.</p>
                  </div>
                  <div>
                    <p className="font-semibold">Q: I forgot my password.</p>
                    <p>A: Contact the event admin for a password reset.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RECRUITER GUIDE */}
          <section id="recruiter-guide" className="scroll-mt-8">
            <h2 className="text-2xl font-bold border-b pb-2 mb-6">Recruiter Guide</h2>
            <div className="space-y-6 text-sm leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold mb-2">Overview</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>View</strong> all interview bookings made by students</li>
                  <li><strong>Browse</strong> registered student profiles (skills, major, CV)</li>
                  <li><strong>Book</strong> interviews directly with promising candidates</li>
                  <li><strong>Manage</strong> your company profile and open positions</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Getting Started</h3>
                
                <h4 className="font-semibold mt-4 mb-2">1. Check With the Admin</h4>
                <p className="mb-4">Before you can sign up, the event admin must add your company&apos;s email domain to the allow-list. For example, if you work at TSMC, the admin adds <code>tsmc.com</code> — then anyone with a <code>@tsmc.com</code> email can register as a recruiter.</p>
                <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
                  If you try to sign up and see &quot;This email domain is not authorized&quot;, contact the event admin.
                </div>

                <h4 className="font-semibold mt-4 mb-2">2. Create Your Account</h4>
                <ol className="list-decimal pl-5 space-y-1 mb-4">
                  <li>Go to the V-GEN website</li>
                  <li>Click <strong>&quot;I&apos;m a Recruiter&quot;</strong></li>
                  <li>Click <strong>&quot;Sign Up&quot;</strong></li>
                  <li>Enter your <strong>work email</strong> (e.g., <code>jane@tsmc.com</code>)</li>
                  <li>Click <strong>&quot;Continue&quot;</strong> — the system verifies your domain</li>
                  <li>If approved, you&apos;ll see your company name pre-filled</li>
                  <li>Complete your profile:
                    <ul className="list-disc pl-5 mt-1">
                      <li><strong>Your Name</strong> (required)</li>
                      <li><strong>Password</strong> (at least 6 characters)</li>
                      <li><strong>Company Description</strong> (shown to students)</li>
                      <li><strong>Open Positions</strong> (type and press Enter to add each one)</li>
                    </ul>
                  </li>
                  <li>Click <strong>&quot;Create Account&quot;</strong></li>
                </ol>

                <h4 className="font-semibold mt-4 mb-2">3. You&apos;re In</h4>
                <p className="mb-2">After registration:</p>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Your account is created with 30 interview slots (10:00 AM – 5:30 PM, 15-min each)</li>
                  <li>You&apos;ll be redirected to your <strong>Dashboard</strong></li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Your Dashboard</h3>
                
                <h4 className="font-semibold mt-4 mb-2">My Bookings Tab</h4>
                <p className="mb-2">Shows all interview bookings — both:</p>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li><strong>&quot;They booked&quot;</strong> — students who booked your slots</li>
                  <li><strong>&quot;You booked&quot;</strong> — students you booked directly (if enabled)</li>
                </ul>
                <p className="mb-2">Each booking shows:</p>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Student name and email</li>
                  <li>Interview time</li>
                  <li>Link to their CV (Google Drive)</li>
                  <li>Booking status</li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">Browse Applicants Tab</h4>
                <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
                  This tab is only visible when the event mode includes &quot;Recruiters book Applicants&quot; (set by admin).
                </div>
                <ol className="list-decimal pl-5 space-y-1 mb-4">
                  <li><strong>Search</strong> students by name, major, or skill</li>
                  <li>Click a student card to see their full profile + CV</li>
                  <li>Select a time slot from their availability</li>
                  <li>Click <strong>&quot;Confirm Booking&quot;</strong> to schedule the interview</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Logging In (Returning Users)</h3>
                <ol className="list-decimal pl-5 space-y-1 mb-4">
                  <li>Go to the V-GEN website</li>
                  <li>Click <strong>&quot;I&apos;m a Recruiter&quot;</strong> → <strong>&quot;Log In&quot;</strong></li>
                  <li>Enter your work email and password</li>
                  <li>You&apos;ll be redirected to your dashboard</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">FAQ</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">Q: Can I change my company description or add more positions after signup?</p>
                    <p>A: Contact the event admin to update your profile.</p>
                  </div>
                  <div>
                    <p className="font-semibold">Q: How do students share their CVs with me?</p>
                    <p>A: Students share their Google Drive CV link exclusively with your contact email. You&apos;ll see the link in each booking.</p>
                  </div>
                  <div>
                    <p className="font-semibold">Q: Can multiple people from my company sign up?</p>
                    <p>A: Yes — anyone with an email on the allowed domain can create their own recruiter account. Each gets their own set of interview slots.</p>
                  </div>
                  <div>
                    <p className="font-semibold">Q: What happens after the event?</p>
                    <p>A: All booking data is exported for records, then permanently deleted within 2 days to comply with Taiwan&apos;s Personal Data Protection Act (PIPA).</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ADMIN GUIDE */}
          <section id="admin-guide" className="scroll-mt-8">
            <h2 className="text-2xl font-bold border-b pb-2 mb-6">Admin Guide</h2>
            <div className="space-y-6 text-sm leading-relaxed">
              <div>
                <h3 className="text-xl font-semibold mb-2">Overview</h3>
                <p className="mb-2">As the event admin, you manage the entire platform:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Recruiter access</strong> — control which company email domains can sign up</li>
                  <li><strong>Event mode</strong> — choose booking direction (students book recruiters, recruiters book students, or both)</li>
                  <li><strong>Mode lock</strong> — prevent accidental mode changes during the event</li>
                  <li><strong>People management</strong> — view, search, and remove students and recruiters</li>
                  <li><strong>Monitoring</strong> — real-time stats on registrations, slots, and bookings</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Logging In</h3>
                <ol className="list-decimal pl-5 space-y-1 mb-4">
                  <li>Go to the V-GEN website</li>
                  <li>Click <strong>&quot;I&apos;m an Admin&quot;</strong> → <strong>&quot;Log In&quot;</strong></li>
                  <li>Enter your admin credentials:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Email: <code>admin@vgen.tw</code></li>
                      <li>Password: <code>admin123</code></li>
                    </ul>
                  </li>
                  <li><strong>Change this password immediately</strong> for production use</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Dashboard Overview</h3>
                <p className="mb-4">The admin dashboard has four sections:</p>
                
                <h4 className="font-semibold mt-4 mb-2">1. Stats (Top)</h4>
                <p className="mb-2">Five real-time counters:</p>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li><strong>Recruiters</strong> — total registered recruiter accounts</li>
                  <li><strong>Students</strong> — total registered student accounts</li>
                  <li><strong>Slots</strong> — total interview slots across all recruiters</li>
                  <li><strong>Available</strong> — remaining unbooked slots</li>
                  <li><strong>Bookings</strong> — total confirmed bookings</li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">2. Event Mode</h4>
                <p className="mb-2">Controls the booking flow for the event:</p>
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full text-left border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 border-b">Mode</th>
                        <th className="px-4 py-2 border-b">What Happens</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 border-b font-medium">Applicants book Recruiters</td>
                        <td className="px-4 py-2 border-b">Students browse companies → pick slots → book</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 border-b font-medium">Recruiters book Applicants</td>
                        <td className="px-4 py-2 border-b">Recruiters browse student profiles → pick slots → book</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 border-b font-medium">Both (Bidirectional)</td>
                        <td className="px-4 py-2 border-b">Both flows active simultaneously</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="mb-2"><strong>How to set:</strong></p>
                <ol className="list-decimal pl-5 space-y-1 mb-4">
                  <li>Click the mode card you want</li>
                  <li>It saves immediately</li>
                </ol>

                <p className="mb-2"><strong>Locking the mode (recommended before event):</strong></p>
                <ol className="list-decimal pl-5 space-y-1 mb-4">
                  <li>Choose your mode</li>
                  <li>Click <strong>&quot;Unlocked&quot;</strong> button (top-right of the section)</li>
                  <li>Confirm → mode is now locked</li>
                  <li>Mode cards become disabled — no accidental changes</li>
                  <li>To unlock: click <strong>&quot;Locked&quot;</strong> button again</li>
                </ol>
                <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
                  <strong>Tip:</strong> Lock the mode at least 1 hour before the event starts.
                </div>

                <h4 className="font-semibold mt-4 mb-2">3. Allowed Recruiter Domains</h4>
                <p className="mb-2">Controls which companies can sign up as recruiters.</p>
                
                <p className="mb-2"><strong>Adding a domain:</strong></p>
                <ol className="list-decimal pl-5 space-y-1 mb-4">
                  <li>Enter the email domain (e.g., <code>tsmc.com</code>)</li>
                  <li>Enter the company name (e.g., <code>TSMC</code>)</li>
                  <li>Select the industry</li>
                  <li>Click <strong>&quot;Add Domain&quot;</strong></li>
                </ol>
                <p className="mb-4">When a recruiter signs up with an email matching this domain (e.g., <code>jane@tsmc.com</code>), their profile is automatically pre-filled with the company name and industry.</p>

                <p className="mb-2"><strong>Removing a domain:</strong></p>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Click the trash icon next to any domain</li>
                  <li>Existing recruiter accounts are NOT affected — only new signups are blocked</li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">4. People</h4>
                <p className="mb-2">Two tabs: <strong>Recruiters</strong> and <strong>Students</strong></p>
                
                <p className="mb-2"><strong>Viewing:</strong></p>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li>Sortable columns: click any header (Name, Email, Company, Industry, Major, Joined) to sort ascending/descending</li>
                  <li>Search bar filters in real-time by name, email, company, or major</li>
                </ul>

                <p className="mb-2"><strong>Removing a person:</strong></p>
                <ol className="list-decimal pl-5 space-y-1 mb-4">
                  <li>Click the trash icon on their row</li>
                  <li>Confirm the deletion</li>
                  <li>This permanently deletes:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Their user account</li>
                      <li>Their profile</li>
                      <li>All their interview slots</li>
                      <li>All their bookings</li>
                    </ul>
                  </li>
                </ol>
                <div className="bg-destructive/10 p-3 rounded-md text-destructive border-l-4 border-destructive mb-4">
                  <strong>Warning:</strong> Deletion is irreversible. Export any needed data before removing.
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Pre-Event Checklist</h3>
                
                <h4 className="font-semibold mt-4 mb-2">2 weeks before</h4>
                <ul className="list-none pl-0 space-y-1 mb-4">
                  <li><input type="checkbox" readOnly className="mr-2" /> Add all recruiter email domains to the allow-list</li>
                  <li><input type="checkbox" readOnly className="mr-2" /> Share the platform URL and recruiter signup instructions with participating companies</li>
                  <li><input type="checkbox" readOnly className="mr-2" /> Share the student signup link with target universities/groups</li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">1 week before</h4>
                <ul className="list-none pl-0 space-y-1 mb-4">
                  <li><input type="checkbox" readOnly className="mr-2" /> Verify all recruiters have signed up and have their slots</li>
                  <li><input type="checkbox" readOnly className="mr-2" /> Check the People tab — confirm recruiter count matches expectations</li>
                  <li><input type="checkbox" readOnly className="mr-2" /> Decide on the event mode (recommendation: &quot;Applicants book Recruiters&quot; for simplicity)</li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">1 day before</h4>
                <ul className="list-none pl-0 space-y-1 mb-4">
                  <li><input type="checkbox" readOnly className="mr-2" /> <strong>Lock the event mode</strong></li>
                  <li><input type="checkbox" readOnly className="mr-2" /> Verify stats: slots available, registered students</li>
                  <li><input type="checkbox" readOnly className="mr-2" /> Test a booking yourself with a test student account</li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">Event day</h4>
                <ul className="list-none pl-0 space-y-1 mb-4">
                  <li><input type="checkbox" readOnly className="mr-2" /> Monitor the dashboard for real-time booking stats</li>
                  <li><input type="checkbox" readOnly className="mr-2" /> Be available for support (password resets, account issues)</li>
                  <li><input type="checkbox" readOnly className="mr-2" /> Watch for any recruiters who haven&apos;t received bookings — may need troubleshooting</li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">2 days after</h4>
                <ul className="list-none pl-0 space-y-1 mb-4">
                  <li><input type="checkbox" readOnly className="mr-2" /> Export all booking data (admin bookings page or direct DB export)</li>
                  <li><input type="checkbox" readOnly className="mr-2" /> Delete all user data to comply with PIPA</li>
                  <li><input type="checkbox" readOnly className="mr-2" /> Notify recruiters that data has been purged</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Troubleshooting</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold">&quot;A recruiter says they can&apos;t sign up&quot;</p>
                    <p>→ Check that their email domain is in the Allowed Domains list. Add it if missing.</p>
                  </div>
                  <div>
                    <p className="font-semibold">&quot;A student says they can&apos;t log in&quot;</p>
                    <p>→ They may have mistyped their email during registration. Check the Students tab for their email. If needed, delete their account so they can re-register.</p>
                  </div>
                  <div>
                    <p className="font-semibold">&quot;I need to change a recruiter&apos;s company info&quot;</p>
                    <p>→ Currently requires direct database access. Delete and re-create the recruiter account, or contact the developer.</p>
                  </div>
                  <div>
                    <p className="font-semibold">&quot;The mode accidentally changed during the event&quot;</p>
                    <p>→ That&apos;s what mode lock prevents. If it happens, switch back and lock it immediately.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Technical Notes</h3>
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  <li><strong>Platform</strong>: Next.js on Vercel (auto-scaling, handles 1,000+ concurrent users)</li>
                  <li><strong>Database</strong>: Neon Postgres (serverless, auto-scaling connections)</li>
                  <li><strong>Auth</strong>: JWT cookies, bcrypt password hashing</li>
                  <li><strong>Booking</strong>: Atomic slot locking — no double-bookings possible</li>
                  <li><strong>PIPA</strong>: All data can be purged by clearing the database after the event</li>
                  <li><strong>Designed &amp; Developed by</strong>: <a href="https://tecxmate.com" className="text-primary hover:underline">TECXMATE.COM</a></li>
                </ul>
              </div>
            </div>
          </section>

        </div>
      </main>
      <SiteFooter />
    </div>
  );
}