---
name: seo
description: SEO + AI-search visibility playbook for the tecxwork brand on work.tecxmate.com — what's wired and what still needs off-page work.
attributed_to: niko
belongs_to: [tecxwork, public-homepage]
source: chat 2026-05-28
date: 2026-05-28
---

# SEO & AI-search visibility

## Why Google was auto-correcting "tecxwork" → "texwork"

The product brand is **tecxwork** but the site lives at `work.tecxmate.com`. Google had no signal that "tecxwork" is a real entity: domain didn't contain it, `<title>` didn't contain it, no JSON-LD Organization claimed it, no backlinks reinforced it. Without entity signal, Google defaults to the closest dictionary-ish match — "texwork" (TeXworks, the LaTeX editor) — and offers "did you mean texwork".

## JobPosting structured data on `/jobs/[id]`

`src/app/jobs/[id]/page.tsx` emits a `JobPosting` JSON-LD block per public job, intended for **Google Jobs** eligibility (the rich card with the briefcase icon in regular Google results).

Field mapping (DB column → schema.org):

| schema.org | Source | Notes |
|---|---|---|
| `title` | `job.title` | required |
| `description` | description + responsibilities + requirements + benefits, wrapped in `<p>` | required; Google expects HTML, line breaks → `<br/>` |
| `datePosted` | `job.createdAt` (ISO) | required |
| `validThrough` | `job.applicationDeadline` parsed to ISO | only set if parseable |
| `hiringOrganization` | `recruiter.company` + `recruiter.logoUrl` | required |
| `jobLocation` | `job.location` (country hard-coded `TW`) | always set |
| `jobLocationType` | `"TELECOMMUTE"` when `workplaceType` includes "remote" | also sets `applicantLocationRequirements` to Taiwan |
| `employmentType` | mapped via `EMPLOYMENT_TYPE_MAP` | full-time → FULL_TIME, etc. Google enum |
| `baseSalary` | `MonetaryAmount` with `QuantitativeValue` (min/max + `unitText`) | unit via `SALARY_PERIOD_MAP`: month → MONTH, year → YEAR, hour → HOUR |
| `identifier` | `{ name: "tecxwork", value: job.id }` | required for de-dup |
| `inLanguage` | `job.languageRequirement` | optional |
| `directApply` | `false` | we don't host a Google-compliant apply endpoint yet |

Page metadata also extended: title `"<job> — <company> | tecxwork (Vietnamese Jobs in Taiwan)"`, OG, canonical to `/jobs/<id>`.

**Quality gates Google enforces** (failures → no rich card, no warning in console UI):
- `description` shorter than ~50 chars → silently dropped
- Missing `jobLocation` for non-remote jobs → dropped
- Missing `validThrough` is allowed but expired postings drop after ~30 days from `datePosted` regardless
- `baseSalary` with `value: 0` → dropped

If a real listing looks fine in [Rich Results Test](https://search.google.com/test/rich-results) but doesn't show in Google Jobs after a week, the issue is almost always **data thinness in the DB row** (e.g., empty description, no employment type). Push recruiters to fill all fields.

## What's wired (on-page)

- `src/app/robots.ts` — allows public routes, disallows /admin /api /dashboard /profile /login /register etc., references sitemap.
- `src/app/sitemap.ts` — static public routes + approved job IDs with hreflang alternates (en/vi/zh-TW + x-default).
- `src/app/layout.tsx`:
  - Title: `tecxwork — <event> | Vietnamese Jobs in Taiwan · 越南人才台灣工作 · Việc làm tại Đài Loan`
  - Description: multilingual sentence with `tecxwork` first word + 越南招募・越南工程師・越南工人・台灣工作 + việc làm Đài Loan.
  - `keywords` array (low SEO weight but cheap)
  - `alternates.canonical` + `alternates.languages` for hreflang
  - `robots.googleBot` with max-image-preview large, full snippets
  - JSON-LD `@graph` with `Organization` (parentOrganization → tecxmate) + `WebSite` (SearchAction → /jobs?q=…). Logo points at /icon-512.png.
  - `<html lang>` now follows `studentLocale` instead of hardcoded "en".
- `public/manifest.json` — multilingual description, name updated to include "Vietnamese Jobs in Taiwan".

## What still needs off-page work (the actual bottleneck)

On-page fixes raise the ceiling. They don't kill the autocorrect on their own. To get Google + AI engines to recognize "tecxwork" as an entity, we need *external mentions using the exact spelling*. Priority order:

1. **Brand profiles using "tecxwork"** — LinkedIn company page, X/Twitter, Facebook page, Instagram, GitHub org, Crunchbase, Product Hunt. Each must link back to `https://work.tecxmate.com` and Google should be able to crawl them. List all of these as `sameAs` in the Organization JSON-LD once they exist.
2. **Wikidata entry** — create a Wikidata item for tecxwork (sub-brand of tecxmate). This is what most AI search engines (Perplexity, ChatGPT, Claude) use to disambiguate entities. Free, fast.
3. **Inbound links with anchor "tecxwork"** — partner schools (VSATW participants), Vietnamese student associations in Taiwan, recruiters' company sites linking to their /browse profile. Even 5–10 mentions across reputable sites typically kills "did you mean".
4. **Google Search Console + Bing Webmaster** — verify domain ownership; submit sitemap.xml. Bing index is what feeds ChatGPT search.
5. **Press / blog content** — one or two articles on Vietnamese-Taiwan job sites or university news pages mentioning "tecxwork" by name.

## Verification recipe

After deploy:
- `curl https://work.tecxmate.com/robots.txt` → expect rules + sitemap line
- `curl https://work.tecxmate.com/sitemap.xml` → expect entries with `<xhtml:link rel="alternate" hreflang="…">` per URL
- View-source homepage → expect `<script type="application/ld+json">` containing both Organization and WebSite
- Google Rich Results Test on homepage → Organization + WebSite should both parse
- Search Console → request indexing on /, /browse, /jobs, /about
- After 2–4 weeks of off-page work above, re-search "tecxwork" — the autocorrect should disappear.

## Notes

- Do NOT redirect `work.tecxmate.com` to `tecxmate.com`; we want `work.tecxmate.com` to *be* the tecxwork canonical until/unless we register a real tecxwork.com.
- If we ever buy `tecxwork.com`, 301 from work.tecxmate.com → tecxwork.com, update `NEXT_PUBLIC_SITE_URL`, update JSON-LD `url` and `sameAs`, update `metadataBase`. Keep one canonical at a time.
- See [[link-previews]] for OG-image quirks that interact with the metadata above.
