# TECXWORK — V2/V3 Capability Spec & Cost Model

**For:** Development team (effort/cost estimation) + Business team (financial-model validation)
**Author:** Product (with Claude) · **Date:** 2026-06-29 · **Status:** Draft for team validation

---

## 0. How to read this document

This is **not an MVP list** — it's the V2→V3 build-out that turns TECXWORK from a single career-fair tool into an **always-on, cross-border (Vietnam ↔ Taiwan) job marketplace with a flagship career-fair engine**, benchmarked against 104, 1111, and CakeResume.

- Every function has an **ID**, **status**, **priority (V2 / V3)**, and **effort size**.
- **Status** tells the dev team what NOT to re-estimate: `BUILT` (exists today), `PARTIAL` (foundation exists), `NEW`.
- **Effort** is engineering only. Legal/entity/licensing OPEX is in §13 (it's large and the business team must not miss it).
- Cost is **ballpark + effort sizing** (your chosen basis). The dev team refines the numbers; this gives them and the business team a defensible starting frame.

### Effort legend (blended rate assumption)

| Size | Person-weeks | Ballpark dev $ | Meaning |
|---|---|---|---|
| **S** | 1 | ~$1.5K | One dev, a few days |
| **M** | 2–4 | $3K–6K | One dev, ~half a sprint |
| **L** | 5–10 | $7.5K–15K | 1–2 devs, ~1 sprint |
| **XL** | 12–20 | $18K–30K | Small squad, multi-sprint, cross-cutting |

> **Blended rate assumption: ~US$1,500 / person-week** (≈ $37/hr fully-loaded), anchored to your own reference point (tecxmate delivered a 2-month MVP for ~NT$1M ≈ US$31K). Range to model: **$1,200–1,800/pw**. Swap to a Taiwan dev-shop rate (~3–4× higher) if you want the "build it locally" comparison. **All dollar figures below scale linearly with this rate — change one assumption, change the whole model.**

### Platform decision (locked)

| Track | Scope | When |
|---|---|---|
| **Responsive Web + PWA** | All roles (seeker, recruiter, org-admin, platform-admin). Installable, offline-capable, web-push. | **V2 (foundation)** |
| **Event kiosk / tablet mode** | Locked responsive layout of the same web app for on-site check-in / queue / interview rooms. Not a separate client. | **V2/V3** |
| **Capacitor store wrappers** | Wrap the PWA to get Play Store / App Store presence, reusing ~90% of web code. | **V3 (optional)** |
| **Fully-native Android → iOS** | Separate codebases. | **Deferred** — see recommendation below |

> **Recommendation for a 10-person team: do NOT build native mobile in V2/V3.** A PWA already delivers ~85–90% of "an app" (home-screen install, offline, push, camera/file) from the one codebase you already maintain. Native = 2–3 codebases, app-store release trains, device-matrix QA, and a *separate* security/pen-test surface — a permanent tax that directly competes with the compliance and security work that actually de-risks the business. Kiosk/tablet is cheap (it's responsive web). Go native (via Capacitor first) only in V3+ once revenue justifies it.

---

## 1. Product vision

> A cross-border talent bridge: Vietnamese talent ↔ Taiwanese employers. Always-on marketplace (search jobs, build a profile, get matched, message, apply) **plus** the career-fair/event engine as the differentiator competitors don't have. The event engine is the wedge; the marketplace is the retention and revenue.

**Three pillars:** (1) **Marketplace** parity with 104/1111/CakeResume, (2) **Events** as the moat (Talent Passport carries data across events into the marketplace), (3) **Cross-border compliance & mobility** as the trust layer (work permits, credential verification, PIPA/PDPA, ESA licensing).

---

## 2. Function list

Status key: `BUILT` · `PARTIAL` · `NEW`  |  Priority: **V2** / **V3**

### A. Job Seeker / Talent  *(prefix TS)*

| ID | Function | Status | Pri | Effort |
|---|---|---|---|---|
| TS-01 | Account, profile, locale (en/vi/zh-TW) | BUILT | V2 | — |
| TS-02 | **Structured resume/profile builder** (work history, education, skills, certs, work-auth) — replaces single CV link as primary | PARTIAL | V2 | L |
| TS-03 | **Multi-CV management** + keep Google-Drive "explicit targeted sharing" as an option | PARTIAL | V2 | M |
| TS-04 | AI resume parsing → auto-fill profile from uploaded CV (PDF/docx) | NEW | V2 | L |
| TS-05 | **Talent Passport** — profile + interview history persists across events into marketplace | PARTIAL | V2 | L |
| TS-06 | Profile completeness score + guided onboarding checklist | NEW | V2 | M |
| TS-07 | Job search: keyword, filters (location, category, salary, employment type, visa-support, language) | PARTIAL | V2 | L |
| TS-08 | Saved searches + job alerts (email/push) | NEW | V2 | M |
| TS-09 | Bookmarks / saved jobs / saved companies | PARTIAL | V2 | S |
| TS-10 | One-click apply + application tracker (status pipeline) | PARTIAL | V2 | M |
| TS-11 | **Recommended jobs** (AI matching feed) | NEW | V2 | L |
| TS-12 | Recruiter/employer messaging inbox | NEW | V2 | L |
| TS-13 | Interview scheduling / booking (event + non-event) | BUILT | V2 | — |
| TS-14 | Calendar sync (Google/Outlook/ICS) for interviews | NEW | V3 | M |
| TS-15 | Profile privacy controls (discoverable flag, field-level visibility, anonymity to current employer) | NEW | V2 | M |
| TS-16 | "Right to be forgotten" self-serve data export + deletion (PIPA/PDPD) | PARTIAL | V2 | M |
| TS-17 | Skills assessments / verified badges (language, technical) | NEW | V3 | L |
| TS-18 | Company reviews & salary insights (read) | NEW | V3 | L |
| TS-19 | Referrals / invite friends | NEW | V3 | S |
| TS-20 | Localized career content / guides (working in Taiwan, visa basics) | NEW | V3 | M |

### B. Employer / Recruiter  *(prefix ER)*

| ID | Function | Status | Pri | Effort |
|---|---|---|---|---|
| ER-01 | Recruiter account + company profile + email-domain verification | BUILT | V2 | — |
| ER-02 | **Multi-recruiter company accounts** (seats, roles, shared pipeline) | NEW | V2 | L |
| ER-03 | Job posting CRUD + moderation workflow | BUILT | V2 | — |
| ER-04 | Job posting templates, duplication, bulk import | NEW | V2 | M |
| ER-05 | **Applicant Tracking System (ATS)** — stages, notes, tags, ratings, collaborative review | PARTIAL | V2 | XL |
| ER-06 | Candidate search / talent-pool sourcing (search the Talent Passport pool, with consent) | NEW | V2 | XL |
| ER-07 | Interview slot management + booking engine | BUILT | V2 | — |
| ER-08 | Messaging with candidates (templated + free-form) | NEW | V2 | L |
| ER-09 | Bulk actions (shortlist, reject-with-reason, invite-to-interview) | PARTIAL | V2 | M |
| ER-10 | Employer analytics (funnel, time-to-hire, source) | NEW | V2 | L |
| ER-11 | Company branding page (media, culture, open roles) | PARTIAL | V3 | M |
| ER-12 | Job slot/credits & featured-listing purchase | NEW | V2 | M |
| ER-13 | CV/contact unlock with consent + audit (anti-bypass) | PARTIAL | V2 | M |
| ER-14 | Employer verification / KYB (business registration check) | NEW | V2 | L |
| ER-15 | Saved candidate searches + talent alerts | NEW | V3 | M |
| ER-16 | Interview feedback & scorecards | NEW | V3 | M |
| ER-17 | Offer management / status to "hired" (closes the loop for analytics & billing) | NEW | V3 | L |

### C. Marketplace, Search & Matching  *(prefix MM)*

| ID | Function | Status | Pri | Effort |
|---|---|---|---|---|
| MM-01 | Full-text job + company search (Postgres FTS → dedicated engine at scale) | PARTIAL | V2 | L |
| MM-02 | Faceted filtering + relevance ranking | PARTIAL | V2 | M |
| MM-03 | **Semantic / vector search** (embeddings over jobs & profiles) | NEW | V3 | L |
| MM-04 | **AI candidate↔job matching engine** (score, explain, rank) | NEW | V2 | XL |
| MM-05 | Recommendation feeds (jobs for seeker, candidates for recruiter) | NEW | V2 | L |
| MM-06 | De-dup & normalization of crawled external jobs (104/1111) | PARTIAL | V2 | M |
| MM-07 | Salary benchmarking dataset & display | NEW | V3 | L |
| MM-08 | Trending/aggregate market insights (public, cached) | PARTIAL | V3 | M |
| MM-09 | Matching feedback loop (learn from outcomes) | NEW | V3 | L |

### D. Career-Fair / Event Engine  *(prefix EV)* — the moat

| ID | Function | Status | Pri | Effort |
|---|---|---|---|---|
| EV-01 | Atomic, race-safe slot booking (advisory locks, SKIP LOCKED) | BUILT | V2 | — |
| EV-02 | Multi-mode booking (applicant-books-recruiter / recruiter-books-applicant / both) | BUILT | V2 | — |
| EV-03 | Event config: branding, timeframe, slot generation | BUILT | V2 | — |
| EV-04 | **Multi-event, multi-organization** management (org → events) | PARTIAL | V2 | XL |
| EV-05 | Event registration / ticketing / check-in | NEW | V2 | L |
| EV-06 | **Kiosk / tablet mode** — on-site check-in, queue, interview-room display | NEW | V2 | L |
| EV-07 | Live event dashboard (organizer ops view) + event-pulse | PARTIAL | V2 | M |
| EV-08 | Waitlist + auto-promotion (made atomic — see fix in TR/PL) | PARTIAL | V2 | M |
| EV-09 | Reschedule / cancel flows with notifications | BUILT | V2 | — |
| EV-10 | Post-event: convert event applicants → marketplace talent pool | NEW | V2 | M |
| EV-11 | White-label per-organizer (domain, theme, copy) | NEW | V3 | L |
| EV-12 | Virtual / hybrid event mode (video interview rooms) | NEW | V3 | XL |
| EV-13 | Exhibitor/booth management + floor map | NEW | V3 | L |

### E. Cross-Border VN↔TW Compliance & Mobility  *(prefix CB)* — the trust layer

| ID | Function | Status | Pri | Effort |
|---|---|---|---|---|
| CB-01 | Tri-lingual everything (en/vi/zh-TW), incl. emails & docs | BUILT | V2 | — |
| CB-02 | **Work-permit / visa eligibility hints** per candidate↔job (foreign-student work rules) | PARTIAL | V2 | M |
| CB-03 | Work-authorization status on profile + employer-visible flags | PARTIAL | V2 | M |
| CB-04 | **Credential / school verification** (Taiwan school registry already in DB; extend to VN) | PARTIAL | V2 | L |
| CB-05 | Anti-discrimination guardrails (no illegal filters on gender/age/nationality) | NEW | V2 | M |
| CB-06 | **Cross-border data-flow controls** (collection TW, storage SG/JP, processing VN) — documented residency + transfer basis | PARTIAL | V2 | M |
| CB-07 | Document vault (offer letters, permits) with consented sharing | NEW | V3 | L |
| CB-08 | Recruitment-agency workflow support (if operating under ESA license): mandated records, fee transparency | NEW | V3 | L |
| CB-09 | Localized legal copy: terms, privacy, consent per jurisdiction | PARTIAL | V2 | M |
| CB-10 | Vietnam-side overseas-labor compliance hooks (e.g., DOLAB-style record-keeping) | NEW | V3 | M |

### F. Trust, Safety & Moderation  *(prefix TR)*

| ID | Function | Status | Pri | Effort |
|---|---|---|---|---|
| TR-01 | Job-post moderation (manual + rules) | BUILT | V2 | — |
| TR-02 | **AI + rules fraud/scam detection** (fake jobs, fee-scams, phishing) | NEW | V2 | L |
| TR-03 | Employer KYB / trust score | NEW | V2 | L |
| TR-04 | Report/flag content + abuse queue | NEW | V2 | M |
| TR-05 | Rate-limit & anti-scraping (built; extend) | BUILT | V2 | — |
| TR-06 | Spam / bot signup defense (captcha, device, velocity) | PARTIAL | V2 | M |
| TR-07 | Content/PII redaction in messaging (anti-bypass, anti-leak) | NEW | V3 | M |
| TR-08 | Duplicate-application prevention (DB constraint — current gap) | NEW | V2 | S |
| TR-09 | Audit logging of sensitive actions (partial today) | PARTIAL | V2 | M |

### G. Communications & Notifications  *(prefix CM)*

| ID | Function | Status | Pri | Effort |
|---|---|---|---|---|
| CM-01 | Transactional email (Resend) | BUILT | V2 | — |
| CM-02 | In-app notifications + 90-day prune | BUILT | V2 | — |
| CM-03 | Web push (PWA) | BUILT | V2 | — |
| CM-04 | **In-platform messaging/chat** (seeker↔recruiter) with threading | NEW | V2 | L |
| CM-05 | SMS / WhatsApp / Zalo / LINE notifications (cross-border reach) | NEW | V3 | L |
| CM-06 | Notification preferences & digest control | NEW | V2 | M |
| CM-07 | Templated multilingual campaigns (organizer → participants) | PARTIAL | V3 | M |
| CM-08 | Email deliverability hardening (SPF/DKIM/DMARC, reputation) | PARTIAL | V2 | S |

### H. Payments, Billing & Monetization  *(prefix PM)*

| ID | Function | Status | Pri | Effort |
|---|---|---|---|---|
| PM-01 | **Billing platform** (plans, invoices, tax/VAT, multi-currency NTD/USD/VND) | NEW | V2 | XL |
| PM-02 | Employer subscriptions + job-credit packs | NEW | V2 | L |
| PM-03 | Featured listings / boosts / promoted profiles | NEW | V2 | M |
| PM-04 | Event-organizer SaaS plans (per-event / season) | NEW | V2 | L |
| PM-05 | Payment-gateway integration (TW: TapPay/NewebPay/Stripe; VN: VNPay/MoMo) | NEW | V2 | L |
| PM-06 | Talent-Passport / premium seeker tier (optional) | NEW | V3 | M |
| PM-07 | Coupons, trials, referrals credit | NEW | V3 | M |
| PM-08 | Revenue reporting & reconciliation (finance) | NEW | V3 | M |
| PM-09 | Refunds, dunning, failed-payment recovery | NEW | V3 | M |

### I. Identity, Auth & Access  *(prefix ID)*

| ID | Function | Status | Pri | Effort |
|---|---|---|---|---|
| ID-01 | Custom JWT + bcrypt auth, email verification, password reset | BUILT | V2 | — |
| ID-02 | **OAuth social login** (Google; LINE for TW) | NEW | V2 | M |
| ID-03 | **MFA / 2FA** (TOTP, critical for recruiter/admin) | NEW | V2 | M |
| ID-04 | **RBAC**: platform-admin, org-admin, recruiter, seeker (membership-scoped) | PARTIAL | V2 | L |
| ID-05 | Session management, device list, forced logout | PARTIAL | V2 | M |
| ID-06 | SSO for enterprise employers (SAML/OIDC) | NEW | V3 | L |
| ID-07 | Account recovery hardening + anti-takeover | PARTIAL | V2 | M |

### J. Security & Privacy/Compliance Platform  *(prefix SE)*

| ID | Function | Status | Pri | Effort |
|---|---|---|---|---|
| SE-01 | **PIPA/PDPA consent management** (granular, versioned, audit) | PARTIAL | V2 | L |
| SE-02 | **DSAR engine** — access/correct/delete/export, SLA-tracked | PARTIAL | V2 | L |
| SE-03 | Data retention & purge policies (automated) | PARTIAL | V2 | M |
| SE-04 | **Encryption** at rest + field-level for sensitive PII; KMS/secrets mgmt | PARTIAL | V2 | L |
| SE-05 | **WAF + DDoS** (managed), bot management | NEW | V2 | M |
| SE-06 | Full **audit trail** of data access (who saw which candidate) | PARTIAL | V2 | L |
| SE-07 | Security monitoring / SIEM, anomaly alerts | NEW | V2 | L |
| SE-08 | Vulnerability mgmt: dependency scanning, SAST/DAST, secrets scanning in CI | NEW | V2 | M |
| SE-09 | **Annual penetration test + remediation** (recurring) | NEW | V2 | L |
| SE-10 | Incident response plan + breach-notification workflow (PIPA) | NEW | V2 | M |
| SE-11 | Role-scoped data minimization (fix "both-mode" full-directory exposure) | NEW | V2 | M |
| SE-12 | Backup, PITR & **disaster-recovery drills** | PARTIAL | V2 | M |
| SE-13 | Compliance posture toward ISO 27001 / SOC 2 readiness (enterprise sales) | NEW | V3 | XL |

### K. Platform, Multi-tenancy & Scale  *(prefix PL)*

| ID | Function | Status | Pri | Effort |
|---|---|---|---|---|
| PL-01 | **Multi-tenancy wiring** — enforce event/org scoping across all APIs (schema exists, enforcement pending) | PARTIAL | V2 | XL |
| PL-02 | Tenant isolation & per-tenant config/branding | PARTIAL | V2 | L |
| PL-03 | **Search infra** (Postgres FTS → Typesense/Meili → OpenSearch) as volume grows | NEW | V2 | L |
| PL-04 | **Caching & queueing** (Redis/Upstash; background jobs) | PARTIAL | V2 | L |
| PL-05 | **Async job/worker system** (parsing, matching, emails, crawls) | PARTIAL | V2 | L |
| PL-06 | DB scaling: read replicas, partitioning, connection mgmt | PARTIAL | V3 | L |
| PL-07 | Observability: logs, metrics, tracing, APM, dashboards | PARTIAL | V2 | M |
| PL-08 | Feature flags + staged rollout | NEW | V2 | M |
| PL-09 | Multi-region readiness (latency for TW + VN) | PARTIAL | V3 | L |
| PL-10 | Load & soak testing harness (event-spike simulation) | PARTIAL | V2 | M |
| PL-11 | Atomic cancellation/waitlist refactor (current consistency gap) | NEW | V2 | M |
| PL-12 | CI/CD, IaC, environment parity (preview/stage/prod) | PARTIAL | V2 | M |

### L. Data, Analytics & AI  *(prefix AI)*

| ID | Function | Status | Pri | Effort |
|---|---|---|---|---|
| AI-01 | Resume parsing (LLM) → structured data | NEW | V2 | L |
| AI-02 | Skill taxonomy & normalization (multilingual) | NEW | V2 | L |
| AI-03 | Matching model + "why matched" explanations | NEW | V2 | XL |
| AI-04 | Embeddings + vector store for semantic search | NEW | V3 | L |
| AI-05 | Analytics warehouse + BI dashboards (product, growth, revenue) | NEW | V2 | L |
| AI-06 | Event-organizer & employer reporting exports (CSV/Excel — Excel BUILT) | PARTIAL | V2 | S |
| AI-07 | AI guardrails: bias checks on matching, PII handling in prompts | NEW | V2 | M |
| AI-08 | Fraud/anomaly ML (overlaps TR-02) | NEW | V3 | L |
| AI-09 | Chatbot / assistant (job-seeker guidance, multilingual) | NEW | V3 | L |

### M. Admin, Back-office & Ops  *(prefix OP)*

| ID | Function | Status | Pri | Effort |
|---|---|---|---|---|
| OP-01 | Admin dashboard (users, recruiters, events, exports) | BUILT | V2 | — |
| OP-02 | Recruiter approval / domain allow-list | BUILT | V2 | — |
| OP-03 | **Org/tenant management console** | NEW | V2 | L |
| OP-04 | Moderation queues & trust ops console | NEW | V2 | L |
| OP-05 | Support tooling: impersonation (audited), user lookup, refunds | NEW | V3 | L |
| OP-06 | Content management (homepage, categories, schools, legal pages) | PARTIAL | V2 | M |
| OP-07 | Feedback/bug intake (built) + triage workflow | PARTIAL | V2 | S |
| OP-08 | Billing/finance back-office views | NEW | V3 | M |
| OP-09 | Internal RBAC + admin audit log | PARTIAL | V2 | M |

### N. Integrations & Public API  *(prefix IN)*

| ID | Function | Status | Pri | Effort |
|---|---|---|---|---|
| IN-01 | External job crawler (104 / 1111) — built; harden & expand | PARTIAL | V2 | M |
| IN-02 | Calendar (Google/Outlook/ICS) | NEW | V3 | M |
| IN-03 | Payment gateways (TW + VN) | NEW | V2 | (see PM-05) |
| IN-04 | Email/SMS/messaging providers (Resend + SMS + LINE/Zalo) | PARTIAL | V2 | M |
| IN-05 | ATS/HRIS export & webhooks for employers | NEW | V3 | L |
| IN-06 | Public/partner API + API keys + rate plans | NEW | V3 | L |
| IN-07 | SSO / identity providers (overlaps ID-06) | NEW | V3 | — |
| IN-08 | Analytics/marketing (GA4, attribution, CRM) | NEW | V2 | S |

### O. Client Platforms  *(prefix CL)*

| ID | Function | Status | Pri | Effort |
|---|---|---|---|---|
| CL-01 | Responsive web, all roles | BUILT | V2 | — |
| CL-02 | **PWA**: installable, offline shell, web push, app manifest | PARTIAL | V2 | M |
| CL-03 | Kiosk/tablet locked mode (event) | NEW | V2 | (see EV-06) |
| CL-04 | Accessibility (WCAG 2.1 AA) | PARTIAL | V2 | M |
| CL-05 | Capacitor store wrappers (Play/App Store) | NEW | V3 | L |
| CL-06 | Fully-native Android | NEW | Deferred | XL |
| CL-07 | Fully-native iOS | NEW | Deferred | XL |

---

## 3. Effort rollup (engineering only)

> Counting **NEW + PARTIAL** work (BUILT excluded). Using S=1, M=3, L=7.5, XL=16 person-weeks as midpoints.

| Phase | Scope | Est. person-weeks | Ballpark dev cost @ $1.5K/pw |
|---|---|---|---|
| **V2** | Marketplace core, ATS, multi-tenancy wiring, matching v1, billing, security baseline, PWA+kiosk, compliance baseline | **~230–300 pw** | **$345K – $450K** |
| **V3** | Semantic search, virtual events, white-label, SSO/enterprise, SOC2 readiness, advanced AI, store wrappers, payments depth | **~150–210 pw** | **$225K – $315K** |
| **V2 + V3 total** | | **~380–510 pw** | **$570K – $765K** |

**Calendar time** (10-person team ≈ 6–7 productive engineers): V2 ≈ **9–12 months**, V3 ≈ **6–9 months** → ~**15–21 months** end-to-end. Range to model with rate band $1,200–1,800/pw: **~$455K (low) → ~$920K (high)** for V2+V3 engineering.

> ⚠️ These are *planning-grade* numbers for the business model. The dev team should re-estimate per function against the real codebase before any commitment.

---

## 4. Non-functional requirements & scale tiers

| Dimension | Tier 1 — Regional | Tier 2 — National | Tier 3 — Cross-border max |
|---|---|---|---|
| Registered users | ≤ 500K | 1–3M | 3M+ |
| Peak concurrent | ≤ 10K (event spikes) | ≤ 50K | 50K+ (always-on + spikes) |
| Events / year | tens | hundreds | hundreds + always-on marketplace |
| Availability SLA | 99.5% | 99.9% | 99.95% |
| RPO / RTO | 24h / 4h | 1h / 1h | ≤15m / ≤30m |
| Search | Postgres FTS | Typesense/Meili | OpenSearch/Elastic cluster |
| DB | Neon single (autoscale) | Neon scale + read replica | Replicas + partitioning/sharding |

**Verified today:** booking concurrency is race-safe (advisory locks + SKIP LOCKED, tested); DB probed at **901 max connections** (connection exhaustion is *not* the bottleneck); rate-limiting hardened (1200/min public, 300/min api, 5/min auth). Known gaps to close in V2: duplicate-apply DB constraint (TR-08), atomic cancel/waitlist (PL-11), Neon paid tier (free-tier quota was exhausted 2026-06-11), and role-scoped directory exposure (SE-11).

---

## 5. Infrastructure cost — 3 tiers (monthly, USD)

> Managed-first (your current Vercel + Neon model). Ranges; mid-points in parentheses. AI spend is usage-driven and volatile.

| Component | Tier 1 / mo | Tier 2 / mo | Tier 3 / mo |
|---|---|---|---|
| Hosting/compute (Vercel/Fluid or containers) | $200–600 | $1.5K–4K | $6K–15K |
| Postgres (Neon → replicas) | $100–400 | $1K–3K | $5K–12K |
| Search engine | $50–200 | $500–1.5K | $3K–8K |
| Cache/queue (Redis) | $30–150 | $300–800 | $1.5K–4K |
| Object storage + CDN | $50–200 | $400–1.2K | $2K–6K |
| Email / SMS / messaging | $50–300 | $500–2K | $3K–10K (SMS-driven) |
| Push notifications | ~$0–50 | $100–400 | $500–1.5K |
| **AI/LLM + embeddings + vector DB** | $200–1K | $2K–8K | $10K–40K |
| Observability / APM / logs | $50–300 | $500–2K | $3K–8K |
| Security (WAF/DDoS/secrets/scanning) | $100–400 | $800–2.5K | $4K–10K |
| Backups / DR | $30–150 | $300–1K | $1.5K–4K |
| **Infra subtotal / month** | **~$0.9K–4.0K** | **~$8.4K–28K** | **~$40K–125K** |
| **Infra / year** | **~$11K–48K** | **~$100K–340K** | **~$480K–1.5M** |

> The two cost drivers that explode at scale are **AI/LLM usage** (matching, parsing, semantic search) and **messaging (SMS)**. Both should be metered, cached, and tied to monetization. Most of V2 launches comfortably in **Tier 1**.

---

## 6. Maintenance & run-rate (annual)

| Item | Basis | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|---|
| Ongoing engineering (bugfix, upkeep, deps, ~18–22% of build/yr) | % of dev | $90K–140K | $140K–220K | $200K–300K |
| Infrastructure (from §5) | metered | $11K–48K | $100K–340K | $480K–1.5M |
| Security & compliance (pen-test, audits, DPO time, SOC2 upkeep) | recurring | $20K–50K | $50K–120K | $120K–300K |
| Support / trust & safety ops staff | headcount | $25K–60K | $80K–200K | $250K–600K |
| **Maintenance subtotal / year** | | **~$145K–300K** | **~$370K–880K** | **~$1.05M–2.7M** |

---

## 7. Engineering cost summary (for the business model)

| | Low | High |
|---|---|---|
| **V2 build** (one-time, eng) | $345K | $450K |
| **V3 build** (one-time, eng) | $225K | $315K |
| **Annual run-rate** (Tier 1 → Tier 2 as you grow) | $145K | $880K |

---

## 8. Business-team note: this is NOT all the cost

Engineering is one column. The **cross-border legal/entity OPEX is material and gates Taiwan commercial launch** (from the compliance research):

- **Taiwan ESA employment-agency license** if operating as a recruitment intermediary: **500,000 NTD** min. paid-in capital; **20K–50K NTD** incorporation/licensing; **3–4 month** setup. Unlicensed operation fine: **300K–1.5M NTD**.
- **Certified Employment Service Professional** — at least one, as ongoing salaried overhead.
- **Taiwanese legal representative** (Vietnamese founders on ARC can't be the 負責人).
- **Recommended structure:** "Bootstrapped Sibling" — Tecxmate Taiwan LLC + software-licensing agreement to Tecxmate Vietnam (~60% revenue), preserving equity and shifting profit.
- **Strategic sequencing:** stay positioned as **"event operations / scheduling software"** during validation to minimize ESA burden; take on the agency license only when the marketplace monetization (CV-unlock, placements) makes you legally an intermediary.

These belong in the financial model as **legal/compliance OPEX + a Taiwan entity setup line**, separate from engineering.

---

## 9. Recommended sequencing (so cost lands in the right order)

1. **V2-A (foundation, ~Tier 1):** multi-tenancy wiring (PL-01), RBAC (ID-04), security baseline (SE-01..SE-09), PWA (CL-02), close known gaps (TR-08, PL-11, SE-11), Neon paid tier. *De-risks legal + scale before growth.*
2. **V2-B (marketplace):** profile builder + parsing (TS-02/04), search (MM-01/02), ATS (ER-05), matching v1 (MM-04/AI-03), messaging (CM-04), billing + payments (PM-01/05). *Turns it into a marketplace + switches on revenue.*
3. **V2-C (events at scale):** multi-event/org (EV-04), kiosk (EV-06), registration/check-in (EV-05), event→pool conversion (EV-10).
4. **V3:** semantic search, virtual events, white-label, SSO/enterprise, SOC2 readiness, store wrappers, payments/finance depth, advanced AI.

---

## 10. Open questions for the teams

1. **Monetization priority** — employer subscriptions vs job-credits vs placement fees vs organizer SaaS? (Determines which PM items are V2 vs V3 and when you legally become an "agency".)
2. **ESA license timing** — validate as "software" first, or license up-front to enable placement revenue? (3–4 month gate.)
3. **Scale target to budget against** — which tier does the business plan assume in year 1 vs year 2? (§5/§6 give all three.)
4. **AI build vs buy** — own matching models, or wrap LLM APIs (faster, opex-heavy)? Affects AI-03 effort and §5 AI line.
5. **VN-side strategy** — is Vietnam a sourcing market only, or also an employer market? (Adds VN payments, VN legal hooks CB-10.)
6. **Data residency hard line** — is SG/JP storage acceptable long-term, or will TW/VN require in-country storage (changes infra cost)?
7. **Blended rate** — confirm $1,500/pw, or should the dev team price at local-team vs Taiwan-shop rates?

---

## 11. Recommended answers to the open questions

> Product's recommendations (2026-06-29). These are decisions to ratify, not facts — the teams should challenge them.

**Q1 — Monetization priority.** Sequence by **legal risk**, because charging a placement/success fee is what legally turns you into an employment agency (ESA license). 
- **V2 (ESA-light, software & advertising model):** organizer SaaS (per-event/season) + employer subscriptions + job-credit packs + featured listings. These sell *software and visibility*, not placements — low agency risk. Organizer SaaS is already your model.
- **V3 (post-license):** placement/success fees (highest revenue per hire) + optional premium seeker tier.
- **Never charge students** (trust + PIPA optics + the VSA MOU). 
- ⚠️ Treat **paid CV/contact-unlock** as the borderline case — if you charge employers to reach candidates at scale it edges toward intermediary status; keep it consent-gated and revisit under the ESA decision.

**Q2 — ESA license timing.** **Validate as "event/scheduling software" first; don't pay the 3–4-month / 500K-NTD gate up front.** Start the license process *in parallel* once two things are true: (a) the "Bootstrapped Sibling" Taiwan LLC exists, and (b) placement-fee revenue is clearly worth it. Because licensing takes 3–4 months, **kick it off ~2 quarters before you intend to switch on placement monetization.** Software/SaaS revenue funds the runway while the license is pending.

**Q3 — Scale tier to budget against.** **Build Tier-2-ready, run Tier-1-priced.** Reality: today is ~167 applicants and 1 event, so even Tier 1 (≤500K users) is aspirational for year 1. 
- **Year 1:** provision **Tier 1** (~$11K–48K/yr infra) — cheap, with big headroom. 
- **Year 2:** plan the **Tier 1→Tier 2** transition *gated on real growth milestones*, not calendar. 
- Design the architecture (search infra, queues, read replicas, multi-region) so scaling is a **config/provisioning change, not a re-architecture** — but don't *pay* for Tier 2/3 until usage demands it.

**Q4 — AI build vs buy.** **Buy (wrap LLM APIs) for V2; revisit "build" only in V3.** Wrap Claude/Gemini for resume parsing, skill extraction, and match explanations; use **pgvector on Neon** for embeddings/semantic search (no separate vector DB at Tier 1 — keeps AI-04 cheap). A 10-person team should not stand up an ML training pipeline now. Control cost with caching, batching, and small-model routing for cheap tasks. Only consider owning models in V3 if AI becomes a top-3 cost line **and** you have proprietary placement-outcome data worth training on.

**Q5 — Vietnam-side strategy.** **VN = talent/supply market first; TW = employer/demand market.** This is the bridge thesis. Keep VN supply-side in V2 (VN students/workers build profiles → TW employers hire). **Defer VN-as-employer-market (VN companies posting jobs) to V3+** — it doubles the compliance surface (VN labor law, VN payments, VN employer KYB) and dilutes focus. Keep one VN hook on the radar even in supply-only mode: overseas-labor record-keeping (DOLAB-style, CB-10) becomes relevant *if/when* you facilitate paid placements abroad — i.e., tied to the same ESA/placement decision.

**Q6 — Data-residency hard line.** **SG/JP storage is fine for now.** PIPA permits cross-border transfer with **explicit consent + adequate protection** — so the real requirements are versioned consent (SE-01) and a documented transfer basis (CB-06), *not* in-country storage. Keep **TW-region optionality** (PL-09) so residency becomes a config change if (a) an enterprise/government client contractually demands TW residency or (b) PIPA changes. Don't pay for in-country storage until a client requires it.

**Q7 — Blended rate.** Present **two columns** in the business model: your real basis **in-house/VN blended $1,500/pw**, and a **Taiwan dev-shop reference at ~$4,500–6,000/pw (3–4×)**. Plan against $1,500/pw; cite the Taiwan multiple as the **cost-advantage narrative** (it's literally your `cost-efficiency` pitch — same build, ~70% less). At 3.5×, the V2+V3 engineering range (~$570K–765K in-house) would be **~$2.0M–2.7M** at a local shop — a useful headline for the business/investor audience.

### One-line takeaways
1. Monetize software/ads first, placements after the license. 2. Don't pre-buy the ESA license — start it ~2 quarters before placement revenue. 3. Tier-2-ready, Tier-1-priced. 4. Wrap LLMs + pgvector; don't build ML. 5. VN supply, TW demand. 6. SG/JP storage + consent is compliant; keep TW-region optionality. 7. Plan at $1,500/pw; sell the 3–4× savings story.

---

*Assumptions: blended eng rate ~$1,500/person-week; managed-cloud-first infra; figures are planning-grade for financial modelling, to be refined by the dev team against the live codebase. All dollar amounts scale with the rate assumption.*
