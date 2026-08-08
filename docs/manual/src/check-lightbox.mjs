/**
 * Regression test for the screenshot lightbox.
 *
 *   node docs/manual/src/check-lightbox.mjs docs/manual/tecxwork-platform-manual.html
 *
 * Runs in WebKit at phone size, since enlarging is mostly a mobile need. The checks that
 * earn their keep:
 *
 *   - the two explanatory SVG diagrams must NOT be in the gallery (they are vector, already
 *     legible, and would read as broken entries between screenshots)
 *   - next/prev must wrap rather than dead-end at either extreme
 *   - the body scroll lock has to be released on every dismissal path, or the document
 *     becomes unscrollable behind a closed lightbox
 */
import { webkit } from '/Users/niko/antigravity/tecxwork/node_modules/playwright-core/index.mjs';
import path from 'node:path';
import os from 'node:os';

const WEBKIT = '/Users/niko/Library/Caches/ms-playwright/webkit_mac14_arm64_special-2251/pw_run.sh';
const target = process.argv[2];
if (!target) { console.error('usage: node check-lightbox.mjs <built-html>'); process.exit(2); }
const FILE = 'file://' + path.resolve(target);

const browser = await webkit.launch({ executablePath: WEBKIT });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
});
const page = await ctx.newPage();
const fails = [];
const check = (name, ok, detail) => {
  if (ok) console.log(`  ✓ ${name}`);
  else { fails.push(name); console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};

await page.goto(FILE, { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(2000);

const state = () => page.evaluate(() => {
  const box = document.getElementById('lightbox');
  return {
    open: box.classList.contains('on'),
    count: document.getElementById('lb-count').textContent.trim(),
    title: document.getElementById('lb-title').textContent.trim(),
    imgSrcHead: (document.querySelector('#lb-stage img') || {}).src?.slice(0, 60) || '',
    locked: getComputedStyle(document.body).overflow === 'hidden',
  };
});

const counts = await page.evaluate(() => ({
  gallery: document.querySelectorAll('img.shot-open').length,
  diagramImgs: document.querySelectorAll('.diagram img.shot-open').length,
  totalShots: document.querySelectorAll('figure img, img.inline-shot').length,
}));
check('every screenshot is clickable', counts.gallery === 51, `${counts.gallery} tagged`);
check('the SVG diagrams are excluded', counts.diagramImgs === 0);
check('closed at rest', !(await state()).open);

await page.click('img.shot-open');
await page.waitForTimeout(700);
let s = await state();
check('tapping a screenshot opens the lightbox', s.open);
check('shows a position counter', /^1 \/ 51$/.test(s.count), s.count);
check('shows a caption', s.title.length > 3, s.title.slice(0, 40));
check('renders the enlarged image', s.imgSrcHead.startsWith('data:image/webp'));
check('body scroll locks while open', s.locked);

await page.click('#lb-next');
await page.waitForTimeout(450);
s = await state();
check('next advances', s.count === '2 / 51', s.count);

await page.click('#lb-prev');
await page.click('#lb-prev');
await page.waitForTimeout(450);
s = await state();
check('prev wraps past the first to the last', s.count === '51 / 51', s.count);

await page.click('#lb-next');
await page.waitForTimeout(450);
s = await state();
check('next wraps past the last to the first', s.count === '1 / 51', s.count);

await page.keyboard.press('ArrowRight');
await page.waitForTimeout(400);
s = await state();
check('arrow keys move', s.count === '2 / 51', s.count);

// zoom: fitted by default, magnified and pannable when toggled
const zoomState = () => page.evaluate(() => {
  const img = document.querySelector('#lb-stage img');
  const stage = document.getElementById('lb-stage');
  return {
    zoom: document.getElementById('lightbox').classList.contains('zoom'),
    imgW: Math.round(img.getBoundingClientRect().width),
    stageW: Math.round(stage.clientWidth),
    pressed: document.getElementById('lb-zoom').getAttribute('aria-pressed'),
  };
});
let z = await zoomState();
check('opens fitted to the screen', !z.zoom && z.imgW <= z.stageW + 1, `${z.imgW}px in ${z.stageW}px`);

await page.click('#lb-zoom');
await page.waitForTimeout(400);
z = await zoomState();
check('zoom magnifies beyond the viewport', z.zoom && z.imgW > z.stageW, `${z.imgW}px in ${z.stageW}px`);
check('zoom button reports pressed', z.pressed === 'true');

await page.click('#lb-next');
await page.waitForTimeout(450);
z = await zoomState();
check('moving to the next shot resets to fitted', !z.zoom);

await page.keyboard.press('Escape');
await page.waitForTimeout(500);
s = await state();
check('Escape closes', !s.open);
check('scroll lock released', !s.locked);

// backdrop dismissal
await page.click('img.shot-open');
await page.waitForTimeout(600);
await page.evaluate(() => document.getElementById('lightbox').click());
await page.waitForTimeout(500);
s = await state();
check('tapping the backdrop closes', !s.open);
check('…and releases the lock', !s.locked);

// swipe
await page.click('img.shot-open');
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(os.tmpdir(), '.lightbox.png') });
await browser.close();

// ---- swipe, checked in Chromium -------------------------------------------------------
// Headless WebKit will not let a script synthesise touches: `new Touch(...)` is an "Illegal
// constructor" and document.createTouch throws a type error. The swipe handler is plain
// browser-agnostic JS, so it is exercised in Chromium instead; the WebKit-specific concerns
// (layout, scroll lock, dismissal) are all covered above.
const { chromium } = await import('/Users/niko/antigravity/tecxwork/node_modules/playwright-core/index.mjs');
const CHROME = '/Users/niko/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/'
             + 'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const cBrowser = await chromium.launch({ executablePath: CHROME });
const cCtx = await cBrowser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const cPage = await cCtx.newPage();
await cPage.goto(FILE, { waitUntil: 'load', timeout: 120000 });
await cPage.waitForTimeout(1800);
await cPage.click('img.shot-open');
await cPage.waitForTimeout(600);

const swipe = async (fromX, toX) => cPage.evaluate(([fromX, toX]) => {
  const el = document.getElementById('lb-stage');
  const mk = (x) => new Touch({ identifier: 1, target: el, clientX: x, clientY: 400 });
  el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, changedTouches: [mk(fromX)] }));
  el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, changedTouches: [mk(toX)] }));
}, [fromX, toX]);

const counter = () => cPage.evaluate(() => document.getElementById('lb-count').textContent.trim());

await swipe(300, 110);            // swipe left == next
await cPage.waitForTimeout(400);
check('swiping left advances', (await counter()) === '2 / 51', await counter());

await swipe(110, 300);            // swipe right == previous
await cPage.waitForTimeout(400);
check('swiping right goes back', (await counter()) === '1 / 51', await counter());

await swipe(300, 285);            // too small to count as a swipe
await cPage.waitForTimeout(400);
check('a small drag is ignored', (await counter()) === '1 / 51', await counter());

await cBrowser.close();

console.log(fails.length ? `\n✗ ${fails.length} check(s) failed` : `\n✓ all lightbox checks passed`);
process.exit(fails.length ? 1 : 0);
