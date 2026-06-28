# TECXWORK — Cost Summary & 3-Year P&L Skeleton (one-pager)

**For the business team to validate & paste into a financial model.** All figures **USD** (NTD at ~32/USD). Cost basis = **AI-augmented (Claude/Codex)**, anchored to the ~$300 V1 MVP. Numbers are **planning midpoints**; low/high ranges are in `tecxwork-v2-v3-function-list.md`. Source of truth for logic: that spec.

### Planning assumptions (change these first)
- **Build basis:** AI-augmented, founder-led + 1–3 lean hires. V2 mostly Year 1; V3 across Years 2–3.
- **Scale trajectory:** Year 1 = Tier 1 · Year 2 = Tier 1→2 · Year 3 = Tier 2. (Stay Tier 1 longer if growth is slower — cheaper.)
- **ESA / Taiwan entity:** set up Year 1; certified employment professional salaried from Year 2 (when placement revenue switches on).
- **Revenue = placeholder.** Pricing is TBD — fill the revenue block; cost block is fully modeled.

---

## 1. One-time build cost (AI-augmented)

| | USD | NTD |
|---|---|---|
| V2 build | ~$55K–160K | NT$1.8M–5.1M |
| V3 build | ~$35K–110K | NT$1.1M–3.5M |
| **Total V2+V3** | **~$90K–270K** | **NT$3M–8.6M** |

*Context only: same scope at a Taiwan dev-shop ≈ $2.0M–2.7M. The build is no longer the expensive part — the annual floor below is.*

---

## 2. 3-Year P&L skeleton (planning midpoints, USD)

| Line | Year 1 | Year 2 | Year 3 | Notes |
|---|---:|---:|---:|---|
| **REVENUE** *(business fills)* | | | | |
| Organizer SaaS (per-event/season) | `[fill]` | `[fill]` | `[fill]` | events × price |
| Employer subscriptions | `[fill]` | `[fill]` | `[fill]` | seats × price |
| Job credits / featured listings | `[fill]` | `[fill]` | `[fill]` | usage |
| Placement / success fees | — | `[fill]` | `[fill]` | **post-ESA only** |
| **Total revenue** | `[fill]` | `[fill]` | `[fill]` | |
| **DIRECT COSTS (COGS)** | | | | |
| Infrastructure (incl. AI/LLM) | 25 | 90 | 180 | Tier 1→2 |
| Payment processing | `~3% rev` | `~3% rev` | `~3% rev` | gateway fees |
| **Gross profit** | `[calc]` | `[calc]` | `[calc]` | rev − COGS |
| **OPERATING EXPENSES** | | | | |
| Engineering — build | 70 | 65 | 35 | V2 then V3 |
| Engineering — upkeep | 35 | 35 | 35 | AI-augmented |
| Security & compliance | 30 | 50 | 80 | pen-test, audit, DPO; SOC2-ready Y3 |
| Support / trust & safety | 30 | 80 | 180 | scales with users |
| Legal / ESA / cert. professional | 45 | 25 | 25 | Y1 one-time setup; then salary |
| G&A / entity / misc | 20 | 35 | 50 | |
| Sales & marketing *(business fills)* | `[fill]` | `[fill]` | `[fill]` | |
| **Total cost (COGS + OpEx, excl. S&M)** | **~255** | **~380** | **~585** | $K |
| in NTD | NT$8.2M | NT$12.2M | NT$18.7M | |
| **EBITDA** | `[rev − total cost]` | `[…]` | `[…]` | |

**3-year total cost (excl. S&M & revenue): ≈ $1.22M (~NT$39M).**

---

## 3. Revenue streams to model (V2 = ESA-light; placements come later)

| Stream | Live from | Driver to fill |
|---|---|---|
| Organizer SaaS | V2 / Year 1 | # events/yr × price/event |
| Employer subscriptions | V2 / Year 1 | # paying employers × monthly plan |
| Job credits + featured | V2 / Year 1 | volume × unit price |
| Placement / success fees | **V3 / Year 2+ (needs ESA license)** | # placements × fee |
| Premium seeker tier (optional) | V3 | # subscribers × price · *never charge students by default* |

> **Breakeven test:** the business hits breakeven in the first year where **Total revenue ≥ Total cost row + S&M**. With the cost floor ~$255K (Y1) → ~$585K (Y3), that's the bar revenue must clear.

---

## 4. Sensitivities (what moves the model most)

1. **Scale tier** — staying Tier 1 a year longer cuts infra + support materially (Year 3 could be ~$300K not ~$585K). Don't provision scale before usage.
2. **ESA timing** — delaying the license defers ~$25K/yr cert-professional salary **and** the placement-fee revenue. Tie both to the same trigger.
3. **AI-augmented productivity** — if delivery runs hotter (toward the $300-MVP end), build drops toward $90K; if more hires/novel work, toward $270K.
4. **S&M** — the one big uncosted lever here; the business team owns it. CAC × target users will likely dwarf the build.

---

## 5. Balance-sheet note (not in P&L)
- **ESA paid-in capital ≈ NT$500K (~$15.6K)** — recoverable equity, not an expense. Sits on the balance sheet, not the P&L above.

*Planning-grade. Costs from the AI-augmented basis in `tecxwork-v2-v3-function-list.md`; dev team to refine, business team to validate revenue & S&M.*
