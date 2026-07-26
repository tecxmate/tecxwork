# Handoff → Claude Code: Yang Luck Platform **Demo**

**From:** Cowork (business workstream) · **Date:** 2026-07-18
**Goal:** Build a **simple, clickable demo** of the recruitment platform we proposed to **Yang Luck (揚運國際集團)**, so a non-technical client (HR chief 陳女士 + the chairman) can *see and click* it in a pitch. The **ATS kanban pipeline is the headline**. Build on the **existing TECXWORK codebase** — do not start from scratch. **Demo quality, not production.**

---

## 0. TL;DR
- Extend TECXWORK → a **branded, seeded "揚運 Yang Luck" demo** (TECXMATE purple, bilingual 繁中/英).
- P0 = **ATS kanban** (收到履歷 → 初步篩選 → 安排面試 → 發送錄取 → 到職), drag cards between stages, click → candidate profile.
- Seed **realistic fake data** (no real PII). Ship a `DEMO.md` with a 5-click walkthrough and, ideally, a Vercel preview URL.

## 1. Context (why)
TECXMATE is pitching Yang Luck a **proprietary recruitment platform**. Read these first (in **`tecxwork-drive/`**): `tecxwork-drive/Yang-Luck-Pitch-Deck-ZH-EN.pptx` (esp. the **ATS kanban slide** and the **two-sided platform slide**), `tecxwork-drive/Yang-Luck-Market-Research-Report-ZH.docx`, `tecxwork-drive/Yang-Luck-Solution-Proposal-ZH-EN.docx`.

**Who Yang Luck actually is (important framing):** a **manpower agency (人力仲介／派遣)** — it **sources candidates and places them with client companies** (plus a few owned subsidiaries). It is *not* a conglomerate hiring for its own 25 subsidiaries. So the platform is Yang Luck's **sourcing + client-service tool**:
- **企業端 (business side)** = Yang Luck's **client companies** post/consume talent.
- **求職者端 (candidate side)** = **students + white-collar/engineers** (people who job-search online in Taiwan). *Blue-collar migrant workers are sourced overseas and are NOT the platform's users — leave them out of the demo.*

## 2. Environment & constraints (READ BEFORE CODING)
- **Next.js 16.2.2 (App Router).** Per `AGENTS.md`: *"This is NOT the Next.js you know"* — **read `node_modules/next/dist/docs/`** for the relevant APIs before writing.
- **Drizzle ORM + Neon Postgres.** Schema: `src/lib/db/schema.ts`. Seed: `src/lib/db/seed.ts` / `reset-and-seed.ts` (`npm run db:seed`, `npm run db:push`).
- **Reuse what exists — do NOT rebuild.** The app already has `/jobs`, `/browse`, `/recruiter`, `/applicant`, `/admin`, `/profile`, interview **bookings**, **student profiles**, and multi-tenant tables. Inspect `/recruiter` and `/jobs` and reuse their models/components.
- **Auth:** custom JWT (bcryptjs / jsonwebtoken). For the demo, provide **seeded demo logins** (one recruiter, one student) or a simple demo-mode bypass — **no new auth work**.
- **Branch:** work on **`demo/yang-luck`** off `main`. **Do NOT push to `main`.** (Don't build on `multi-tenant-exploration` unless a feature truly needs it.)
- **Wiki:** per `AGENTS.md`, log decisions to `docs/wiki/` (read `docs/wiki/llm-wiki-guide.md` first).
- **Data = seeded/fictional only.** No real candidate PII (PIPA). Fictional names.
- **Brand:** primary `#3A1C71` (purple), accent lavender `#E6DFFA`; **trilingual UI — 繁中 (primary) / English / Tiếng Việt**, with a visible language toggle (Vietnamese matters — most candidates are Vietnamese students).

## 3. Scope

### P0 — must have (the pitch core)
1. **Demo branding** — running app themed as **揚運 Yang Luck** (name/logo/title + purple theme). A demo theme, not a full white-label engine.
2. **ATS kanban pipeline** (the star of the demo):
   - Recruiter view: for a job, show applicants across 5 stages — **收到履歷 · 初步篩選 · 安排面試 · 發送錄取 · 到職** (Applied · Screening · Interview · Offer · Hired).
   - **Drag-and-drop** a candidate card between stages; the change **persists**.
   - Click a card → **candidate profile** (drawer or page).
   - Data: if an application/booking model exists, add a **`pipeline_stage`** enum + `stage_updated_at` + `notes`; otherwise create a lightweight `applications` table for the demo.
3. **Seed realistic demo data:** ~**6 jobs** across Yang Luck client industries (e.g. 工地工程師/會 AutoCAD、飯店櫃台、工廠作業員、餐廳服務、機電助理、白領行政助理); ~**25 candidates** with fictional VN/Indo names, schools (明志科大/龍華科大/…), majors, languages; applications **distributed across all 5 stages** so the board looks alive.

### P1 — should have
4. **Two-sided views:** candidate-facing **job board** (browse + "apply") and recruiter **dashboard** (post a job + see applicants). Reuse existing `/jobs` and `/recruiter`.
5. **Trilingual toggle (繁中 / English / Tiếng Việt)** on the demo pages.
6. **Candidate profile:** photo, school, major, languages, CV link, application history/status.
7. **Filters** by country / location / language (the 好好台灣 differentiator).

### P2 — nice to have
8. Simple **analytics tiles** (應徵數 / 面試數 / 錄取數).
9. **AI CV-screening placeholder** — a mocked "AI 評分" badge/score on cards (not real inference).
10. **Multi-company:** 2–3 demo "client companies" each posting jobs, to show the agency model.

## 4. Data model (extend existing, keep minimal)
- Reuse existing `job_openings` / jobs, students/applicants, recruiters, bookings.
- Add (if absent) for the demo: an **`applications`** row (or reuse bookings) with `pipeline_stage` enum `('applied','screening','interview','offer','hired')`, `stage_updated_at`, `notes`.
- Seed a **"Yang Luck"** recruiter/tenant, the jobs, candidates, and applications spread across stages.

## 5. Design / UX
- Make the kanban **match the deck's ATS slide** (5 columns, colored stage headers with counts, candidate cards). Purple theme, lavender cards.
- Bilingual labels; keep it clean, fast, and simple — **pitch demo, not production polish**.

## 6. Acceptance criteria (demo-ready)
- `npm install && npm run db:push && npm run db:seed && npm run dev` → app runs locally.
- Demo recruiter login → a job shows a **kanban with 10+ applicants across 5 stages**; **dragging a card persists** the stage change.
- Clicking a card opens a **candidate profile**.
- A **job board** page lists jobs; a candidate can "apply" (demo).
- App is **branded 揚運**, **trilingual toggle (繁中 / English / Tiếng Việt) works** on demo pages.
- **No real PII** — all seeded/fictional.
- Key decisions **logged to `docs/wiki/`**.

## 7. Out of scope (guardrails — do NOT do)
- No production auth/security hardening, real emails, payments, or real candidate data.
- **No blue-collar migrant sourcing** flows (not platform users).
- **No marketing/SEO/events tooling** — per the proposal that's a *client-run* capability, not part of the product demo.
- No full white-label engine, no app-store apps, no refactor of the whole app, **no merge to `main`**.
- Don't over-engineer — build the **simplest thing that demos well**.

## 8. Deliverables
- Runnable demo on **`demo/yang-luck`** + **`DEMO.md`**: how to run + a **5-click pitch walkthrough script** (繁中).
- **Deploy a live Vercel preview URL (required)** so the client can click it live; put the URL at the top of `DEMO.md`.
- A few **kanban screenshots** saved to `public/demo/` or `docs/` (Lynn can drop them into the pitch deck's screenshot placeholders).

## 9. Reference (in repo)
- `tecxwork-drive/Yang-Luck-Pitch-Deck-ZH-EN.pptx` — ATS kanban slide, two-sided slide, feature slides (the visual target).
- `tecxwork-drive/Yang-Luck-Market-Research-Report-ZH.docx` — audience, competitors, the real problem framing.
- `tecxwork-drive/Yang-Luck-Solution-Proposal-ZH-EN.docx` — feature list & positioning.
- `docs/specs/tecxwork-v2-v3-function-list.md` — existing platform functions to reuse.
- *(All business deliverables now live in `tecxwork-drive/`.)*

---

### Decisions (locked)
1. **Deploy a live Vercel preview URL** — required (not local-only).
2. **Trilingual toggle: 繁中 / English / Tiếng Việt.**
3. Seed with the real-world job titles & personas below (scraped from Yang Luck's public presence).

---

## 10. Yang Luck reference — real job titles & candidate personas (scraped 2026-07)
**Company reality (for accuracy):** 揚運國際集團 is a Taichung-HQ international labor/manpower agency (offices in Taipei & Kaohsiung) that **develops clients in 營造業（construction）、製造業（manufacturing）、旅宿業（hospitality）** and supplies foreign workers & talent, plus 國際高階人才獵尋 and 人力派遣. It posts on **104 (揚運國際發展有限公司)**, **1111 (揚運國際人力集團)**, and 台灣就業通. Its public openings are mostly its *own* back-office roles — the placement jobs (below) are what the **demo job board** should show.

### 10.1 Demo job listings (client-placement roles — the candidate-facing board)
Seed ~6 of these, tagged by industry, location, language requirement, and salary:

| 職缺 Job title | 產業 Industry | 對象 Target | 語言 Language |
|---|---|---|---|
| 工地工程師（會 AutoCAD／BIM） Site Engineer | 營造 Construction | 學生/白領・工程 | 中文中級＋英文 |
| 工地管理助理 Site Admin Assistant | 營造 | 學生 | 中文 |
| 機電技術員 MEP Technician | 機電 MEP | 學生/技術 | 中文初級 |
| 飯店櫃台／房務 Hotel Front-desk / Housekeeping | 旅宿 Hospitality | 學生 | 中文＋英文 |
| 餐廳外場服務 Restaurant Service | 餐飲 F&B | 學生 | 中文 |
| 工廠作業員／技術員 Factory Operator | 製造 Manufacturing | 學生/技術 | 中文初級 |
| 白領行政助理／儲備幹部 Admin / Management Trainee | 集團/客戶 | 白領・畢業生 | 中文流利＋英文 |

### 10.2 Candidate personas (seed ~25; here are representative anchors — use fictional names, no real PII)
- **Nguyễn Thị Mai（阮氏梅）** · 越南籍 · 明志科大 機械工程系 大四 · 中文中級/英文流利 · 會 AutoCAD · 應徵「工地工程師（實習）」 · **stage: 安排面試**
- **Putra Wijaya** · 印尼籍 · 龍華科大 電機系 大三 · 中文初級 · 應徵「機電技術員」 · **stage: 初步篩選**
- **Trần Văn Quý（陳文貴）** · 越南籍 · 高餐大 餐旅系 · 中文流利 · 應徵「飯店櫃台」 · **stage: 發送錄取**
- **Dewi Lestari** · 印尼籍 · 弘光科大 · 中文中級 · 應徵「餐廳外場服務」 · **stage: 收到履歷**
- **Lê Minh Hoàng（黎明煌）** · 越南籍 · 台科大 土木工程 碩一 · 中文流利/英文流利 · 會 BIM · 應徵「白領儲備幹部」 · **stage: 到職**

Spread the remaining ~20 fictional candidates across all 5 stages so every column is populated. Nationalities: mostly Vietnam & Indonesia, some Philippines. Schools: 明志科大、龍華科大、弘光科大、高餐大、台科大、清雲/健行… Majors: 機械、電機、土木、餐旅、資工、商管. Languages: 中文（初/中/流利）、英文、越南文/印尼文.

### 10.3 Yang Luck's own internal roles (secondary — optional "recruit our own staff" demo)
人資專員、集團內部會計、集團內部行政專員、服務業務專員／儲備幹部、泰國勞工宿舍管理員 — these are Yang Luck's actual 104/1111 postings; include only if showing that Yang Luck can also hire its own team on the platform.

**Sources:** 揚運國際集團 官網 yangluck.com.tw · 1111 corp/8655055 · 104 company/1a2x6bmmc3 · 台灣就業通.
