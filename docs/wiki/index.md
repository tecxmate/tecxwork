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
- [V-GEN TRIDENT 2026](topics/v-gen-trident-2026.md) — flagship career fair event
- [Admin panel](topics/admin-panel.md) — area: event-config + uploads
- [Recruiter dashboard](topics/recruiter-dashboard.md) — area: company profile + slots
- [Public homepage](topics/public-homepage.md) — area: landing page + hero
- [Hero carousel](topics/hero-carousel.md) — homepage hero section: localization, aspect ratio, touch behavior
- [Photo uploads](topics/photo-uploads.md) — `ImageUpload` / `MultiImageUpload`, per-type guidelines, `homepageImages` schema
- [Event time configuration](topics/event-time-config.md) — admin time form, slot regeneration, Asia/Taipei roundtrip
- [SaaS Strategy & Product Pivot](topics/saas-strategy.md) — multi-tenant transition, Talent Passport, AI matching
- [Taiwan Legal Compliance](topics/taiwan-compliance.md) — PIPA/PDPA, MOL licenses, work permits
- [Architecture Overview](topics/architecture-overview.md) — tech stack, concurrency, data isolation, Neon/Vercel
- [Tecxmate Design System](topics/design-system.md) — visual language, typography, components, brand colors
- [Recruitment Workflows & Booking Engine](topics/recruitment-workflows.md) — admin, recruiter, and student flows; booking modes
- [Data Privacy & CV Sharing](topics/data-privacy.md) — Google Drive targeted sharing, PIPA consent, cross-border transfer

## Log
- [log.md](log.md) — append-only chronological record
