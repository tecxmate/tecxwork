/**
 * Billing / offers demo layer — the data the 2026-08-09 sessions created live via the
 * API on the deployed demo DB, scripted so a fresh demo world (including a local one)
 * carries it too: client fee rates, offers at several statuses, completed placements
 * with salaries and fees, invoices (draft / issued / paid), and one credit note.
 *
 * Idempotent by document number and offer application. Demo DB only.
 *   DATABASE_URL="<demo>" npx tsx src/lib/db/seed-yang-luck-billing.ts
 */
import { seedSql } from "./seed-sql";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  if (/delicate-lab|bitter-hill/.test(url)) throw new Error("Refusing: PROD host.");
  const sql = seedSql(url);

  const [org] = await sql`SELECT id FROM orgs WHERE slug='yang-luck'`;
  if (!org) throw new Error("Run add-ats-tenancy first (no yang-luck org).");
  const orgId = org.id as number;
  const [agent] = await sql`
    SELECT u.id FROM users u JOIN memberships m ON m.user_id=u.id AND m.org_id=${orgId}
    WHERE u.email='hr@yangluck.demo'`;
  const agentId = (agent?.id as number) ?? null;

  // 1. Fee rates on the three biggest clients: 1.2 months (the Taiwan convention).
  const rated = await sql`
    UPDATE clients SET fee_basis='months_salary', fee_value=120
    WHERE id IN (
      SELECT c.id FROM clients c JOIN job_orders j ON j.client_id=c.id AND j.org_id=${orgId}
      GROUP BY c.id ORDER BY count(*) DESC LIMIT 3
    ) RETURNING id`;

  // 2. Give the two placements real terms: salary, 1.2-month fee, dates, guarantee.
  await sql`
    UPDATE placements SET
      salary = CASE id WHEN 1 THEN 38000 ELSE 34000 END,
      fee_amount = CASE id WHEN 1 THEN 45600 ELSE 40800 END,
      status = 'started',
      start_date = to_char(now() - interval '35 days', 'YYYY-MM-DD'),
      probation_until = to_char(now() + interval '55 days', 'YYYY-MM-DD'),
      guarantee_until = to_char(now() + interval '55 days', 'YYYY-MM-DD')
    WHERE org_id=${orgId} AND id IN (1,2)`;

  // 3. Offers for the offer-stage candidates: a lifecycle spread the Offers screen can show.
  const offerApps = await sql`
    SELECT a.id AS app_id, s.candidate_id, s.job_order_id, j.title
    FROM applications a
    JOIN pipeline_stages ps ON ps.id = a.stage_id AND ps.stage_kind = 'offer'
    JOIN submissions s ON s.application_id = a.id
    JOIN job_orders j ON j.id = s.job_order_id
    WHERE a.org_id=${orgId}
    ORDER BY a.id LIMIT 6`;
  const statuses = ["draft", "approved", "sent", "accepted", "sent", "declined"];
  let offers = 0;
  for (let i = 0; i < offerApps.length; i++) {
    const o = offerApps[i];
    const st = statuses[i % statuses.length];
    const res = await sql`
      INSERT INTO offers (org_id, application_id, candidate_id, job_order_id, status, salary,
                          currency, salary_period, start_date, probation_months, notes,
                          created_by_user_id, approved_by_user_id,
                          approved_at, sent_at, responded_at, decline_reason)
      SELECT ${orgId}, ${o.app_id}, ${o.candidate_id}, ${o.job_order_id}, ${st}::offer_status,
             33000 + (${i}::int * 1500), 'TWD', 'month',
             to_char(now() + interval '30 days','YYYY-MM-DD'), 3,
             ${"Standard terms — " + o.title}::text, ${agentId}::int,
             CASE WHEN ${st} <> 'draft' THEN ${agentId}::int END,
             CASE WHEN ${st} <> 'draft' THEN now() - interval '9 days' END,
             CASE WHEN ${st} IN ('sent','accepted','declined') THEN now() - interval '7 days' END,
             CASE WHEN ${st} IN ('accepted','declined') THEN now() - interval '4 days' END,
             CASE WHEN ${st} = 'declined' THEN 'Accepted a role closer to family in Taoyuan' END
      WHERE NOT EXISTS (SELECT 1 FROM offers WHERE application_id=${o.app_id})
      RETURNING id`;
    offers += res.length;
  }

  // 4. Invoices: fee for placement 1 paid (with a credit note), placement 2 issued.
  const mkInvoice = async (
    num: string, placementId: number, amount: number, status: string,
    issuedDaysAgo: number, paidDaysAgo: number | null
  ) => {
    const [pl] = await sql`SELECT client_id FROM placements WHERE id=${placementId} AND org_id=${orgId}`;
    if (!pl) return 0;
    const tax = Math.round(amount * 0.05);
    const rows = await sql`
      INSERT INTO invoices (org_id, client_id, number, status, issue_date, due_date, currency,
                            subtotal, tax_rate_bp, tax_amount, total, paid_at, paid_amount,
                            notes, created_by_user_id)
      SELECT ${orgId}, ${pl.client_id}, ${num}, ${status}::invoice_status,
             to_char(now() - (${issuedDaysAgo}::int || ' days')::interval, 'YYYY-MM-DD'),
             to_char(now() + interval '20 days', 'YYYY-MM-DD'), 'TWD',
             ${amount}, 500, ${tax}, ${amount + tax},
             CASE WHEN ${paidDaysAgo}::int IS NOT NULL THEN now() - (${paidDaysAgo}::int || ' days')::interval END,
             CASE WHEN ${paidDaysAgo}::int IS NOT NULL THEN ${amount + tax}::int END,
             'Placement fee — 1.2 months of monthly salary', ${agentId}
      WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE org_id=${orgId} AND number=${num})
      RETURNING id`;
    if (!rows.length) return 0;
    await sql`
      INSERT INTO invoice_lines (invoice_id, placement_id, description, amount, voided)
      VALUES (${rows[0].id}, ${placementId}, 'Placement fee', ${amount}, false)
      ON CONFLICT DO NOTHING`;
    return rows.length;
  };
  const inv1 = await mkInvoice("INV-2026-0001", 1, 45600, "paid", 24, 10);
  const inv2 = await mkInvoice("INV-2026-0002", 2, 40800, "issued", 6, null);

  // 5. One credit note against the paid invoice — a negotiated 1,000 adjustment.
  const cn = await sql`
    INSERT INTO credit_notes (org_id, invoice_id, number, issue_date, subtotal, tax_rate_bp,
                              tax_amount, total, reason, created_by_user_id)
    SELECT ${orgId}, i.id, 'CN-2026-0001', to_char(now() - interval '5 days','YYYY-MM-DD'),
           1000, 500, 50, 1050, 'Negotiated onboarding adjustment', ${agentId}
    FROM invoices i
    WHERE i.org_id=${orgId} AND i.number='INV-2026-0001'
      AND NOT EXISTS (SELECT 1 FROM credit_notes WHERE org_id=${orgId} AND number='CN-2026-0001')
    RETURNING id`;

  console.log(
    `Billing demo layer: rated clients:${rated.length} offers:+${offers} ` +
      `invoices:+${inv1 + inv2} credit notes:+${cn.length}`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
