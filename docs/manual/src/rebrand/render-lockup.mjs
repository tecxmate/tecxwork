import { chromium } from "playwright-core";

const WORK = process.env.REBRAND_DIR || "/tmp/rebrand";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ deviceScaleFactor: 2, viewport: { width: 1440, height: 900 } });
await p.goto(`file://${WORK}/lockup.html`);
await p.evaluate(() => document.fonts.ready);
const el = await p.$("#mark");
console.log("css box", JSON.stringify(await el.boundingBox()));
await el.screenshot({ path: `${WORK}/tecxwork-lockup.png`, omitBackground: true });
await b.close();
