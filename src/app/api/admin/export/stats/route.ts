import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PURPLE = "FF8C52FF";

// Format a timestamp in Asia/Taipei for the business team.
function tpe(d: Date | string | null | undefined): string {
  if (d == null) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(d))
    .replace(",", "");
}

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Raw SQL via db.execute — correlated subqueries are clearer here than the
  // query builder, and `::int` casts keep counts as numbers (the driver returns
  // bigint COUNT()s as strings otherwise).
  const rowsOf = async <T>(query: ReturnType<typeof sql>): Promise<T[]> => {
    const res = (await db.execute(query)) as unknown as { rows?: T[] };
    return (res.rows ?? (res as unknown as T[])) ?? [];
  };
  const one = async <T>(query: ReturnType<typeof sql>): Promise<T> =>
    (await rowsOf<T>(query))[0];

  const [
    companies,
    cvs,
    applications,
    jobs,
    slotsTotal,
    slotsBooked,
    bookingByStatus,
    byEvent,
    companyRows,
    applicantRows,
    applicationRows,
    jobRows,
  ] = await Promise.all([
    one<{ n: number }>(sql`SELECT count(*)::int n FROM recruiters`),
    one<{ n: number }>(sql`SELECT count(*)::int n FROM applicant_profiles`),
    one<{ n: number }>(sql`SELECT count(*)::int n FROM bookings`),
    one<{ n: number }>(sql`SELECT count(*)::int n FROM job_openings`),
    one<{ n: number }>(sql`SELECT count(*)::int n FROM slots`),
    one<{ n: number }>(sql`SELECT count(*)::int n FROM slots WHERE status='booked'`),
    rowsOf<{ status: string; n: number }>(
      sql`SELECT status, count(*)::int n FROM bookings GROUP BY status ORDER BY n DESC`
    ),
    // Per-event breakdown. applicant_profiles is global (no event_id), so a
    // per-event "applicants" count = distinct applicants in that event's bookings.
    rowsOf<{
      id: number; slug: string; name: string; status: string;
      companies: number; jobs: number; applicants: number;
      applications: number; slots: number; booked_slots: number;
    }>(sql`
      SELECT e.id, e.slug, e.name, e.status,
        (SELECT count(*) FROM recruiters r WHERE r.event_id = e.id)::int companies,
        (SELECT count(*) FROM job_openings j WHERE j.event_id = e.id)::int jobs,
        (SELECT count(DISTINCT b.applicant_id) FROM bookings b WHERE b.event_id = e.id)::int applicants,
        (SELECT count(*) FROM bookings b WHERE b.event_id = e.id)::int applications,
        (SELECT count(*) FROM slots s WHERE s.event_id = e.id)::int slots,
        (SELECT count(*) FROM slots s WHERE s.event_id = e.id AND s.status='booked')::int booked_slots
      FROM events e ORDER BY e.id`),
    rowsOf<{
      id: number; event_id: number | null; company: string; industry: string;
      contact_email: string; interviewer_count: number; created_at: string;
      jobs: number; slots: number; booked_slots: number;
      applications: number; accepted: number; pending: number;
    }>(sql`
      SELECT r.id, r.event_id, r.company, r.industry, r.contact_email, r.interviewer_count, r.created_at,
        (SELECT count(*) FROM job_openings j WHERE j.recruiter_id = r.id)::int jobs,
        (SELECT count(*) FROM slots s WHERE s.recruiter_id = r.id)::int slots,
        (SELECT count(*) FROM slots s WHERE s.recruiter_id = r.id AND s.status='booked')::int booked_slots,
        (SELECT count(*) FROM bookings b WHERE b.recruiter_id = r.id)::int applications,
        (SELECT count(*) FROM bookings b WHERE b.recruiter_id = r.id AND b.status='accepted')::int accepted,
        (SELECT count(*) FROM bookings b WHERE b.recruiter_id = r.id AND b.status='pending')::int pending
      FROM recruiters r ORDER BY applications DESC, r.company`),
    rowsOf<{
      id: number; name: string; email: string; nationality: string;
      school_name: string; major: string; study_level: string;
      cv_link: string; created_at: string; applications: number;
    }>(sql`
      SELECT ap.id, ap.name, ap.email, ap.nationality, ap.school_name, ap.major,
        ap.study_level, ap.cv_link, ap.created_at,
        (SELECT count(*) FROM bookings b WHERE b.applicant_id = ap.id)::int applications
      FROM applicant_profiles ap ORDER BY ap.created_at`),
    rowsOf<{
      id: number; event_id: number | null; direction: string; status: string;
      applicant_name: string; applicant_email: string; company: string | null;
      position: string | null; requested_time: string | null; cv_link: string; created_at: string;
    }>(sql`
      SELECT b.id, b.event_id, b.direction, b.status, b.applicant_name, b.applicant_email,
        r.company, b.position, b.requested_time, b.cv_link, b.created_at
      FROM bookings b LEFT JOIN recruiters r ON r.id = b.recruiter_id
      ORDER BY b.created_at`),
    rowsOf<{
      id: number; event_id: number | null; company: string | null; title: string;
      job_category: string; location: string; employment_type: string;
      moderation_status: string; created_at: string;
    }>(sql`
      SELECT j.id, j.event_id, r.company, j.title, j.job_category, j.location,
        j.employment_type, j.moderation_status, j.created_at
      FROM job_openings j LEFT JOIN recruiters r ON r.id = j.recruiter_id
      ORDER BY j.id`),
  ]);

  // ================= Build the workbook =================
  const wb = new ExcelJS.Workbook();
  wb.creator = "TECXWORK";

  const styleHeader = (row: ExcelJS.Row) => {
    row.font = { bold: true, color: { argb: "FFFFFFFF" } };
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE } };
    row.alignment = { vertical: "middle" };
  };
  const addSheet = (
    name: string,
    columns: Partial<ExcelJS.Column>[],
    rows: Record<string, unknown>[]
  ) => {
    const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = columns as ExcelJS.Column[];
    styleHeader(ws.getRow(1));
    rows.forEach((r) => ws.addRow(r));
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
    return ws;
  };

  // ---- Sheet 1: Summary ----
  const sum = wb.addWorksheet("Summary");
  sum.columns = [{ width: 40 }, { width: 16 }] as ExcelJS.Column[];
  sum.mergeCells("A1:B1");
  const title = sum.getCell("A1");
  title.value = "TECXWORK — System Stats Export";
  title.font = { bold: true, size: 16, color: { argb: PURPLE } };
  sum.getCell("A2").value = "Generated (Asia/Taipei)";
  sum.getCell("B2").value = tpe(new Date());
  let rIdx = 4;
  const kpi = (label: string, value: number | string) => {
    sum.getCell(`A${rIdx}`).value = label;
    sum.getCell(`A${rIdx}`).font = { bold: true };
    sum.getCell(`B${rIdx}`).value = value;
    rIdx++;
  };
  kpi("Số công ty đăng tuyển (Companies)", companies.n);
  kpi("Số CV đăng tải (CVs uploaded)", cvs.n);
  kpi("Số CV apply (Applications / bookings)", applications.n);
  kpi("Số tin tuyển dụng (Job openings)", jobs.n);
  kpi("Tổng slot phỏng vấn (Interview slots)", slotsTotal.n);
  kpi("Slot đã đặt (Booked slots)", slotsBooked.n);
  rIdx++;
  sum.getCell(`A${rIdx}`).value = "Applications by status";
  sum.getCell(`A${rIdx}`).font = { bold: true, color: { argb: PURPLE } };
  rIdx++;
  bookingByStatus.forEach((s) => kpi(`  ${s.status}`, s.n));

  // ---- Sheet 2: By Event ----
  addSheet(
    "By Event",
    [
      { header: "Event ID", key: "id", width: 9 },
      { header: "Slug", key: "slug", width: 18 },
      { header: "Name", key: "name", width: 32 },
      { header: "Status", key: "status", width: 12 },
      { header: "Companies", key: "companies", width: 12 },
      { header: "Job openings", key: "jobs", width: 13 },
      { header: "Applicants", key: "applicants", width: 12 },
      { header: "Applications", key: "applications", width: 13 },
      { header: "Slots", key: "slots", width: 9 },
      { header: "Booked slots", key: "booked_slots", width: 13 },
    ],
    byEvent
  );

  // ---- Sheet 3: Companies ----
  addSheet(
    "Companies",
    [
      { header: "ID", key: "id", width: 7 },
      { header: "Event", key: "event_id", width: 8 },
      { header: "Company", key: "company", width: 32 },
      { header: "Industry", key: "industry", width: 20 },
      { header: "Contact email", key: "contact_email", width: 28 },
      { header: "Interviewers", key: "interviewer_count", width: 12 },
      { header: "Job openings", key: "jobs", width: 12 },
      { header: "Slots", key: "slots", width: 9 },
      { header: "Booked slots", key: "booked_slots", width: 12 },
      { header: "Applications", key: "applications", width: 12 },
      { header: "Accepted", key: "accepted", width: 10 },
      { header: "Pending", key: "pending", width: 10 },
      { header: "Created", key: "created", width: 17 },
    ],
    companyRows.map((r) => ({ ...r, created: tpe(r.created_at) }))
  );

  // ---- Sheet 4: Applicants (CVs) ----
  addSheet(
    "Applicants (CVs)",
    [
      { header: "ID", key: "id", width: 7 },
      { header: "Name", key: "name", width: 22 },
      { header: "Email", key: "email", width: 28 },
      { header: "Nationality", key: "nationality", width: 14 },
      { header: "School", key: "school_name", width: 26 },
      { header: "Major", key: "major", width: 22 },
      { header: "Study level", key: "study_level", width: 14 },
      { header: "Applications", key: "applications", width: 12 },
      { header: "CV link", key: "cv_link", width: 40 },
      { header: "Created", key: "created", width: 17 },
    ],
    applicantRows.map((r) => ({ ...r, created: tpe(r.created_at) }))
  );

  // ---- Sheet 5: Applications (bookings) ----
  addSheet(
    "Applications",
    [
      { header: "ID", key: "id", width: 7 },
      { header: "Event", key: "event_id", width: 8 },
      { header: "Direction", key: "direction", width: 26 },
      { header: "Status", key: "status", width: 14 },
      { header: "Applicant", key: "applicant_name", width: 22 },
      { header: "Email", key: "applicant_email", width: 28 },
      { header: "Company", key: "company", width: 30 },
      { header: "Position", key: "position", width: 22 },
      { header: "Requested time", key: "requested", width: 17 },
      { header: "CV link", key: "cv_link", width: 40 },
      { header: "Created", key: "created", width: 17 },
    ],
    applicationRows.map((r) => ({
      ...r,
      requested: tpe(r.requested_time),
      created: tpe(r.created_at),
    }))
  );

  // ---- Sheet 6: Job openings ----
  addSheet(
    "Job openings",
    [
      { header: "ID", key: "id", width: 7 },
      { header: "Event", key: "event_id", width: 8 },
      { header: "Company", key: "company", width: 30 },
      { header: "Title", key: "title", width: 32 },
      { header: "Category", key: "job_category", width: 20 },
      { header: "Location", key: "location", width: 18 },
      { header: "Type", key: "employment_type", width: 14 },
      { header: "Moderation", key: "moderation_status", width: 14 },
      { header: "Created", key: "created", width: 17 },
    ],
    jobRows.map((r) => ({ ...r, created: tpe(r.created_at) }))
  );

  const buffer = await wb.xlsx.writeBuffer();
  const stamp = tpe(new Date()).slice(0, 10);

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="tecxwork-stats-${stamp}.xlsx"`,
    },
  });
}
