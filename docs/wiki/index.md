# Wiki Index

Catalog of every page in `docs/wiki/`. One line per page. Update on every create/rename.

## Schema
- [LLM Wiki — Master Plan](llm-wiki-guide.md) — schema, conventions, agent workflow, portable pattern

## Stakeholders
*Things that can make decisions: people, teams, organizations, regulators, agents.*

- [Niko (project owner)](stakeholders/niko.md) — owner / decision maker for tecxwork
- [Claude Code (Opus 4.7 1M)](stakeholders/claude-code.md) — primary agent for this repo
- [Gemini (AI Agent)](stakeholders/gemini.md) — interactive CLI agent for documentation and research
- [GPT (AI Agent)](stakeholders/gpt.md) — AI agent used for legal research and compliance
- [Tecxmate Company Limited](stakeholders/tecxmate.md) — the software consultancy developing tecxwork
- [VSA Taiwan](stakeholders/vsatw.md) — Vietnamese Student Association in Taiwan (event partner)
- [Taiwan Ministry of Labor (MOL)](stakeholders/taiwan-mol.md) — regulatory body for labor and employment in Taiwan

## Decisions
- [2026-07-16 — Migrate image uploads from Vercel Blob to Cloudflare R2](decisions/2026-07-16-r2-image-storage-migration.md) — free-tier Blob ops cap paused store access (existing images 403); swap upload backend to R2 + re-source 30 company logos to public/company-logos/
- [2026-06-06 — Upgrade live project to Vercel Pro](decisions/2026-06-06-vercel-pro-upgrade.md) — Hobby free resources exceeded on event day; Pro lifts limits and meters overage instead of throttling
- [2026-06-01 — Notification-primary apply + push prompt](decisions/2026-06-01-notification-primary-apply.md) — student apply confirmation stays notification-first; recruiter application_submitted email now sends for every application; shared usePush hook
- [2026-06-01 — Notification retention (90-day prune)](decisions/2026-06-01-notification-retention.md) — daily cron deletes notifications older than 90 days; also set the missing CRON_SECRET
- [2026-06-01 — Cache event_config; ISR rejected](decisions/2026-06-01-event-config-cache.md) — runtime-cache the per-request branding query for DB-load resilience; pages are cookie-dynamic so ISR is a no-op
- [2026-06-01 — Consolidate to one Vercel project](decisions/2026-06-01-vercel-project-consolidation.md) — delete redundant tecxwork project (was double-building main); migrate VAPID keys to app
- [2026-06-01 — Move Vercel + Neon to Tokyo](decisions/2026-06-01-tokyo-region-migration.md) — co-locate both in hnd1/ap-northeast-1 for Taiwan users; DB-first migration runbook
- [2026-06-01 — Neon pool crash hardening](decisions/2026-06-01-neon-pool-crash-hardening.md) — pool.on('error') stops WebSocket crashes; poolQueryViaFetch cuts connection storm
- [2026-05-19 — Hide HR email from student-facing pages](decisions/2026-05-19-hide-hr-email-from-students.md) — remove recruiter contact emails from public student UI and payloads
- [2026-05-13 — Admin interview moderation page; Overview → Settings](decisions/2026-05-13-admin-interview-moderation.md) — new /admin/interviews with filters + bulk soft-cancel by email; settings moved to /admin/settings
- [2026-05-13 — Event-day burst hardening](decisions/2026-05-13-event-day-burst-hardening.md) — SKIP LOCKED slot claim; two-tier auth rate limit (IP + email)
- [2026-05-13 — Password-reset brute-force fix](decisions/2026-05-13-password-reset-brute-force-fix.md) — `failed_attempts` cap + rate limit on verify-code; CSPRNG for codes
- [2026-05-12 — LinkedIn-style job detail apply flow](decisions/2026-05-12-linkedin-style-job-apply-flow.md) — job clicks open immediate apply; company logo/name opens company page
- [2026-05-06 — Mobile bottom nav → floating pill](decisions/2026-05-06-mobile-nav-pill.md) — sliding indicator; `dvh-svh` URL-bar stabilizer on Android, plain safe-area on iOS
- [2026-05-06 — Admin toggle for hero overlay](decisions/2026-05-06-hero-overlay-toggle.md) — admin can hide title/countdown/CTAs to show only the photo carousel
- [2026-05-05 — CV sharing hint → "Anyone with the link"](decisions/2026-05-05-cv-anyone-with-link.md) — student-form hint updated in en/vi/zh-TW to remove access-request friction
- [2026-05-04 — Photo upload guidelines per type](decisions/2026-05-04-photo-upload-guidelines.md) — size/format/aspect hints in `ImageUpload`; hero set to 3:4 vertical; activity-photos section removed
- [2026-05-04 — Hero photo localization (one slot per language)](decisions/2026-05-04-hero-photo-localization.md) — admin slots EN/VI/中文; visitor sees their locale
- [2026-05-04 — Clear orphan homepage blob files](decisions/2026-05-04-clear-orphan-blobs.md) — drop pre-localization images from blob and DB
- [2026-05-04 — Carousel touch smoothness](decisions/2026-05-04-carousel-touch-smoothness.md) — autoplay defers during/after swipe; iOS momentum
- [2026-05-04 — Hero image fits page (`object-contain`)](decisions/2026-05-04-hero-image-contain.md) — full-photo display, mobile horizontal fit
- [2026-05-04 — Time-setting bug fixes](decisions/2026-05-04-time-setting-bugs.md) — slot-loop cadence, end-bound, datetime-local roundtrip via Asia/Taipei, getDate() UTC drift
- [2026-04-30 — Navigation Consolidation (Desktop/Mobile)](decisions/2026-04-30-navigation-consolidation.md) — unified top bar and bottom nav; removed sidebar
- [2026-04-28 — Applicant Double-Booking Prevention](decisions/2026-04-28-double-booking-prevention.md) — advisory locks and transactions for review flow
- [2026-04-28 — Slot Release on Timeframe Override](decisions/2026-04-28-force-timeframe-override.md) — cleanup logic for orphaned slots
- [2026-04-24 — Job Moderation Toggle for Admins](decisions/2026-04-24-job-moderation-toggle.md) — added admin control for instant vs. reviewed publishing
- [2026-04-20 — Custom Booking Engine over Cal.com](decisions/2026-04-20-custom-booking-engine.md) — decision to build native logic for high-concurrency event

## Topics
*Areas, products, events, and synthesised concepts. Topics don't make decisions; stakeholders do.*

- [tecxwork web app](topics/tecxwork.md) — the product itself (area: full stack)
- [Event-Day Load Readiness](topics/load-readiness.md) — verified prod capacity (max_conn 901, pooled), slot-concurrency protections, and the per-IP venue-NAT rate-limit risk
- [V-GEN TRIDENT 2026](topics/v-gen-trident-2026.md) — flagship career fair event
- [Admin panel](topics/admin-panel.md) — area: event-config + uploads
- [Capacity analytics](topics/capacity-analytics.md) — Overview chart: per-company slot supply vs booking-request demand, status buckets, query
- [Recruiter dashboard](topics/recruiter-dashboard.md) — area: company profile + slots
- [Public homepage](topics/public-homepage.md) — area: landing page + hero
- [Link previews](topics/link-previews.md) — OG image + per-surface scraper quirks; Messenger needs cacheable headers
- [Hero carousel](topics/hero-carousel.md) — homepage hero section: localization, aspect ratio, touch behavior
- [Page hero](topics/page-hero.md) — /browse + /jobs photo-background header with luminance-adaptive text color and scrim
- [Photo uploads](topics/photo-uploads.md) — `ImageUpload` / `MultiImageUpload`, per-type guidelines, `homepageImages` schema
- [Event time configuration](topics/event-time-config.md) — admin time form, slot regeneration, Asia/Taipei roundtrip
- [SaaS Strategy & Product Pivot](topics/saas-strategy.md) — multi-tenant transition, Talent Passport, AI matching
- [Taiwan Legal Compliance](topics/taiwan-compliance.md) — PIPA/PDPA, MOL licenses, work permits
- [Taiwan Legal and Operational Framework](topics/taiwan-legal-operational-framework.md) — Legal requirements, resources, and stakeholders for operations in Taiwan
- [Architecture Overview](topics/architecture-overview.md) — tech stack, concurrency, data isolation, Neon/Vercel
- [Neon account topology & MCP wiring](topics/neon-account-topology.md) — Neon MCP is authed to org "Tecxmate" (dental-ai/alphatecx), NOT the live app DBs (delicate-lab/bitter-hill, a different login); how to re-auth
- [Drizzle + Postgres gotchas](topics/drizzle-sql-gotchas.md) — query pitfalls (reused sql in select+groupBy, all-parameter CASE, ::date slicing) + fixes
- [Tecxmate Design System](topics/design-system.md) — visual language, typography, components, brand colors
- [Recruitment Workflows & Booking Engine](topics/recruitment-workflows.md) — admin, recruiter, and student flows; booking modes
- [Data Privacy & CV Sharing](topics/data-privacy.md) — Google Drive targeted sharing, PIPA consent, cross-border transfer
- [Job detail page](topics/job-detail-page.md) — /jobs/[id] two-column reading flow (content left, apply/company panel right) + related-jobs internal linking
- [SEO & AI-search visibility](topics/seo.md) — robots/sitemap/JSON-LD/hreflang wiring + off-page brand-signal playbook to kill "did you mean texwork"
- [Local Backup & Disaster Recovery](topics/backup-dr.md) — `scripts/backup.mjs` mirrors Neon + Vercel Blob locally; hourly launchd; multi-PC setup guide

## Log
- [log.md](log.md) — append-only chronological record
