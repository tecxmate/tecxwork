# Handoff → Claude Cowork

**From:** Claude Code (in the TECXWORK repo) · **Date:** 2026-06-29
**Purpose:** Continue the **business + financial workstream** for TECXWORK — refine the financial model, validate costs with the teams, and drive the V2/V3 plan toward a fundable, validated business case.

> **If you can't open the repo files directly:** ask Niko to share the four files in §2. The Excel model (`~/Desktop/tecxwork-financial-model.xlsx`) is the live artifact you'll iterate on.

---

## 1. What TECXWORK is (60-second context)

A **cross-border (Vietnam ↔ Taiwan) job platform**. It started as a **career-fair operations tool** (real-time interview booking, multilingual, privacy-by-design) and is being expanded into an **always-on job marketplace + a flagship event engine**. Benchmarks: **104, 1111, CakeResume** (Taiwan). The thesis: **Vietnamese talent → Taiwanese employers**, with the event engine as the wedge and the marketplace as retention/revenue.

- **Live proof:** ran **V-GEN TRIDENT 2026** (June, MCUT). Real data today: ~173 CVs, 38 companies, 319 applications, 477 interview slots, **0 double-bookings** at peak.
- **Stack:** Next.js (App Router) · Neon Postgres (Drizzle) · Vercel (region `sin1`) · Resend email · Vercel Blob · custom JWT auth · Google-Drive CV model (PIPA-friendly).
- **Team:** ~10 people. Heavy security + legal load. MVP (web PWA) was built by **1 person + Claude + Codex for ~US$300 cash** — this is the cost anchor that matters (see §3).

---

## 2. Artifacts produced this session (read these first)

| File | What it is |
|---|---|
| `docs/specs/tecxwork-v2-v3-function-list.md` | **The master spec.** ~120 functions across 15 domains, each tagged status/priority/effort. 3-tier infra & maintenance cost. §11 = recommended answers to 7 strategic questions. |
| `docs/specs/tecxwork-cost-summary-onepager.md` | One-page cost summary + 3-year P&L skeleton for the business team. |
| `~/Desktop/tecxwork-financial-model.xlsx` | **The live financial model** (your main artifact). Interconnected: edit Assumptions → everything recalcs. Tabs: README, Assumptions, Model (36-mo), Annual P&L + Balance Sheet, Dashboard (Runway / Rev-vs-Cost / EBITDA charts). Verified 0 formula errors; balance sheet balances. |
| `docs/decks/tecxwork-sales-deck.md` | Customer-facing (event-organizer) sales deck script, 13 slides. |
| `docs/wiki/topics/v2-v3-function-list.md` | Wiki index page for the above (this repo keeps an LLM-curated wiki — see §6). |

The xlsx generator (Python/openpyxl) lives in the session scratchpad — ask if you need to regenerate the workbook from inputs rather than editing it live.

---

## 3. Locked decisions & validated numbers (do NOT re-derive or contradict)

**Product/scope decisions (ratified with Niko):**
- **Vision:** Marketplace **+** events (not event-only, not full-pivot). Event engine = moat; Talent Passport carries event data into the marketplace.
- **Platforms:** Web + PWA first (all roles) + event kiosk/tablet mode → Capacitor store wrappers in V3 → **native Android/iOS deferred** (a PWA gives ~85–90% of "an app" without a 2nd/3rd codebase; right call for a 10-person team).
- **Cost basis:** **AI-augmented**, anchored to the ~$300 MVP — NOT traditional hire rates.
- **Scale:** model in 3 tiers (Regional / National / Cross-border-max).

**Cost numbers (USD; NTD at ~32):**
- **V2+V3 engineering:** AI-augmented **~$90K–270K** · traditional-hire $570K–765K · Taiwan dev-shop ~$2.0M–2.7M.
- **The binding constraint is the AI-resistant annual floor: ~$76K–208K/yr at Tier 1** (infra + security + compliance + support + eng upkeep). *Model the company around the floor, not the build — the code is no longer the expensive part.*
- 3-yr total cost ≈ **$1.22M** (excl. S&M) / ~$1.56M (incl. S&M, default scenario).
- Margin story for investors: **$300 cost vs ~$31K (NT$1M) client price** for an equivalent MVP.

**Compliance gates (Taiwan — these are real and time-bound):**
- **ESA employment-agency license** if operating as an intermediary: **NT$500K** paid-in capital, **3–4 month** setup, a salaried **Certified Employment Service Professional**, a Taiwanese legal representative. Unlicensed fine: NT$300K–1.5M.
- **PIPA/PDPA:** consent management, right-to-be-forgotten, cross-border data flow (collection TW → storage SG/JP → processing VN) is compliant **with consent + documented transfer basis**.
- **Strategy:** stay positioned as "event/scheduling software" during validation; take the ESA license only when placement-fee monetization makes you an intermediary.

**The 7 strategic recommendations (from spec §11) — for the teams to ratify:**
1. Monetize software/ads first (organizer SaaS + employer subs + credits); placements only post-ESA. 2. Don't pre-buy the ESA license — start it ~2 quarters before placement revenue. 3. Tier-2-ready, Tier-1-priced. 4. Wrap LLMs + pgvector; don't build ML. 5. VN = talent supply, TW = employer demand. 6. SG/JP storage + consent is compliant; keep TW-region optionality. 7. Plan at the AI-augmented basis; sell the 3–4× savings story.

---

## 4. The financial model — how it works

`~/Desktop/tecxwork-financial-model.xlsx`:
- **Only edit the yellow cells** on the **Assumptions** tab. Everything else is live formulas.
- **Who edits what:** Engineering → build/infra/upkeep/security/support. Business → revenue drivers, S&M, starting capital.
- **Default scenario is illustrative:** revenue numbers are **placeholders** — that's why the default shows ~11 months runway on $300K and negative 3-yr EBITDA. The cost side is the real modeled floor.
- Open in **Excel or Google Sheets** so formulas compute (the file stores formulas, the app calculates them).

---

## 5. Suggested next steps (the backlog you're picking up)

**Immediate (financial model):**
1. **Replace placeholder revenue with real pricing/volume** — sit with the business team; pin organizer-SaaS price, employer subscription tiers, credit pricing, placement fee. Tune until runway/raise make sense.
2. **Add a scenario comparison** — Conservative / Base / Aggressive columns side-by-side (offered but not yet built).
3. **Add a funding/raise row** — model "raise $X in month Y" against the runway curve (offered but not yet built).
4. **Validate each cost line with the dev team** — confirm the AI-augmented build effort and the annual floor.

**Business case:**
5. Decide **monetization priority & sequencing** (ties to ESA timing).
6. Produce a **phased V2-A/B/C timeline (Gantt)** mapping spend to quarters (offered as option (b), not yet built).
7. **GTM / pricing strategy** vs 104/1111/CakeResume; CAC assumptions for the S&M line (currently the biggest uncosted lever).
8. **Investor-facing deck** (distinct from the existing customer sales deck) if raising.

**Open decisions to close with Niko:** ratify the 7 recommendations; confirm year-1 vs year-2 scale tier; AI build-vs-buy; whether VN is supply-only or also an employer market; data-residency hard line; the blended-rate column to plan against.

---

## 6. Environment, constraints & gotchas

- **Branches:** `main` = production (has the shipped **Export Excel** admin feature + a notification fix; deploys live on push — a push double-builds against a small Neon free tier). `multi-tenant-exploration` = working branch (all the docs above + in-progress multi-tenant Phase 0–2b code). The multi-tenant refactor is **NOT on main** by design.
- **Live data export already exists:** Admin panel → Interviews → **Export Excel** (`/api/admin/export/stats`) → 6-sheet stats workbook. A one-off pull is at `~/Desktop/tecxwork-stats-2026-06-28.xlsx`.
- **PII:** stats exports and any candidate data contain applicant emails + CV links — **keep out of git; handle/share carefully** (PIPA).
- **DB access (if needed):** use `DATABASE_URL` (pooled, live). Do **not** use `*_UNPOOLED` — it points at an empty DB. Keep queries read-only.
- **Wiki:** this repo maintains an LLM-curated wiki at `docs/wiki/` (see `AGENTS.md` / `docs/wiki/llm-wiki-guide.md`). If you edit docs in the repo, append a one-line entry to `docs/wiki/log.md` and update the relevant topic page. (If you work only in Cowork/Desktop, not required.)
- **Currency:** everything is **USD** unless marked; NTD at ~32/USD.

---

## 7. Working style Niko expects

Surface tradeoffs and ask before assuming; simplicity-first; be **explicit about what's a real number vs a placeholder vs an estimate**; don't over-claim. When you produce numbers for the business/dev teams, state the assumptions so they can adjust. Keep deliverables editable and team-friendly.

---

*Hand-off prepared by Claude Code. Master logic of record: `docs/specs/tecxwork-v2-v3-function-list.md`. Live model: `~/Desktop/tecxwork-financial-model.xlsx`.*
