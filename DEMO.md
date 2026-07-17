# 揚運 Yang Luck — 招募平台 Demo

> **Live preview:** _(deploying — URL added after the Vercel preview builds)_
> Branded, clickable demo of the recruitment platform proposed to **揚運國際集團 (Yang Luck)**. The headline is the **ATS 招募看板 (kanban pipeline)**. Built on the existing TECXWORK codebase. **Demo quality, fictional data only — no real PII.**

---

## 5-click pitch walkthrough (繁中)

1. **打開招募看板** → `/pipeline`。看到「工地工程師 Site Engineer」職缺的看板，12 位候選人分布在五個階段：**收到履歷 → 初步篩選 → 安排面試 → 發送錄取 → 到職**。
2. **拖曳一張候選人卡片** 到下一個階段（例如把某位候選人從「初步篩選」拖到「安排面試」）。放開後階段立即更新且**會存檔**（重新整理仍在新階段）。
3. **點一張卡片** → 右側滑出**候選人資料**：學校、科系、國籍、語言、技能、履歷連結，以及 **AI 評分**（demo 模擬）。
4. **切換職缺** → 點上方職缺標籤（如「飯店櫃台」「機電技術員」），看板即切換到該職缺的候選人流程。
5. **切換語言** → 右上角 **繁中 / EN / VI** 切換三語介面（越南文為多數候選人母語）。

> 一句話：**揚運的招募人員在一個看板上，把越南／印尼學生候選人從收到履歷一路推進到到職。**

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

> The `/pipeline` board also works **without logging in** (demo mode resolves the single Yang Luck recruiter), so a presenter can just open the URL.

---

## What's built (scope)

**P0 (the pitch core) — done**
- **ATS 招募看板** at `/pipeline`: 5 stages, **drag-and-drop that persists** (`PATCH /api/applications/:id`), click a card → **candidate profile drawer**.
- **揚運 branding** (purple `#3A1C71`) + **trilingual toggle 繁中/EN/VI** on the demo page.
- **Seeded realistic data**: 1 manpower-agency recruiter, 7 client-placement jobs (營造/機電/旅宿/餐飲/製造/白領), 30 fictional VN/ID/PH candidates spread across all 5 stages. The showcase job "工地工程師" has 12 applicants.
- **AI CV-screening placeholder**: mocked「AI 評分」badge on each card.

**Reused (P1)**: the existing `/jobs` and `/browse` show the seeded Yang Luck jobs (two-sided view). These carry the base app chrome — this is a demo theme, not a full white-label engine.

**Data model**: a new `applications` table (`applicant × job × pipeline_stage` enum `applied/screening/interview/offer/hired` + `stage_updated_at` + `notes` + `ai_score`), deliberately separate from the interview-slot `bookings` machinery.

## Out of scope (per handoff)
No production auth hardening, real emails/payments, real candidate PII, blue-collar migrant-sourcing flows, or marketing/SEO tooling. Not merged to `main`.

## Screenshots
`public/demo/kanban-board.png` · `public/demo/candidate-drawer.png` — for dropping into the pitch deck.
