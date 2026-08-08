import { chromium } from '/Users/niko/antigravity/tecxwork/node_modules/playwright-core/index.mjs';
const EXEC='/Users/niko/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b=await chromium.launch({executablePath:EXEC});
const p=await b.newPage({viewport:{width:1400,height:1000},deviceScaleFactor:3});
await p.goto('file:///Users/niko/antigravity/tecxwork/public/documentation.html',{waitUntil:'load'});
await p.waitForTimeout(2500);
// white background so the PNG sits cleanly on a light slide
await p.addStyleTag({content:'.diagram{background:#fff !important;border:0 !important;box-shadow:none !important} .diagram figcaption{display:none}'});
const figs = await p.$$('.diagram');
const names = ['diagram-lifecycle','diagram-jobfair'];
for (let i=0;i<figs.length;i++){
  await figs[i].screenshot({path:`/tmp/deck-assets/${names[i]}.png`});
  console.log('rendered', names[i]);
}
await b.close();
