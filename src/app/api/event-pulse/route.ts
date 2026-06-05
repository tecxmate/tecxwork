import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success, remaining, reset } = await rateLimit(
    ip,
    "api",
    "event-pulse"
  );

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          ...rateLimitHeaders(remaining, reset),
        },
      }
    );
  }

  const [pulse] = (
    await db.execute<{
      generated_at: Date;
      event_name: string;
      display_date: string;
      location: string;
      mode: string;
      mode_locked: boolean;
      emergency_fallback: boolean;
      job_moderation_enabled: boolean;
      student_cancellation_enabled: boolean;
      applicants: number;
      recruiters: number;
      approved_jobs: number;
      recruiter_slots: number;
      available_slots: number;
      booked_slots: number;
      applicant_slots: number;
      bookings: number;
      notifications: number;
      push_subscriptions: number;
      emails_today: number;
      booking_status: Array<{ status: string; count: number }>;
      slot_status: Array<{ status: string; count: number }>;
      companies: Array<{
        company: string;
        industry: string;
        interviewerCount: number;
      }>;
      integrity: {
        duplicateAcceptedSlotIds: number;
        duplicateAcceptedApplicantSlotIds: number;
        acceptedDoubleBookedApplicants: number;
        orphanBookedSlots: number;
        acceptedWithoutBookedSlot: number;
      };
    }>(sql`
      SELECT
        now() AS generated_at,
        ec.event_name,
        ec.display_date,
        ec.location,
        ec.mode::text AS mode,
        ec.mode_locked,
        ec.emergency_fallback,
        ec.job_moderation_enabled,
        ec.student_cancellation_enabled,
        (SELECT count(*)::int FROM applicant_profiles) AS applicants,
        (SELECT count(*)::int FROM recruiters) AS recruiters,
        (
          SELECT count(*)::int
          FROM job_openings
          WHERE moderation_status = 'approved'
        ) AS approved_jobs,
        (SELECT count(*)::int FROM slots) AS recruiter_slots,
        (
          SELECT count(*)::int
          FROM slots
          WHERE status = 'available'
        ) AS available_slots,
        (
          SELECT count(*)::int
          FROM slots
          WHERE status = 'booked'
        ) AS booked_slots,
        (SELECT count(*)::int FROM applicant_slots) AS applicant_slots,
        (SELECT count(*)::int FROM bookings) AS bookings,
        (SELECT count(*)::int FROM notifications) AS notifications,
        (SELECT count(*)::int FROM push_subscriptions) AS push_subscriptions,
        (
          SELECT count(*)::int
          FROM email_logs
          WHERE success = true
            AND created_at >= date_trunc('day', now())
        ) AS emails_today,
        (
          SELECT coalesce(
            jsonb_agg(
              jsonb_build_object('status', status, 'count', count)
              ORDER BY status
            ),
            '[]'::jsonb
          )
          FROM (
            SELECT status::text AS status, count(*)::int AS count
            FROM bookings
            GROUP BY status
          ) booking_counts
        ) AS booking_status,
        (
          SELECT coalesce(
            jsonb_agg(
              jsonb_build_object('status', status, 'count', count)
              ORDER BY status
            ),
            '[]'::jsonb
          )
          FROM (
            SELECT status::text AS status, count(*)::int AS count
            FROM slots
            GROUP BY status
          ) slot_counts
        ) AS slot_status,
        (
          SELECT coalesce(
            jsonb_agg(
              jsonb_build_object(
                'company',
                company,
                'industry',
                industry,
                'interviewerCount',
                interviewer_count
              )
              ORDER BY pinned_rank NULLS LAST, company
            ),
            '[]'::jsonb
          )
          FROM (
            SELECT company, industry, interviewer_count, pinned_rank
            FROM recruiters
            ORDER BY pinned_rank NULLS LAST, company
            LIMIT 8
          ) company_rows
        ) AS companies,
        jsonb_build_object(
          'duplicateAcceptedSlotIds',
          (
            SELECT count(*)::int
            FROM (
              SELECT slot_id
              FROM bookings
              WHERE status = 'accepted'
                AND slot_id IS NOT NULL
              GROUP BY slot_id
              HAVING count(*) > 1
            ) duplicate_slots
          ),
          'duplicateAcceptedApplicantSlotIds',
          (
            SELECT count(*)::int
            FROM (
              SELECT applicant_slot_id
              FROM bookings
              WHERE status = 'accepted'
                AND applicant_slot_id IS NOT NULL
              GROUP BY applicant_slot_id
              HAVING count(*) > 1
            ) duplicate_applicant_slots
          ),
          'acceptedDoubleBookedApplicants',
          (
            SELECT count(*)::int
            FROM (
              SELECT
                b.applicant_email,
                coalesce(s.start_time, aps.start_time, b.requested_time) AS start_time
              FROM bookings b
              LEFT JOIN slots s ON b.slot_id = s.id
              LEFT JOIN applicant_slots aps ON b.applicant_slot_id = aps.id
              WHERE b.status = 'accepted'
              GROUP BY b.applicant_email, coalesce(s.start_time, aps.start_time, b.requested_time)
              HAVING count(*) > 1
            ) double_booked_applicants
          ),
          'orphanBookedSlots',
          (
            SELECT count(*)::int
            FROM slots s
            LEFT JOIN bookings b
              ON b.slot_id = s.id
              AND b.status = 'accepted'
            WHERE s.status = 'booked'
              AND b.id IS NULL
          ),
          'acceptedWithoutBookedSlot',
          (
            SELECT count(*)::int
            FROM bookings b
            LEFT JOIN slots s ON b.slot_id = s.id
            WHERE b.status = 'accepted'
              AND b.slot_id IS NOT NULL
              AND s.status <> 'booked'
          )
        ) AS integrity
      FROM event_config ec
      LIMIT 1
    `)
  ).rows;

  if (!pulse) {
    return NextResponse.json(
      { error: "Event configuration not found" },
      {
        status: 503,
        headers: CORS_HEADERS,
      }
    );
  }

  return NextResponse.json(
    {
      generatedAt: pulse.generated_at,
      event: {
        name: pulse.event_name,
        displayDate: pulse.display_date,
        location: pulse.location,
        mode: pulse.mode,
        modeLocked: pulse.mode_locked,
        emergencyFallback: pulse.emergency_fallback,
        jobModerationEnabled: pulse.job_moderation_enabled,
        studentCancellationEnabled: pulse.student_cancellation_enabled,
      },
      counts: {
        applicants: pulse.applicants,
        recruiters: pulse.recruiters,
        approvedJobs: pulse.approved_jobs,
        recruiterSlots: pulse.recruiter_slots,
        availableSlots: pulse.available_slots,
        bookedSlots: pulse.booked_slots,
        applicantSlots: pulse.applicant_slots,
        bookings: pulse.bookings,
        notifications: pulse.notifications,
        pushSubscriptions: pulse.push_subscriptions,
        emailsToday: pulse.emails_today,
      },
      bookingStatus: pulse.booking_status,
      slotStatus: pulse.slot_status,
      companies: pulse.companies,
      integrity: pulse.integrity,
      features: [
        {
          key: "atomic-booking",
          title: "Atomic booking engine",
          summary:
            "Recruiter acceptances claim interviewer slots with Postgres locks and SKIP LOCKED to avoid double-booking under bursts.",
        },
        {
          key: "venue-auth",
          title: "Venue-safe authentication",
          summary:
            "Two-tier rate limits protect accounts without locking out a shared event Wi-Fi NAT.",
        },
        {
          key: "notification-primary",
          title: "Notification-primary workflow",
          summary:
            "Applications produce in-app notifications and push where enabled, with email as operational backup.",
        },
        {
          key: "admin-control",
          title: "Event-day admin control",
          summary:
            "Admins can lock mode, disable student cancellation, control moderation, and correct times without SQL.",
        },
      ],
    },
    {
      headers: {
        ...CORS_HEADERS,
        ...rateLimitHeaders(remaining, reset),
        "Cache-Control": "public, max-age=5, stale-while-revalidate=25",
      },
    }
  );
}
