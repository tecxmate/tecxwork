/**
 * Regression test for the mobile contents drawer.
 *
 *   node docs/manual/src/check-mobile-nav.mjs docs/manual/tecxwork-platform-manual.html
 *
 * Runs in WebKit at an iPhone-sized viewport, because that is what the drawer exists for.
 * Checks the things that actually break in off-canvas navs: that the contents are hidden
 * (and untabbable) until asked for, that every way of dismissing it works, that tapping a
 * link both closes the drawer and still lands on the right section, and that the body
 * scroll lock is always released -- a drawer that leaves `overflow:hidden` behind makes the
 * whole document unscrollable.
 */
import { webkit } from '/Users/niko/antigravity/tecxwork/node_modules/playwright-core/index.mjs';
import path from 'node:path';

const WEBKIT = '/Users/niko/Library/Caches/ms-playwright/webkit_mac14_arm64_special-2251/pw_run.sh';
const target = process.argv[2];
if (!target) { console.error('usage: node check-mobile-nav.mjs <built-html>'); process.exit(2); }
const FILE = 'file://' + path.resolve(target);

const browser = await webkit.launch({ executablePath: WEBKIT });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },      // iPhone 14
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
const fails = [];
const check = (name, ok, detail) => {
  if (ok) console.log(`  ✓ ${name}`);
  else { fails.push(name); console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};

const state = () => page.evaluate(() => {
  const rail = document.getElementById('rail');
  const cs = getComputedStyle(rail);
  return {
    open: rail.classList.contains('open'),
    visibility: cs.visibility,
    expanded: document.querySelector('.nav-toggle').getAttribute('aria-expanded'),
    bodyLocked: getComputedStyle(document.body).overflow === 'hidden',
    barVisible: getComputedStyle(document.querySelector('.nav-bar')).display !== 'none',
    railLeft: Math.round(rail.getBoundingClientRect().left),
    docOverflow: document.documentElement.scrollWidth - window.innerWidth,
  };
});

await page.goto(FILE, { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(1500);

let s = await state();
check('contents bar is shown on mobile', s.barVisible);
check('drawer starts closed and hidden', !s.open && s.visibility === 'hidden', `visibility=${s.visibility}`);
check('no horizontal page overflow', s.docOverflow <= 0, `${s.docOverflow}px`);
check('body is not scroll-locked at rest', !s.bodyLocked);

// links inside a closed drawer must not be reachable by keyboard
const tabbable = await page.evaluate(() =>
  document.getElementById('rail').matches(':has(a)') &&
  getComputedStyle(document.getElementById('rail')).visibility === 'hidden');
check('closed drawer is not tabbable (visibility:hidden)', tabbable);

await page.click('.nav-toggle');
await page.waitForTimeout(600);
s = await state();
check('tapping Contents opens the drawer', s.open && s.visibility === 'visible');
check('aria-expanded becomes true', s.expanded === 'true');
check('drawer is flush to the left edge', Math.abs(s.railLeft) <= 1, `left=${s.railLeft}`);
check('body scroll locks while open', s.bodyLocked);

await page.keyboard.press('Escape');
await page.waitForTimeout(600);
s = await state();
check('Escape closes the drawer', !s.open);
check('scroll lock released on close', !s.bodyLocked);

await page.click('.nav-toggle');
await page.waitForTimeout(500);
await page.click('.nav-scrim', { position: { x: 370, y: 500 } });
await page.waitForTimeout(600);
s = await state();
check('tapping the backdrop closes it', !s.open);

await page.click('.nav-toggle');
await page.waitForTimeout(500);
await page.click('.rail-close');
await page.waitForTimeout(600);
s = await state();
check('the close button works', !s.open);

// the real journey: open, tap a deep link, land on it with the drawer gone
await page.click('.nav-toggle');
await page.waitForTimeout(500);
await page.click('.rail a[href="#g-compliance"]');
await page.waitForTimeout(6000);
s = await state();
const landed = await page.evaluate(() => {
  const r = document.getElementById('g-compliance').getBoundingClientRect();
  const bar = document.querySelector('.nav-bar').getBoundingClientRect().height;
  return Math.round(r.top - bar);
});
check('tapping a link closes the drawer', !s.open);
check('…and releases the scroll lock', !s.bodyLocked);
check('…and lands on the right section', Math.abs(landed) < 90, `${landed}px from the bar`);

await page.screenshot({ path: path.resolve(path.dirname(target), 'src/.mobile-closed.png') });
await page.click('.nav-toggle');
await page.waitForTimeout(700);
await page.screenshot({ path: path.resolve(path.dirname(target), 'src/.mobile-open.png') });

console.log(fails.length ? `\n✗ ${fails.length} check(s) failed` : `\n✓ all mobile nav checks passed`);
await browser.close();
process.exit(fails.length ? 1 : 0);
