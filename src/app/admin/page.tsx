import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  db,
  recruiters,
  bookings,
  slots,
  applicantProfiles,
  eventConfig,
  allowedDomains,
} from "@/lib/db";
import { count, eq } from "drizzle-orm";
import { AdminDashboard } from "./admin-dashboard";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const recruiterList = await db
    .select({
      id: recruiters.id,
      company: recruiters.company,
      industry: recruiters.industry,
      contactEmail: recruiters.contactEmail,
    })
    .from(recruiters)
    .orderBy(recruiters.company);

  const [bookingCount] = await db.select({ count: count() }).from(bookings);
  const [slotCount] = await db.select({ count: count() }).from(slots);
  const [availableCount] = await db
    .select({ count: count() })
    .from(slots)
    .where(eq(slots.status, "available"));
  const [applicantCount] = await db
    .select({ count: count() })
    .from(applicantProfiles);
  const [config] = await db
    .select({ mode: eventConfig.mode, locked: eventConfig.modeLocked })
    .from(eventConfig)
    .limit(1);

  const domains = await db
    .select()
    .from(allowedDomains)
    .orderBy(allowedDomains.company);

  return (
    <AdminDashboard
      recruiters={recruiterList}
      domains={domains}
      stats={{
        totalRecruiters: recruiterList.length,
        totalBookings: bookingCount.count,
        totalSlots: slotCount.count,
        availableSlots: availableCount.count,
        totalApplicants: applicantCount.count,
      }}
      currentMode={config?.mode ?? "both"}
      initialLocked={config?.locked ?? false}
    />
  );
}
