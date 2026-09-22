/**
 * Flat-illustration scenes for the demo employers' photo galleries.
 * Each theme returns three 1200x900 compositions drawn in the brand's palette,
 * so a company's gallery reads as one set. Original artwork — no stock licence.
 *
 * Every scene body is drawn on a 1200x900 canvas over a pre-painted background.
 */

const W = 1200, H = 900;

/** Shared furniture so every scene sits in a believable room / site. */
const floor = (c, y = 640) => `<rect x="0" y="${y}" width="${W}" height="${H - y}" fill="${c}" opacity=".5"/>`;
const sun = (c, x = 980, y = 170, r = 84) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".38"/>`;
const person = (x, y, s, ink, accent) => `<g transform="translate(${x} ${y}) scale(${s})">
  <circle cx="0" cy="-86" r="30" fill="${ink}"/>
  <path d="M-36 0c0-42 16-64 36-64s36 22 36 64z" fill="${accent}"/></g>`;
const screen = (x, y, w, h, ink, accent) => `<g>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${ink}"/>
  <rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="6" fill="${accent}" opacity=".55"/></g>`;

export const SCENES = {
  // ---- semiconductors: wafer, fab bays, board traces ----
  chip: (ink, accent, wash) => [
    `${floor(wash)}<circle cx="470" cy="450" r="250" fill="${accent}" opacity=".3"/>
     <circle cx="470" cy="450" r="250" fill="none" stroke="${ink}" stroke-width="10" opacity=".5"/>
     ${[...Array(6)].flatMap((_, r) => [...Array(6)].map((_, c) =>
       `<rect x="${300 + c * 58}" y="${280 + r * 58}" width="46" height="46" rx="6" fill="${ink}" opacity=".${3 + ((r + c) % 5)}"/>`)).join("")}
     <rect x="760" y="300" width="26" height="300" rx="13" fill="${ink}"/>
     <path d="M773 600l-40 70h80z" fill="${accent}"/>`,
    `${floor(wash, 700)}${[...Array(4)].map((_, i) =>
       `<rect x="${90 + i * 270}" y="${250 + (i % 2) * 40}" width="200" height="${420 - (i % 2) * 40}" rx="16" fill="${ink}" opacity=".${2 + (i % 3)}"/>
        <rect x="${112 + i * 270}" y="${290 + (i % 2) * 40}" width="156" height="90" rx="8" fill="${accent}" opacity=".6"/>`).join("")}
     ${person(620, 700, 1.1, ink, accent)}${person(300, 700, 1.1, ink, accent)}`,
    `${floor(wash, 720)}<rect x="140" y="220" width="920" height="470" rx="20" fill="${ink}" opacity=".16"/>
     ${[...Array(7)].map((_, i) => `<path d="M${200 + i * 130} 260 L${200 + i * 130} ${400 + (i % 3) * 60} L${340 + i * 110} ${520 + (i % 2) * 70}" stroke="${accent}" stroke-width="9" fill="none" opacity=".85"/>
        <circle cx="${200 + i * 130}" cy="260" r="16" fill="${ink}"/>`).join("")}
     <rect x="470" y="420" width="190" height="150" rx="14" fill="${ink}"/>`,
  ],
  // ---- product studio: dashboard, mobile, bay skyline ----
  lantern: (ink, accent, wash) => [
    `${floor(wash, 720)}<rect x="150" y="180" width="900" height="520" rx="22" fill="#FFFFFF"/>
     <rect x="150" y="180" width="900" height="520" rx="22" fill="none" stroke="${ink}" stroke-width="6" opacity=".35"/>
     <rect x="150" y="180" width="900" height="64" rx="22" fill="${ink}" opacity=".85"/>
     <rect x="190" y="290" width="380" height="180" rx="14" fill="${accent}" opacity=".45"/>
     ${[...Array(5)].map((_, i) => `<rect x="${200 + i * 72}" y="${560 - (i % 3) * 60}" width="46" height="${90 + (i % 3) * 60}" rx="8" fill="${ink}" opacity=".55"/>`).join("")}
     <rect x="620" y="290" width="390" height="30" rx="15" fill="${ink}" opacity=".3"/>
     <rect x="620" y="345" width="300" height="30" rx="15" fill="${ink}" opacity=".2"/>
     <rect x="620" y="400" width="350" height="30" rx="15" fill="${ink}" opacity=".2"/>`,
    `${floor(wash, 700)}<rect x="430" y="150" width="340" height="600" rx="42" fill="${ink}"/>
     <rect x="452" y="190" width="296" height="520" rx="24" fill="#FFFFFF"/>
     <rect x="480" y="225" width="240" height="120" rx="14" fill="${accent}" opacity=".55"/>
     ${[...Array(4)].map((_, i) => `<rect x="480" y="${375 + i * 70}" width="240" height="50" rx="12" fill="${ink}" opacity=".16"/>`).join("")}
     <circle cx="600" cy="690" r="16" fill="${ink}" opacity=".4"/>`,
    `${sun(accent, 960, 200, 92)}<path d="M0 640h1200v260H0z" fill="${accent}" opacity=".3"/>
     ${[...Array(8)].map((_, i) => `<rect x="${70 + i * 140}" y="${420 - (i % 4) * 70}" width="96" height="${220 + (i % 4) * 70}" rx="8" fill="${ink}" opacity=".${4 + (i % 4)}"/>`).join("")}
     ${[...Array(5)].map((_, i) => `<circle cx="${160 + i * 220}" cy="${330 - (i % 2) * 50}" r="14" fill="${accent}"/>`).join("")}`,
  ],
  // ---- clean energy: solar, gauges, turbines ----
  leaf: (ink, accent, wash) => [
    `${sun(accent)}${floor(wash, 660)}
     ${[...Array(3)].map((_, r) => [...Array(4)].map((_, c) =>
       `<g transform="translate(${120 + c * 250} ${330 + r * 130}) skewX(-16)"><rect width="190" height="96" rx="8" fill="${ink}" opacity=".${5 + (r % 3)}"/>
        <path d="M0 48h190M63 0v96M126 0v96" stroke="${wash}" stroke-width="5"/></g>`).join("")).join("")}`,
    `${floor(wash, 700)}<rect x="130" y="200" width="940" height="480" rx="20" fill="#FFFFFF" stroke="${ink}" stroke-opacity=".3" stroke-width="6"/>
     ${[...Array(3)].map((_, i) => `<circle cx="${300 + i * 300}" cy="390" r="90" fill="none" stroke="${ink}" stroke-width="18" opacity=".25"/>
        <path d="M${300 + i * 300} 390 L${300 + i * 300 + 60} ${340 + i * 20}" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>`).join("")}
     ${[...Array(6)].map((_, i) => `<rect x="${200 + i * 140}" y="540" width="100" height="${100 - (i % 3) * 26}" rx="8" fill="${accent}" opacity=".6"/>`).join("")}`,
    `${sun(accent, 250, 200, 80)}<path d="M0 700h1200v200H0z" fill="${ink}" opacity=".2"/>
     ${[...Array(3)].map((_, i) => { const x = 330 + i * 280, y = 700 - i * 30; return `
       <rect x="${x - 10}" y="${y - 330}" width="20" height="330" fill="${ink}" opacity=".8"/>
       <g transform="translate(${x} ${y - 330})">${[0, 120, 240].map(a => `<path d="M0 0 L26 -150 L-26 -150z" fill="${ink}" transform="rotate(${a})" opacity=".85"/>`).join("")}</g>`; }).join("")}`,
  ],
  // ---- robotics: workcell, conveyor, cell grid ----
  arm: (ink, accent, wash) => [
    `${floor(wash, 690)}<rect x="120" y="640" width="960" height="60" rx="14" fill="${ink}" opacity=".7"/>
     <g stroke="${ink}" stroke-width="44" stroke-linecap="round" fill="none">
       <path d="M330 640V430"/><path d="M330 430L560 330"/><path d="M560 330l150 120"/></g>
     <circle cx="330" cy="430" r="36" fill="${accent}"/><circle cx="560" cy="330" r="36" fill="${accent}"/>
     <rect x="690" y="430" width="70" height="60" rx="10" fill="${accent}"/>
     ${[...Array(4)].map((_, i) => `<rect x="${800 + i * 70}" y="590" width="54" height="50" rx="8" fill="${ink}" opacity=".5"/>`).join("")}`,
    `${floor(wash, 700)}<rect x="60" y="520" width="1080" height="48" rx="12" fill="${ink}" opacity=".65"/>
     ${[...Array(9)].map((_, i) => `<circle cx="${110 + i * 125}" cy="592" r="28" fill="${ink}" opacity=".35"/>`).join("")}
     ${[...Array(6)].map((_, i) => `<rect x="${130 + i * 170}" y="${450 - (i % 2) * 20}" width="96" height="70" rx="10" fill="${accent}" opacity=".7"/>`).join("")}
     ${person(1020, 520, 1.2, ink, accent)}`,
    `${floor(wash, 720)}${[...Array(2)].map((_, r) => [...Array(3)].map((_, c) => `
       <rect x="${110 + c * 340}" y="${190 + r * 280}" width="280" height="230" rx="16" fill="#FFFFFF" stroke="${ink}" stroke-opacity=".35" stroke-width="6"/>
       <g stroke="${ink}" stroke-width="20" stroke-linecap="round" fill="none" transform="translate(${110 + c * 340} ${190 + r * 280})">
         <path d="M80 190V110"/><path d="M80 110l70-40"/></g>
       <circle cx="${190 + c * 340}" cy="${260 + r * 280}" r="14" fill="${accent}"/>`).join("")).join("")}`,
  ],
  // ---- precision parts: lathe, tray, QC ----
  rings: (ink, accent, wash) => [
    `${floor(wash, 690)}<rect x="150" y="430" width="900" height="210" rx="18" fill="${ink}" opacity=".7"/>
     <circle cx="430" cy="380" r="120" fill="none" stroke="${ink}" stroke-width="40" opacity=".85"/>
     <circle cx="430" cy="380" r="46" fill="${accent}"/>
     <rect x="620" y="330" width="330" height="40" rx="20" fill="${ink}"/>
     <rect x="760" y="370" width="50" height="70" rx="10" fill="${accent}"/>`,
    `${floor(wash, 700)}<rect x="130" y="230" width="940" height="440" rx="20" fill="${ink}" opacity=".16"/>
     ${[...Array(3)].map((_, r) => [...Array(5)].map((_, c) => `
       <circle cx="${250 + c * 180}" cy="${320 + r * 130}" r="54" fill="none" stroke="${ink}" stroke-width="18" opacity=".8"/>
       <circle cx="${250 + c * 180}" cy="${320 + r * 130}" r="22" fill="${accent}"/>`).join("")).join("")}`,
    `${floor(wash, 700)}<rect x="360" y="180" width="480" height="470" rx="18" fill="#FFFFFF" stroke="${ink}" stroke-opacity=".35" stroke-width="6"/>
     <circle cx="600" cy="390" r="130" fill="none" stroke="${accent}" stroke-width="22"/>
     <circle cx="600" cy="390" r="58" fill="${ink}" opacity=".8"/>
     <path d="M600 180v60M600 540v60M360 390h60M780 390h60" stroke="${ink}" stroke-width="12"/>
     ${person(180, 690, 1.3, ink, accent)}`,
  ],
  // ---- consulting: boardroom, wall of charts, harbour ----
  cedar: (ink, accent, wash) => [
    `${floor(wash, 700)}<ellipse cx="600" cy="560" rx="360" ry="110" fill="${ink}" opacity=".75"/>
     ${[[260, 470], [420, 430], [780, 430], [940, 470]].map(([x, y]) => person(x, y + 120, 1.15, ink, accent)).join("")}
     <rect x="470" y="250" width="260" height="150" rx="10" fill="${ink}" opacity=".2"/>
     <path d="M500 370l60-60 50 40 70-80" stroke="${accent}" stroke-width="12" fill="none" stroke-linecap="round"/>`,
    `${floor(wash, 720)}<rect x="110" y="170" width="980" height="500" rx="18" fill="#FFFFFF" stroke="${ink}" stroke-opacity=".3" stroke-width="6"/>
     ${[...Array(4)].map((_, i) => `<rect x="${160 + i * 240}" y="${430 - (i % 3) * 70}" width="130" height="${180 + (i % 3) * 70}" rx="10" fill="${accent}" opacity=".${5 + (i % 3)}"/>`).join("")}
     <path d="M170 300h860" stroke="${ink}" stroke-width="6" opacity=".25"/>
     <circle cx="220" cy="230" r="22" fill="${ink}" opacity=".45"/><rect x="266" y="216" width="300" height="28" rx="14" fill="${ink}" opacity=".2"/>`,
    `${sun(accent, 920, 190)}<path d="M0 660h1200v240H0z" fill="${ink}" opacity=".26"/>
     ${[...Array(6)].map((_, i) => `<rect x="${110 + i * 170}" y="${430 - (i % 3) * 90}" width="110" height="${230 + (i % 3) * 90}" rx="8" fill="${ink}" opacity=".${4 + (i % 4)}"/>`).join("")}
     <path d="M250 700h260l-40 70H290z" fill="${accent}" opacity=".9"/>
     <rect x="360" y="600" width="18" height="100" fill="${ink}"/>`,
  ],
  // ---- finance: candles, desk, allocation ----
  meridian: (ink, accent, wash) => [
    `${floor(wash, 720)}<path d="M120 640h960" stroke="${ink}" stroke-width="6" opacity=".3"/>
     ${[...Array(11)].map((_, i) => { const h = 90 + ((i * 53) % 220), y = 580 - h; return `
       <rect x="${150 + i * 85}" y="${y}" width="36" height="${h}" rx="6" fill="${i % 3 === 0 ? accent : ink}" opacity=".8"/>
       <rect x="${165 + i * 85}" y="${y - 34}" width="6" height="${h + 68}" fill="${i % 3 === 0 ? accent : ink}" opacity=".6"/>`; }).join("")}`,
    `${floor(wash, 700)}<rect x="90" y="590" width="1020" height="46" rx="12" fill="${ink}" opacity=".7"/>
     ${screen(150, 260, 300, 300, ink, accent)}${screen(470, 230, 300, 330, ink, accent)}${screen(790, 280, 280, 280, ink, accent)}
     ${person(330, 810, 1.25, ink, accent)}${person(870, 810, 1.25, ink, accent)}`,
    `${floor(wash, 740)}<circle cx="420" cy="430" r="190" fill="${ink}" opacity=".22"/>
     <path d="M420 430 L420 240 A190 190 0 0 1 596 360 Z" fill="${accent}" opacity=".85"/>
     <path d="M420 430 L596 360 A190 190 0 0 1 520 594 Z" fill="${ink}" opacity=".7"/>
     ${[...Array(4)].map((_, i) => `<rect x="740" y="${290 + i * 80}" width="${340 - i * 60}" height="44" rx="22" fill="${accent}" opacity=".${7 - i}"/>`).join("")}`,
  ],
  // ---- food: packing line, crates, test kitchen ----
  heron: (ink, accent, wash) => [
    `${floor(wash, 700)}<rect x="80" y="530" width="1040" height="44" rx="12" fill="${ink}" opacity=".65"/>
     ${[...Array(8)].map((_, i) => `<circle cx="${130 + i * 140}" cy="598" r="26" fill="${ink}" opacity=".3"/>`).join("")}
     ${[...Array(7)].map((_, i) => `<rect x="${110 + i * 150}" y="440" width="92" height="90" rx="10" fill="${accent}" opacity=".75"/>
        <rect x="${110 + i * 150}" y="440" width="92" height="22" rx="8" fill="${ink}" opacity=".5"/>`).join("")}
     <rect x="60" y="300" width="1080" height="26" rx="13" fill="${ink}" opacity=".35"/>`,
    `${floor(wash, 720)}${[...Array(2)].map((_, r) => [...Array(4)].map((_, c) => `
       <rect x="${130 + c * 250} " y="${300 + r * 210}" width="200" height="170" rx="14" fill="${ink}" opacity=".18"/>
       ${[...Array(3)].map((_, k) => `<circle cx="${180 + c * 250 + k * 50}" cy="${360 + r * 210}" r="30" fill="${accent}" opacity=".${6 + (k % 3)}"/>`).join("")}
       ${[...Array(3)].map((_, k) => `<circle cx="${205 + c * 250 + k * 50}" cy="${420 + r * 210}" r="30" fill="${ink}" opacity=".${4 + (k % 3)}"/>`).join("")}`).join("")).join("")}`,
    `${floor(wash, 700)}<rect x="120" y="560" width="960" height="50" rx="12" fill="${ink}" opacity=".7"/>
     <rect x="200" y="420" width="160" height="140" rx="12" fill="${ink}" opacity=".5"/>
     <circle cx="280" cy="400" r="34" fill="${accent}"/>
     <rect x="450" y="470" width="120" height="90" rx="10" fill="${accent}" opacity=".8"/>
     <path d="M660 560v-90a60 60 0 0 1 120 0v90z" fill="${ink}" opacity=".55"/>
     ${person(930, 560, 1.25, ink, accent)}`,
  ],
  // ---- health: reception, vitals, lab ----
  pulse: (ink, accent, wash) => [
    `${floor(wash, 700)}<rect x="240" y="440" width="720" height="170" rx="18" fill="${ink}" opacity=".7"/>
     <rect x="240" y="440" width="720" height="34" rx="17" fill="${accent}" opacity=".9"/>
     ${person(420, 440, 1.2, ink, accent)}${person(800, 440, 1.2, ink, accent)}
     <rect x="520" y="200" width="160" height="160" rx="16" fill="${accent}" opacity=".4"/>
     <path d="M600 230v100M550 280h100" stroke="${ink}" stroke-width="22" stroke-linecap="round"/>`,
    `${floor(wash, 720)}<rect x="160" y="200" width="880" height="460" rx="20" fill="#FFFFFF" stroke="${ink}" stroke-opacity=".3" stroke-width="6"/>
     <path d="M200 440h120l40-110 60 220 50-150 34 40h300" stroke="${accent}" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
     ${[...Array(3)].map((_, i) => `<rect x="${220 + i * 270}" y="530" width="210" height="80" rx="12" fill="${ink}" opacity=".16"/>`).join("")}`,
    `${floor(wash, 700)}<rect x="120" y="560" width="960" height="46" rx="12" fill="${ink}" opacity=".7"/>
     ${[...Array(5)].map((_, i) => `<rect x="${220 + i * 150}" y="${430 + (i % 2) * 30}" width="52" height="${130 - (i % 2) * 30}" rx="10" fill="${accent}" opacity=".${6 + (i % 3)}"/>
        <rect x="${220 + i * 150}" y="${430 + (i % 2) * 30}" width="52" height="26" rx="8" fill="${ink}" opacity=".6"/>`).join("")}
     <circle cx="920" cy="330" r="70" fill="none" stroke="${ink}" stroke-width="16" opacity=".6"/>
     <path d="M920 260v-50" stroke="${ink}" stroke-width="16"/>`,
  ],
  // ---- construction: crane site, blueprint, span ----
  bridge: (ink, accent, wash) => [
    `${sun(accent, 970, 180)}${floor(wash, 700)}
     <rect x="150" y="380" width="330" height="320" fill="${ink}" opacity=".3"/>
     ${[...Array(3)].map((_, r) => [...Array(3)].map((_, c) => `<rect x="${180 + c * 100}" y="${410 + r * 100}" width="70" height="70" fill="${wash}" opacity=".85"/>`).join("")).join("")}
     <rect x="700" y="160" width="20" height="540" fill="${ink}"/>
     <rect x="470" y="160" width="420" height="18" fill="${ink}"/>
     <path d="M760 178v120" stroke="${ink}" stroke-width="10"/>
     <rect x="726" y="298" width="70" height="56" rx="8" fill="${accent}"/>
     <path d="M0 700h1200" stroke="${ink}" stroke-width="10" opacity=".5"/>`,
    `${floor(wash, 740)}<rect x="130" y="180" width="940" height="500" rx="14" fill="${ink}" opacity=".9"/>
     ${[...Array(10)].map((_, i) => `<path d="M${170 + i * 95} 210v440" stroke="${wash}" stroke-width="2" opacity=".35"/>`).join("")}
     ${[...Array(5)].map((_, i) => `<path d="M160 ${240 + i * 95}h880" stroke="${wash}" stroke-width="2" opacity=".35"/>`).join("")}
     <rect x="280" y="290" width="360" height="250" fill="none" stroke="${accent}" stroke-width="8"/>
     <rect x="640" y="380" width="240" height="160" fill="none" stroke="${accent}" stroke-width="8"/>
     <circle cx="280" cy="290" r="12" fill="${accent}"/><circle cx="880" cy="540" r="12" fill="${accent}"/>`,
    `${sun(accent, 240, 190)}<path d="M0 690h1200v210H0z" fill="${ink}" opacity=".24"/>
     <path d="M90 690c0-200 160-330 420-330s420 130 420 330" fill="none" stroke="${ink}" stroke-width="26"/>
     <rect x="60" y="676" width="1080" height="30" rx="10" fill="${accent}" opacity=".9"/>
     ${[...Array(7)].map((_, i) => `<rect x="${190 + i * 140}" y="${470 + (i === 3 ? -50 : 0)}" width="14" height="${206 + (i === 3 ? 50 : 0)}" fill="${ink}" opacity=".6"/>`).join("")}`,
  ],
  // ---- hospitality: lobby, room, terrace ----
  orchid: (ink, accent, wash) => [
    `${floor(wash, 700)}<rect x="120" y="500" width="420" height="140" rx="20" fill="${ink}" opacity=".6"/>
     <rect x="150" y="440" width="120" height="60" rx="16" fill="${accent}" opacity=".85"/>
     <rect x="700" y="230" width="380" height="410" rx="18" fill="${ink}" opacity=".18"/>
     ${[...Array(3)].map((_, i) => `<rect x="${730 + i * 120}" y="270" width="80" height="120" rx="10" fill="${accent}" opacity=".5"/>`).join("")}
     ${person(620, 700, 1.25, ink, accent)}
     <path d="M300 700v-90M260 610h80" stroke="${ink}" stroke-width="14"/>`,
    `${floor(wash, 720)}<rect x="230" y="400" width="600" height="260" rx="20" fill="${ink}" opacity=".6"/>
     <rect x="255" y="340" width="550" height="80" rx="18" fill="#FFFFFF" opacity=".95"/>
     <rect x="290" y="300" width="180" height="60" rx="16" fill="${accent}" opacity=".9"/>
     <rect x="590" y="300" width="180" height="60" rx="16" fill="${accent}" opacity=".9"/>
     <rect x="880" y="470" width="160" height="190" rx="14" fill="${ink}" opacity=".35"/>
     <circle cx="960" cy="420" r="40" fill="${accent}" opacity=".7"/>`,
    `${sun(accent, 960, 200, 94)}${floor(wash, 660)}
     <rect x="120" y="620" width="960" height="180" rx="26" fill="${accent}" opacity=".45"/>
     ${[...Array(4)].map((_, i) => `<g transform="translate(${200 + i * 240} 560)"><rect x="-70" y="0" width="140" height="26" rx="12" fill="#FFFFFF" opacity=".9"/><rect x="-10" y="-70" width="20" height="70" fill="${ink}" opacity=".5"/></g>`).join("")}
     ${[...Array(3)].map((_, i) => `<circle cx="${260 + i * 340}" cy="420" r="52" fill="${ink}" opacity=".3"/>`).join("")}`,
  ],
  // ---- education: classroom, lecture, library ----
  compass: (ink, accent, wash) => [
    `${floor(wash, 720)}<rect x="330" y="180" width="540" height="300" rx="14" fill="${ink}" opacity=".85"/>
     <path d="M390 300h120M390 360h220M390 420h160" stroke="${wash}" stroke-width="14" stroke-linecap="round" opacity=".8"/>
     ${[...Array(3)].map((_, c) => [...Array(2)].map((_, r) => `
       <rect x="${180 + c * 320}" y="${590 + r * 90}" width="240" height="26" rx="10" fill="${ink}" opacity=".55"/>
       ${person(300 + c * 320, 590 + r * 90, 0.85, ink, accent)}`).join("")).join("")}`,
    `${floor(wash, 700)}<rect x="140" y="170" width="920" height="380" rx="16" fill="#FFFFFF" stroke="${ink}" stroke-opacity=".3" stroke-width="6"/>
     <path d="M200 400l90-90 80 60 110-140 90 110 120-90" stroke="${accent}" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
     <circle cx="880" cy="300" r="70" fill="${accent}" opacity=".35"/>
     ${person(260, 780, 1.4, ink, accent)}
     <rect x="520" y="620" width="520" height="30" rx="14" fill="${ink}" opacity=".45"/>`,
    `${floor(wash, 740)}${[...Array(3)].map((_, r) => `
       <rect x="150" y="${230 + r * 180}" width="900" height="24" rx="8" fill="${ink}" opacity=".6"/>
       ${[...Array(14)].map((_, i) => `<rect x="${170 + i * 62}" y="${230 + r * 180 - 110 + (i % 3) * 16}" width="${28 + (i % 3) * 8}" height="${110 - (i % 3) * 16}" rx="5" fill="${i % 4 === 0 ? accent : ink}" opacity=".${4 + (i % 5)}"/>`).join("")}`).join("")}`,
  ],
};

export function sceneBody(motif, variant, ink, accent, wash) {
  const kit = SCENES[motif];
  if (!kit) return "";
  return kit(ink, accent, wash)[variant % 3];
}
