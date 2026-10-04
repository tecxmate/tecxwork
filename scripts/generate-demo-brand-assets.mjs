/**
 * Generates logo marks and gallery imagery for the fictional demo employers and
 * uploads them to Vercel Blob (the host next.config.ts already allows).
 *
 * These are original vector graphics rendered to raster — not stock photography —
 * so nothing here carries a third-party licence or trademark.
 *
 *   node scripts/generate-demo-brand-assets.mjs            # render to ./out-demo-assets
 *   node scripts/generate-demo-brand-assets.mjs --upload   # render + upload, print URLs
 */
import sharp from "sharp";
import { sceneBody } from "./demo-scenes.mjs";
import fs from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("out-demo-assets");
const UPLOAD = process.argv.includes("--upload");

/** One identity per company: palette, monogram, and a distinct geometric mark. */
export const BRANDS = [
  { slug: "nimbus-silicon",     company: "Nimbus Silicon",           mono: "NS", ink: "#1B2A6B", accent: "#4CC9F0", wash: "#EEF3FF", motif: "chip" },
  { slug: "lantern-bay",        company: "Lantern Bay Digital",      mono: "LB", ink: "#8A4B10", accent: "#F2A93B", wash: "#FFF6E8", motif: "lantern" },
  { slug: "verdant-systems",    company: "Verdant Systems",          mono: "VS", ink: "#0F5C43", accent: "#3FBF8F", wash: "#ECFBF4", motif: "leaf" },
  { slug: "riverstone-robotics",company: "Riverstone Robotics",      mono: "RR", ink: "#2C3E55", accent: "#F2762E", wash: "#EEF2F7", motif: "arm" },
  { slug: "copperline",         company: "Copperline Precision",     mono: "CP", ink: "#7A3B18", accent: "#C9743A", wash: "#FCF1E8", motif: "rings" },
  { slug: "cedar-harbor",       company: "Cedar Harbor Consulting",  mono: "CH", ink: "#16314F", accent: "#5B8DB8", wash: "#EEF4FA", motif: "cedar" },
  { slug: "meridian-trust",     company: "Meridian Trust Capital",   mono: "MT", ink: "#0C4238", accent: "#C9A227", wash: "#EFF7F3", motif: "meridian" },
  { slug: "blue-heron-foods",   company: "Blue Heron Foods",         mono: "BH", ink: "#1E4E78", accent: "#67B36A", wash: "#EDF5FC", motif: "heron" },
  { slug: "willow-peak",        company: "Willow Peak Health",       mono: "WP", ink: "#125F63", accent: "#4FB3A5", wash: "#EDFAF8", motif: "pulse" },
  { slug: "stonebridge",        company: "Stonebridge Construction", mono: "SB", ink: "#33383E", accent: "#E8B33A", wash: "#F2F3F5", motif: "bridge" },
  { slug: "orchid-grove",       company: "Orchid Grove Hospitality", mono: "OG", ink: "#5C2B50", accent: "#C77BAE", wash: "#FBEFF7", motif: "orchid" },
  { slug: "compass-point",      company: "Compass Point Education",  mono: "CP2",ink: "#1F3E8C", accent: "#F2705B", wash: "#EEF2FD", motif: "compass" },
];

/** The mark itself, drawn on a 512 grid centred at (256,256). */
function markPaths(motif, ink, accent) {
  switch (motif) {
    case "chip": return `
      <rect x="176" y="176" width="160" height="160" rx="26" fill="${accent}" opacity=".95"/>
      <rect x="208" y="208" width="96" height="96" rx="12" fill="${ink}"/>
      ${[0,1,2].map(i=>`<rect x="${222+i*30}" y="150" width="14" height="30" rx="6" fill="${ink}"/>
         <rect x="${222+i*30}" y="332" width="14" height="30" rx="6" fill="${ink}"/>
         <rect x="150" y="${222+i*30}" width="30" height="14" rx="6" fill="${ink}"/>
         <rect x="332" y="${222+i*30}" width="30" height="14" rx="6" fill="${ink}"/>`).join("")}`;
    case "lantern": return `
      <path d="M256 104v34" stroke="${ink}" stroke-width="14" stroke-linecap="round"/>
      <rect x="196" y="138" width="120" height="26" rx="13" fill="${ink}"/>
      <path d="M212 164h88c26 34 34 74 34 104s-8 70-34 104h-88c-26-34-34-74-34-104s8-70 34-104z" fill="${accent}"/>
      <rect x="188" y="358" width="136" height="28" rx="14" fill="${ink}"/>
      ${[0,1,2].map(i=>`<rect x="${234+i*22}" y="196" width="10" height="140" rx="5" fill="${ink}" opacity=".45"/>`).join("")}`;
    case "leaf": return `
      <path d="M356 148c0 108-54 168-146 196 6-104 58-170 146-196z" fill="${accent}"/>
      <path d="M156 364c66-96 122-150 200-216-24 122-92 190-200 216z" fill="${ink}" opacity=".9"/>`;
    case "arm": return `
      <rect x="140" y="322" width="150" height="34" rx="17" fill="${ink}"/>
      <rect x="236" y="176" width="34" height="164" rx="17" fill="${ink}" transform="rotate(-34 253 258)"/>
      <circle cx="160" cy="339" r="30" fill="${accent}"/>
      <circle cx="318" cy="180" r="34" fill="${accent}"/>`;
    case "rings": return `
      <circle cx="256" cy="256" r="104" fill="none" stroke="${ink}" stroke-width="26"/>
      <circle cx="256" cy="256" r="56" fill="none" stroke="${accent}" stroke-width="26"/>
      <rect x="240" y="96" width="32" height="70" rx="16" fill="${accent}"/>`;
    case "cedar": return `
      <path d="M256 128l72 108h-44l56 92h-52l40 64H184l40-64h-52l56-92h-44z" fill="${ink}"/>
      <rect x="238" y="368" width="36" height="42" rx="10" fill="${accent}"/>`;
    case "meridian": return `
      <circle cx="256" cy="256" r="110" fill="none" stroke="${ink}" stroke-width="24"/>
      <ellipse cx="256" cy="256" rx="48" ry="110" fill="none" stroke="${accent}" stroke-width="20"/>
      <rect x="140" y="242" width="232" height="24" rx="12" fill="${accent}"/>`;
    case "heron": return `
      <path d="M150 366c0-84 48-138 122-150" stroke="${accent}" stroke-width="26" fill="none" stroke-linecap="round"/>
      <path d="M272 216c0-40 26-68 62-68 20 0 34 10 34 26 0 18-16 26-38 30l52 16-58 18c-10 44-44 70-98 74z" fill="${ink}"/>
      <circle cx="342" cy="166" r="11" fill="${accent}"/>
      <path d="M150 366h176" stroke="${ink}" stroke-width="22" stroke-linecap="round"/>`;
    case "pulse": return `
      <path d="M256 140l104 116-104 116-104-116z" fill="${accent}" opacity=".9"/>
      <path d="M160 258h44l24-52 34 108 28-72 18 16h44" fill="none" stroke="${ink}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "bridge": return `
      <path d="M132 330c0-76 56-128 124-128s124 52 124 128" fill="none" stroke="${ink}" stroke-width="28"/>
      <rect x="120" y="326" width="272" height="30" rx="12" fill="${accent}"/>
      ${[0,1,2,3].map(i=>`<rect x="${168+i*58}" y="238" width="16" height="92" rx="8" fill="${ink}" opacity=".6"/>`).join("")}`;
    case "orchid": return `
      ${[0,72,144,216,288].map(a=>`<ellipse cx="256" cy="174" rx="40" ry="74" fill="${accent}" opacity=".85" transform="rotate(${a} 256 256)"/>`).join("")}
      <circle cx="256" cy="256" r="40" fill="${ink}"/>`;
    case "compass": return `
      <circle cx="256" cy="256" r="112" fill="none" stroke="${ink}" stroke-width="24"/>
      <path d="M256 160l38 82 82 38-82 38-38 82-38-82-82-38 82-38z" fill="${accent}"/>`;
    default: return "";
  }
}

function logoSvg(b) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${b.wash}"/><stop offset="1" stop-color="#FFFFFF"/>
    </linearGradient></defs>
    <rect width="512" height="512" rx="96" fill="url(#g)"/>
    <rect x="10" y="10" width="492" height="492" rx="88" fill="none" stroke="${b.ink}" stroke-width="6" opacity=".14"/>
    ${markPaths(b.motif, b.ink, b.accent)}
  </svg>`;
}

/** Three 4:3 industry scenes per company, sharing its palette. */
function sceneSvg(b, variant) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="${b.wash}"/>
    </linearGradient></defs>
    <rect width="1200" height="900" fill="url(#bg)"/>
    ${sceneBody(b.motif, variant, b.ink, b.accent, b.wash)}
  </svg>`;
}

async function main() {
  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(path.join(OUT, "logos"), { recursive: true });
  await fs.mkdir(path.join(OUT, "gallery"), { recursive: true });

  const made = [];
  for (const b of BRANDS) {
    const logo = path.join(OUT, "logos", `${b.slug}.png`);
    await sharp(Buffer.from(logoSvg(b))).png({ quality: 92 }).toFile(logo);
    made.push({ brand: b, key: `demo/logos/${b.slug}.png`, file: logo, kind: "logo" });

    for (let v = 0; v < 3; v++) {
      const f = path.join(OUT, "gallery", `${b.slug}-${v + 1}.jpg`);
      await sharp(Buffer.from(sceneSvg(b, v))).jpeg({ quality: 86 }).toFile(f);
      made.push({ brand: b, key: `demo/gallery/${b.slug}-${v + 1}.jpg`, file: f, kind: "gallery" });
    }
  }
  console.log(`rendered ${made.length} assets into ${OUT}`);

  if (!UPLOAD) return;
  const { put } = await import("@vercel/blob");
  const out = {};
  for (const m of made) {
    const { url } = await put(m.key, await fs.readFile(m.file), {
      access: "public",
      contentType: m.kind === "logo" ? "image/png" : "image/jpeg",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    (out[m.brand.company] ??= { company: m.brand.company, logo: null, gallery: [] });
    if (m.kind === "logo") out[m.brand.company].logo = url;
    else out[m.brand.company].gallery.push(url);
  }
  await fs.writeFile(path.join(OUT, "uploaded.json"), JSON.stringify(Object.values(out), null, 2));
  console.log(`uploaded ${made.length} assets -> ${path.join(OUT, "uploaded.json")}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
