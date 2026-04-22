import { redirect } from "next/navigation";
import { RecruiterLocaleProvider } from "@/components/recruiter-locale-provider";
import { getSession } from "@/lib/auth";
import { getRecruiterLocale } from "@/lib/recruiter-locale.server";
import {
  db,
  recruiters,
  bookings,
  eventConfig,
} from "@/lib/db";
import { eq } from "drizzle-orm";
import { RecruiterDashboard } from "./recruiter-dashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");
  const locale = await getRecruiterLocale();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialTab =
    resolvedSearchParams?.tab === "applicants" ||
    resolvedSearchParams?.tab === "company" ||
    resolvedSearchParams?.tab === "bookings"
      ? resolvedSearchParams.tab
      : "bookings";

  const [recruiter] = await db
    .select({
      id: recruiters.id,
      company: recruiters.company,
      industry: recruiters.industry,
      description: recruiters.description,
      contactEmail: recruiters.contactEmail,
      interviewerCount: recruiters.interviewerCount,
    })
    .from(recruiters)
    .where(eq(recruiters.userId, session.userId));

  if (!recruiter) redirect("/login");

  // All bookings for this recruiter (includes pending, accepted, waitlisted, etc.)
  const allBookings = await db
    .select({
      id: bookings.id,
      direction: bookings.direction,
      position: bookings.position,
      applicantName: bookings.applicantName,
      applicantEmail: bookings.applicantEmail,
      cvLink: bookings.cvLink,
      status: bookings.status,
      createdAt: bookings.createdAt,
      requestedTime: bookings.requestedTime,
      slotId: bookings.slotId,
    })
    .from(bookings)
    .where(eq(bookings.recruiterId, recruiter.id))
    .orderBy(bookings.requestedTime, bookings.createdAt);

  const [config] = await db
    .select({ mode: eventConfig.mode })
    .from(eventConfig)
    .limit(1);
  const eventMode = config?.mode ?? "both";
  const showApplicants =
    eventMode === "recruiter_books_applicant" || eventMode === "both";
  const safeInitialTab =
    initialTab === "applicants" && !showApplicants ? "bookings" : initialTab;

  return (
    <RecruiterLocaleProvider initialLocale={locale}>
      <RecruiterDashboard
        key={safeInitialTab}
        recruiter={recruiter}
        bookings={allBookings}
        initialTab={safeInitialTab}
      />
    </RecruiterLocaleProvider>
  );
}
