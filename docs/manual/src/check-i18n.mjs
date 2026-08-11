/**
 * Regression test for the trilingual switcher.
 *
 *   node docs/manual/src/check-i18n.mjs docs/manual/tecxwork-platform-manual.html
 *
 * The screenshots are ~7.4 MB of base64, so building three separate pages would store them
 * three times. Instead one page carries all three dictionaries and swaps text at runtime.
 * That buys a lot of size back but creates its own failure modes, which is what this checks:
 * a key that silently stays English, HTML tags dropped by a translation, and the anchors in
 * the sidebar breaking because a translated link lost its href.
 */
import { webkit, chromium } from 'playwright-core';
import path from 'node:path';

const WEBKIT = process.env.WEBKIT_PATH; // unset -> fall back to chromium (weaker: see README)
const EXEC = process.env.CHROMIUM_PATH || undefined;
const target = process.argv[2];
if (!target) { console.error('usage: node check-i18n.mjs <built-html>'); process.exit(2); }
const FILE = 'file://' + path.resolve(target);

const browser = await (WEBKIT ? webkit.launch({ executablePath: WEBKIT }) : chromium.launch(EXEC ? { executablePath: EXEC } : {}));
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
const fails = [];
const check = (name, ok, detail) => {
  if (ok) console.log(`  ✓ ${name}`);
  else { fails.push(name); console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};

await page.goto(FILE, { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(2000);

const dict = await page.evaluate(() => ({
  langs: Object.keys(window.__I18N || {}),
  counts: Object.fromEntries(Object.entries(window.__I18N || {}).map(([k, v]) => [k, Object.keys(v).length])),
  tagged: document.querySelectorAll('[data-t]').length,
}));
check('all three dictionaries are present', dict.langs.join(',') === 'en,zh,vi', dict.langs.join(','));
check('every language covers every unit',
  new Set(Object.values(dict.counts)).size === 1, JSON.stringify(dict.counts));
check('the document is fully tagged', dict.tagged > 1000, `${dict.tagged} elements`);

const snapshot = () => page.evaluate(() => {
  const el = (sel) => (document.querySelector(sel) || {}).textContent || '';
  return {
    lang: document.documentElement.getAttribute('lang'),
    title: document.title,
    h1: el('.hero h1'),
    lede: el('.hero .lede').slice(0, 60),
    firstRail: el('.rail ol a'),
    // every sidebar link must keep a working href through translation
    hrefs: [...document.querySelectorAll('.rail a')].filter(a => (a.getAttribute('href') || '').startsWith('#')).length,
    // any element left in English while another language is active?
    latinInDiagram: (document.querySelector('#jobfair svg text') || {}).textContent || '',
  };
});

const en = await snapshot();
check('starts in English', en.lang === 'en' && /User Manual/.test(en.h1), en.h1);

for (const [code, label, expect] of [['zh', '繁中', /使用手冊/], ['vi', 'VN', /Hướng dẫn/]]) {
  await page.click(`.rail .lang-switch button[data-lang="${code}"]`);
  await page.waitForTimeout(700);
  const s = await snapshot();
  check(`${label}: html lang set`, s.lang === (code === 'zh' ? 'zh-Hant' : 'vi'), s.lang);
  check(`${label}: headline translated`, expect.test(s.h1), s.h1);
  check(`${label}: body copy translated`, !/^TECXWORK is a hiring platform/.test(s.lede), s.lede);
  check(`${label}: document title translated`, expect.test(s.title), s.title);
  check(`${label}: sidebar links keep their hrefs`, s.hrefs === en.hrefs, `${s.hrefs} vs ${en.hrefs}`);
  check(`${label}: diagram labels translated`, s.latinInDiagram !== en.latinInDiagram, s.latinInDiagram);
}

// back to English
await page.click('.rail .lang-switch button[data-lang="en"]');
await page.waitForTimeout(700);
const back = await snapshot();
check('switching back restores English exactly', back.h1 === en.h1 && back.lede === en.lede);

// choice survives a reload
await page.click('.rail .lang-switch button[data-lang="vi"]');
await page.waitForTimeout(500);
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(2000);
const after = await snapshot();
check('the chosen language survives a reload', after.lang === 'vi', after.lang);

// anchors must still work after translating
await page.click('.rail a[href="#g-compliance"]');
await page.waitForTimeout(5000);
const landed = await page.evaluate(() =>
  Math.round(document.getElementById('g-compliance').getBoundingClientRect().top));
check('anchors still land correctly when translated', Math.abs(landed) < 90, `${landed}px`);

console.log(fails.length ? `\n✗ ${fails.length} check(s) failed` : `\n✓ all i18n checks passed`);
await browser.close();
process.exit(fails.length ? 1 : 0);
