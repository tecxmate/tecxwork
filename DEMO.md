# 揚運 Yang Luck — 招募平台 Demo

> **Live demo:** **https://yangluck.tecxmate.com** — homepage (Yang Luck hero carousel), `/browse` (25 client companies), log in `hr@yangluck.demo` / `demo1234` → **Pipeline** tab.
> (Vercel branch alias also works: https://app-git-demo-yang-luck-nikolasdoans-projects.vercel.app)
> Backed by an isolated demo Neon DB — never touches production.
> Clickable demo of the recruitment platform proposed to **揚運國際集團 (Yang Luck)**. The headline is the **ATS 招募看板 (kanban pipeline)**, integrated as a native **Pipeline tab** in the TECXWORK recruiter dashboard (log in → Pipeline). **Demo quality, fictional data only — no real PII.**
>
> Log in `hr@yangluck.demo` / `demo1234` → **Pipeline** tab. (`/pipeline` redirects here.)

---

## 5-click pitch walkthrough (繁中)

1. **登入招募人員帳號** → `hr@yangluck.demo` / `demo1234`，進入 TECXWORK 招募人員後台。
2. **點上方「Pipeline」分頁** → 招募看板。看到「工地工程師 Site Engineer」職缺，12 位候選人分布在五個階段：**收到履歷 → 初步篩選 → 安排面試 → 發送錄取 → 到職**。
3. **拖曳一張候選人卡片** 到下一個階段，放開後即時更新且**會存檔**（重新整理仍在新階段）。
4. **點一張卡片** → 右側滑出**候選人資料**：學校、科系、國籍、技能、履歷，以及 **AI 評分**（demo 模擬）。切換上方職缺標籤即切換該職缺的流程。
5. **切換語言** → 右上角語言切換（繁中 / English），整個後台跟著切換 —— 招募看板是 TECXWORK 系統內的原生分頁。

> 一句話：**揚運的招募人員登入平台，在「Pipeline」分頁把越南／印尼學生候選人從收到履歷一路推進到到職。**

---

## Run locally

The demo uses a **separate demo database** (an isolated Neon project) — it never touches the live TECXWORK production DB.

```bash
npm install
# point at the demo DB for every command (never the prod DATABASE_URL):
export DATABASE_URL="<demo-neon-connection-string>"   # ask Niko / see Vercel preview env
npm run db:push                                        # apply schema (adds `applications` table)
npx tsx src/lib/db/seed-yang-luck.ts                   # seed 揚運 recruiter + 7 jobs + 30 candidates
npm run dev                                             # http://localhost:3000/pipeline
```

**Demo logins** (seeded):
- Recruiter: `hr@yangluck.demo` / `demo1234`
- Admin: `admin@yangluck.demo` / `demo1234`

> `/pipeline` redirects to the in-app **Pipeline** tab (`/dashboard/pipeline`).

---

## What's built (scope)

**P0 (the pitch core) — done**
- **ATS 招募看板 as a native recruiter tab** — `/dashboard/pipeline` (nav: Interviews · Applicants · **Pipeline** · Jobs · My Company). Reuses the app's **top bar, language switcher, footer, and `Card`/`Button`/`Badge` design-system components** — seamless, not a bolted-on page. `/pipeline` redirects here.
- 5 stages, **drag-and-drop that persists** (`PATCH /api/applications/:id`), click a card → **candidate profile drawer**, client-company selector.
- Follows the recruiter dashboard's **繁中 / English** via the shared language switcher.
- App chrome rebranded **yangluck 揚運** (top bar, footer, splash, login).
- **Real client companies (agency model)**: Yang Luck is the platform recruiter; its jobs are tagged with the **client company** it places for. Seeded **25 companies** — 6 confirmed Yang Luck group subsidiaries (from yangluck.com.tw「集團夥伴」: 揚宏營造, 揚運機電, 長隆人力資源, 慶圓開發, 揚運大湖農莊, 澳門欣榮人力) + 19 real central-Taiwan client firms (麗明營造, 巨大機械/Giant, 上銀/HIWIN, 大立光電/Largan, 正新/Maxxis, Windsor Hotel …). Agencies don't publish client lists, so the 19 are real, verifiable **representative** clients in the sectors Yang Luck serves (營造/製造/旅宿/機電).
- **35 white-collar positions** across them (Site Engineer, Process/QC Engineer, Front Desk, Management Trainee — the student/white-collar roles the platform places, **not** the blue-collar migrant roles). **36 fictional VN/ID/PH candidates** across 11 companies + all 5 stages; showcase 麗明營造 has 12. The ATS **CLIENT selector** lists all 25 companies (subsidiaries badged 集團/Group); the candidate drawer shows the placement company + role.
- **AI CV-screening placeholder**: mocked「AI 評分」badge on each card.

**Reused (P1)**: the existing `/jobs` and `/browse` show the seeded Yang Luck jobs (two-sided view). These carry the base app chrome — this is a demo theme, not a full white-label engine.

**Data model**: a new `applications` table (`applicant × job × pipeline_stage` enum `applied/screening/interview/offer/hired` + `stage_updated_at` + `notes` + `ai_score`), deliberately separate from the interview-slot `bookings` machinery.

## Out of scope (per handoff)
No production auth hardening, real emails/payments, real candidate PII, blue-collar migrant-sourcing flows, or marketing/SEO tooling. Not merged to `main`.

## Screenshots
`public/demo/kanban-board.png` · `public/demo/candidate-drawer.png` — for dropping into the pitch deck.
