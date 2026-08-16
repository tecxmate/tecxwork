import { chromium } from "playwright-core";

const WORK = process.env.REBRAND_DIR || "/tmp/rebrand";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
// Same viewport and device scale factor as capture-all.mjs, so the glyph rasterisation matches.
const p = await b.newPage({ deviceScaleFactor: 2, viewport: { width: 1440, height: 900 } });
await p.goto(`file://${WORK}/footer.html`);
await p.evaluate(() => document.fonts.ready);
const el = await p.$("#line");
console.log("css box", JSON.stringify(await el.boundingBox()));
await el.screenshot({ path: `${WORK}/footer-line.png`, omitBackground: true });
await b.close();
