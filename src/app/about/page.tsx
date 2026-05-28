import { Metadata } from "next";
import Link from "next/link";
import { AppTopBar } from "@/components/app-topbar";
import { SiteFooter } from "@/components/site-footer";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "About TECXWORK | TECXWORK",
  description:
    "TECXWORK is a career-fair platform connecting Vietnamese students in Taiwan with companies hiring international talent.",
};

export default async function AboutPage() {
  const session = await getSession();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppTopBar navRole={session?.role ?? "guest"} currentPath="/about" />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl font-bold mb-2">About TECXWORK</h1>
        <p className="text-muted-foreground mb-8">
          A purpose-built platform for student–recruiter career events.
        </p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">What TECXWORK is</h2>
            <p>
              TECXWORK is a web platform that powers in-person and online career fairs
              for international students. It pairs job-seeking students with recruiters
              from participating companies and runs the entire event flow end-to-end:
              browsing companies, viewing open positions, applying for an interview at a
              specific time slot, and confirming the booking with both sides via email
              and in-app notifications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Who it&apos;s for</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Students</strong> — build a profile, browse companies and
                external job listings, and book interview slots in one click.
              </li>
              <li>
                <strong>Recruiters</strong> — post jobs, review applications, and accept,
                waitlist, or reject candidates with atomic slot locking so two
                interviewers never collide on the same time.
              </li>
              <li>
                <strong>Event organizers / admins</strong> — control the event mode,
                moderate jobs, manage participants, send reminders, and export bookings.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Origin</h2>
            <p>
              TECXWORK was built by{" "}
              <a
                href="https://tecxmate.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                TECXMATE
              </a>{" "}
              in partnership with the Vietnamese Student Association in Taiwan (VSATW)
              for the V-GEN TRIDENT career fair, then generalized into a reusable
              platform for similar student-focused hiring events.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Technology &amp; Architecture</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Built on modern, secure cloud infrastructure that stays fast and reliable even when thousands of people use it at once.</li>
              <li>Smart, global routing so pages load instantly, no matter where you are or what device you are using.</li>
              <li>A robust database system that carefully manages every interview booking, ensuring schedules never overlap.</li>
              <li>A reliable notification system that instantly sends emails and alerts to keep everyone updated.</li>
              <li>Secure file storage that keeps your uploaded resumes and images safe and private.</li>
              <li>Designed from the ground up to support multiple languages seamlessly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Privacy &amp; data handling</h2>
            <p>
              TECXWORK is designed to comply with Taiwan&apos;s Personal Data Protection
              Act (PIPA / PDPA) and Vietnam&apos;s Decree 13/2023/ND-CP. To provide you
              with ongoing career support and optimize your experience for future events,
              we maintain your profile so you don&apos;t have to rebuild it. You always
              maintain full control and can request permanent deletion at any time. For
              full details on what is collected, how it&apos;s used, and the rights you
              have over your data, see the{" "}
              <Link href="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Get in touch</h2>
            <p>
              Interested in running your own career event on TECXWORK, or have questions
              about an upcoming event? Reach out via{" "}
              <a
                href="https://tecxmate.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                tecxmate.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
