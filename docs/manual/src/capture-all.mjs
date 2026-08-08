import { chromium } from '/Users/niko/antigravity/tecxwork/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';

const BASE = 'http://localhost:3000';
const OUT = '/private/tmp/claude-501/-Users-niko-antigravity-tecxwork/3e6bbf8e-16b2-4b16-8eca-90293216b4b7/scratchpad/shots';
const EXEC = '/Users/niko/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
fs.mkdirSync(OUT, { recursive: true });

const log = [];
let browser;

const ctxFor = async (email) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  // Hide the Next.js dev-tools overlay so it never lands in a screenshot.
  await ctx.addInitScript(() => {
    const css = 'nextjs-portal,[data-nextjs-toast],#__next-dev-tools-indicator{display:none !important}';
    const inject = () => {
      if (document.getElementById('__cap_hide')) return;
      const s = document.createElement('style');
      s.id = '__cap_hide';
      s.textContent = css;
      (document.head || document.documentElement).appendChild(s);
    };
    inject();
    document.addEventListener('DOMContentLoaded', inject);
  });
  if (email) {
    const r = await ctx.request.post(`${BASE}/api/auth/login`, { data: { email, password: 'demo1234' } });
    if (!r.ok()) console.log(`  ! login ${email} -> ${r.status()}`);
  }
  return ctx;
};

const settle = async (page, ms = 2600) => {
  try { await page.waitForLoadState('networkidle', { timeout: 12000 }); } catch {}
  await page.waitForTimeout(ms);
};

const shot = async (page, name) => {
  const f = `${OUT}/${name}.png`;
  await page.screenshot({ path: f, fullPage: true });
  const kb = Math.round(fs.statSync(f).size / 1024);
  console.log(`  ✓ ${name} (${kb}kb)`);
  log.push({ name, url: page.url().replace(BASE, ''), kb });
};

const go = async (page, url, name, wait) => {
  await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await settle(page, wait);
  await shot(page, name);
};

// ---------------------------------------------------------------- PUBLIC
async function publicPass() {
  console.log('\n=== 1. PUBLIC / MARKETING ===');
  const ctx = await ctxFor(null);
  const page = await ctx.newPage();
  const list = [
    ['/', 'pub-01-home'],
    ['/get-started', 'pub-02-get-started'],
    ['/login', 'pub-03-login'],
    ['/register', 'pub-04-register-student'],
    ['/recruiter/signup', 'pub-05-register-recruiter'],
    ['/forgot-password', 'pub-06-forgot-password'],
    ['/browse', 'pub-07-browse-companies'],
    ['/jobs', 'pub-08-jobs-board'],
    ['/jobs/43', 'pub-09-job-detail'],
    ['/recruiter/10', 'pub-10-company-profile'],
    ['/about', 'pub-11-about'],
    ['/tutorial', 'pub-12-tutorial'],
    ['/privacy-policy', 'pub-13-privacy'],
    ['/terms-of-service', 'pub-14-terms'],
  ];
  for (const [u, n] of list) { try { await go(page, u, n); } catch (e) { console.log(`  ✗ ${n}: ${e.message.slice(0,80)}`); } }

  // job category page — discover a real category link
  try {
    await page.goto(`${BASE}/jobs`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const href = await page.locator('a[href^="/jobs/cat/"]').first().getAttribute('href').catch(() => null);
    if (href) await go(page, href, 'pub-15-jobs-by-category');
  } catch (e) { console.log(`  ✗ category: ${e.message.slice(0,80)}`); }

  await ctx.close();
}

// ---------------------------------------------------------------- APPLICANT
async function applicantPass() {
  console.log('\n=== 2. APPLICANT ===');
  const ctx = await ctxFor('student@yangluck.demo');
  const page = await ctx.newPage();

  await go(page, '/profile', 'app-01-profile-basic');
  const tabs = ['Education', 'Career Preferences', 'Work Experience', 'Certifications', 'Skills', 'CV / QR', 'My Applications'];
  let i = 2;
  for (const t of tabs) {
    try {
      await page.getByRole('button', { name: t, exact: true }).first().click();
      await page.waitForTimeout(1600);
      await shot(page, `app-0${i}-profile-${t.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')}`);
    } catch (e) { console.log(`  ✗ tab ${t}: ${e.message.slice(0,70)}`); }
    i++;
  }

  await go(page, '/browse', 'app-09-browse');
  try {
    const s = page.locator('input[type=search]').first();
    await s.fill('麗明'); await page.waitForTimeout(2200);
    await shot(page, 'app-10-browse-search');
  } catch {}

  await go(page, '/jobs', 'app-11-jobs-search');
  await go(page, '/jobs/43', 'app-12-job-detail');

  // Apply flow on a company that still has free slots
  try {
    await page.goto(`${BASE}/recruiter/16`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await shot(page, 'app-13-apply-company');
    await page.getByRole('button', { name: 'Apply', exact: true }).first().click();
    await page.waitForTimeout(2800);
    await shot(page, 'app-14-apply-pick-slot');
    const btns = page.locator('button:not([disabled])');
    const n = await btns.count();
    for (let k = 0; k < n; k++) {
      const t = (await btns.nth(k).innerText().catch(() => '')).trim();
      if (/^\d{1,2}:\d{2}$/.test(t)) { await btns.nth(k).click(); break; }
    }
    await page.waitForTimeout(2200);
    await shot(page, 'app-15-apply-booking-form');
    const cb = page.locator('input[type=checkbox], [role=checkbox]');
    for (let k = 0; k < await cb.count(); k++) await cb.nth(k).click({ force: true }).catch(() => {});
    await page.waitForTimeout(700);
    await shot(page, 'app-16-apply-consent');
    await page.getByRole('button', { name: /request booking|confirm/i }).first().click();
    await page.waitForTimeout(6000);
    await shot(page, 'app-17-apply-confirmed');
  } catch (e) { console.log(`  ✗ apply flow: ${e.message.slice(0,90)}`); }

  // applications tab after booking
  try { await go(page, '/profile', 'app-18-profile-after-apply'); } catch {}
  await go(page, '/feedback', 'app-19-feedback');
  await ctx.close();
}

// ------------------------------------------------- RECRUITER (agency = ATS)
async function agencyPass() {
  console.log('\n=== 3. RECRUITER — AGENCY (ATS) ===');
  const ctx = await ctxFor('hr@yangluck.demo');
  const page = await ctx.newPage();

  await go(page, '/dashboard/pipeline', 'rec-01-pipeline-board', 3400);

  // open candidate drawer
  try {
    await page.locator('[draggable="true"], [data-rbd-draggable-id]').first().click({ timeout: 6000 });
    await page.waitForTimeout(2400);
    await shot(page, 'rec-02-pipeline-candidate-drawer');
  } catch {
    try {
      await page.getByText(/Rizky Pratama|Bùi Thanh Sơn/).first().click();
      await page.waitForTimeout(2400);
      await shot(page, 'rec-02-pipeline-candidate-drawer');
    } catch (e) { console.log(`  ✗ drawer: ${e.message.slice(0,70)}`); }
  }

  // switch client tab
  try {
    await page.goto(`${BASE}/dashboard/pipeline`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await page.getByRole('button', { name: /巨大機械/ }).first().click();
    await page.waitForTimeout(2600);
    await shot(page, 'rec-03-pipeline-client-switch');
  } catch (e) { console.log(`  ✗ client switch: ${e.message.slice(0,70)}`); }

  await go(page, '/dashboard/clients', 'rec-04-clients');
  await go(page, '/dashboard/compliance', 'rec-05-compliance');
  await go(page, '/dashboard/reports', 'rec-06-reports');
  await go(page, '/dashboard/jobs', 'rec-07-jobs-list');
  try {
    await page.getByRole('button', { name: 'Add', exact: true }).first().click();
    await page.waitForTimeout(1800);
    await shot(page, 'rec-08-jobs-create-form');
  } catch (e) { console.log(`  ✗ add job: ${e.message.slice(0,70)}`); }
  await go(page, '/dashboard/company', 'rec-09-company-profile');
  await ctx.close();
}

// ------------------------------------------- RECRUITER (company = interviews)
async function companyRecruiterPass() {
  console.log('\n=== 4. RECRUITER — CLIENT COMPANY (interviews) ===');
  const ctx = await ctxFor('co-yanghong@yangluck.demo');
  const page = await ctx.newPage();
  await go(page, '/dashboard/applicants', 'rec-10-applicant-approvals', 3200);
  await go(page, '/dashboard/interviews', 'rec-11-interview-schedule', 3200);
  await ctx.close();
}

// ---------------------------------------------------------------- ADMIN
async function adminPass() {
  console.log('\n=== 5. ADMIN ===');
  const ctx = await ctxFor('admin@yangluck.demo');
  const page = await ctx.newPage();

  await go(page, '/admin/interviews', 'adm-01-bookings', 3200);
  try {
    await page.getByRole('button', { name: /^All/ }).first().click();
    await page.waitForTimeout(1800);
    await shot(page, 'adm-02-bookings-all');
  } catch (e) { console.log(`  ✗ all tab: ${e.message.slice(0,70)}`); }

  await go(page, '/admin/jobs', 'adm-03-job-moderation');
  await go(page, '/admin/jobs/43', 'adm-04-job-moderation-detail');
  await go(page, '/admin/applicants', 'adm-05-applicants');
  await go(page, '/admin/recruiters', 'adm-06-recruiters');

  await go(page, '/admin/settings', 'adm-07-settings-overview');
  const stabs = ['General', 'Event Branding', 'Feedback & bugs', 'Interview Time Frame', 'Tools & Media'];
  let i = 8;
  for (const t of stabs) {
    try {
      await page.getByRole('button', { name: t, exact: true }).first().click();
      await page.waitForTimeout(1800);
      await shot(page, `adm-${String(i).padStart(2, '0')}-settings-${t.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')}`);
    } catch (e) { console.log(`  ✗ settings ${t}: ${e.message.slice(0,70)}`); }
    i++;
  }
  await ctx.close();
}

async function run() {
  browser = await chromium.launch({ executablePath: EXEC });
  await publicPass();
  await applicantPass();
  await agencyPass();
  await companyRecruiterPass();
  await adminPass();
  await browser.close();
  fs.writeFileSync(`${OUT}/_manifest.json`, JSON.stringify(log, null, 2));
  console.log(`\nDONE — ${log.length} screenshots.`);
}
run().catch((e) => { console.error(e); process.exit(1); });
