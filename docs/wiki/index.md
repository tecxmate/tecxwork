# Wiki Index

Catalog of every page in `docs/wiki/`. One line per page. Update on every create/rename.

## Schema
- [LLM Wiki — Master Plan](llm-wiki-guide.md) — schema, conventions, agent workflow, portable pattern

## Entities
- [Niko (project owner)](entities/niko.md) — owner / decision maker for tecxwork
- [Claude Code (Opus 4.7 1M)](entities/claude-code.md) — primary agent for this repo
- [tecxwork web app](entities/tecxwork.md) — the product itself (area: full stack)
- [Admin panel](entities/admin-panel.md) — area: event-config + uploads
- [Recruiter dashboard](entities/recruiter-dashboard.md) — area: company profile + slots
- [Public homepage](entities/public-homepage.md) — area: landing page + hero

## Decisions
- [2026-05-04 — Photo upload guidelines per type](decisions/2026-05-04-photo-upload-guidelines.md) — size/format/aspect hints in `ImageUpload`; hero set to 3:4 vertical; activity-photos section removed
- [2026-05-04 — Hero photo localization (one slot per language)](decisions/2026-05-04-hero-photo-localization.md) — admin slots EN/VI/中文; visitor sees their locale
- [2026-05-04 — Clear orphan homepage blob files](decisions/2026-05-04-clear-orphan-blobs.md) — drop pre-localization images from blob and DB
- [2026-05-04 — Carousel touch smoothness](decisions/2026-05-04-carousel-touch-smoothness.md) — autoplay defers during/after swipe; iOS momentum
- [2026-05-04 — Hero image fits page (`object-contain`)](decisions/2026-05-04-hero-image-contain.md) — full-photo display, mobile horizontal fit
- [2026-05-04 — Time-setting bug fixes](decisions/2026-05-04-time-setting-bugs.md) — slot-loop cadence, end-bound, datetime-local roundtrip via Asia/Taipei, getDate() UTC drift

## Topics
- [Hero carousel](topics/hero-carousel.md) — homepage hero section: localization, aspect ratio, touch behavior
- [Photo uploads](topics/photo-uploads.md) — `ImageUpload` / `MultiImageUpload`, per-type guidelines, `homepageImages` schema
- [Event time configuration](topics/event-time-config.md) — admin time form, slot regeneration, Asia/Taipei roundtrip

## Log
- [log.md](log.md) — append-only chronological record
