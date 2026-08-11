/**
 * Regression test: every sidebar link must land on the section it points at.
 *
 *   node docs/manual/src/check-anchors.mjs docs/manual/tecxwork-platform-manual.html
 *
 * Runs in WebKit (Safari's engine) with the page's own smooth scrolling left ON. That exact
 * combination is what surfaced the original bug, and neither of the obvious simplifications
 * reproduces it:
 *
 *   - Chromium decodes `data:` URI images immediately even when they are marked
 *     loading="lazy", so the layout never shifts and the test passes vacuously.
 *   - With smooth scrolling disabled the jump is instant, so images get no chance to load
 *     mid-animation and move the target out from under it.
 *
 * The failure it guards against: an <img> with no width/height reserves no space, so during
 * a long smooth scroll the images above the target finish loading, the document grows, and
 * the animation lands thousands of pixels short of where it aimed. Clicking
 * "4.1 Every booking" used to leave you looking at "2.4 Company profile".
 *
 * Keep width/height on every image in build.py and this stays green.
 */
import { webkit, chromium } from 'playwright-core';
import path from 'node:path';

const WEBKIT = process.env.WEBKIT_PATH; // unset -> fall back to chromium (weaker: see README)
const EXEC = process.env.CHROMIUM_PATH || undefined;
const TOLERANCE_PX = 90;   // section top should sit at the viewport top, give or take

const target = process.argv[2];
if (!target) {
  console.error('usage: node check-anchors.mjs <path-to-built-html>');
  process.exit(2);
}
const FILE = 'file://' + path.resolve(target);

const browser = await (WEBKIT ? webkit.launch({ executablePath: WEBKIT }) : chromium.launch(EXEC ? { executablePath: EXEC } : {}));
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();

await page.goto(FILE, { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(1500);

const links = await page.evaluate(() =>
  [...document.querySelectorAll('.rail a[href^="#"]')].map((a) => ({
    label: a.textContent.trim(),
    id: a.getAttribute('href').slice(1),
  })));

let bad = 0;
for (const link of links) {
  // Reload each time: this is the real "open the page, click a deep link" case, where
  // nothing below the fold has been lazily decoded yet.
  await page.goto(FILE, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.click(`.rail a[href="#${link.id}"]`);
  await page.waitForTimeout(6000);   // let the smooth scroll finish AND images settle

  const result = await page.evaluate((id) => {
    const el = document.getElementById(id);
    const heads = [...document.querySelectorAll('.screen-head h3, .act h2')];
    let nearest = null;
    let best = Infinity;
    for (const h of heads) {
      const d = Math.abs(h.getBoundingClientRect().top - 60);
      if (d < best) { best = d; nearest = h.textContent.trim().slice(0, 44); }
    }
    return { top: Math.round(el.getBoundingClientRect().top), nearest };
  }, link.id);

  if (Math.abs(result.top) >= TOLERANCE_PX) {
    bad++;
    console.log(`  ✗ ${link.label.padEnd(28)} off by ${String(result.top).padStart(7)}px `
              + `— showing "${result.nearest}"`);
  }
}

console.log(bad === 0
  ? `✓ all ${links.length} sidebar links land on their target`
  : `✗ ${bad} of ${links.length} sidebar links land in the wrong place`);

await browser.close();
process.exit(bad === 0 ? 0 : 1);
