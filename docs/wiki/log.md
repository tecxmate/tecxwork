# Wiki Log

Append-only. Newest entries at the bottom. Standard prefix: `## [YYYY-MM-DD] <kind> | <subject>`.

## [2026-05-04] ingest | Photo upload guidelines per type
attributed_to: [niko]   belongs_to: [tecxwork, admin-panel, recruiter-dashboard]
- ImageUpload now self-documents size/format/aspect; hero switched to 3:4 vertical; activity-photos section removed from homepage
- created decisions/2026-05-04-photo-upload-guidelines.md
- updated topics/photo-uploads.md, topics/hero-carousel.md

## [2026-05-04] ingest | Hero photo localization
attributed_to: [niko]   belongs_to: [admin-panel, public-homepage]
- admin uploader now exposes EN/VI/中文 slots; public homepage shows the slot matching visitor locale
- created decisions/2026-05-04-hero-photo-localization.md
- updated topics/hero-carousel.md, topics/photo-uploads.md

## [2026-05-04] ingest | Clear orphan homepage blob files
attributed_to: [niko]   belongs_to: [admin-panel]
- 3 pre-localization JPGs deleted from Vercel Blob and homepageImages reset to []
- created decisions/2026-05-04-clear-orphan-blobs.md

## [2026-05-04] ingest | Carousel touch smoothness
attributed_to: [niko]   belongs_to: [public-homepage]
- autoplay scroll-jumps suppressed during swipe + 600ms grace; iOS momentum scrolling enabled; horizontal overscroll contained
- created decisions/2026-05-04-carousel-touch-smoothness.md
- updated topics/hero-carousel.md

## [2026-05-04] ingest | Hero image fits page
attributed_to: [niko]   belongs_to: [public-homepage]
- switched hero image fit from object-cover to object-contain on bg-background; horizontal fit on mobile, no top crop under topbar
- created decisions/2026-05-04-hero-image-contain.md
- updated topics/hero-carousel.md

## [2026-05-04] ingest | Time-setting bug fixes
attributed_to: [niko]   belongs_to: [admin-panel, tecxwork]
- slot-regen loop iterates absolute minutes and bounds slot end by event end (fixes 45-min cadence drift and end overflow)
- admin event start/end datetime-local roundtrip now goes via Asia/Taipei (was browser-local on save, raw UTC on display)
- slot-day string built via Intl Asia/Taipei (fixes server-UTC getDate() drift for early-morning Taipei start)
- /api/me/recruiter and ensureDefaultRecruiterSlots migrated to live event branding
- created decisions/2026-05-04-time-setting-bugs.md
- created topics/event-time-config.md

## [2026-05-04] ingest | Wiki bootstrapped
attributed_to: [niko]   belongs_to: [tecxwork]
- llm-wiki-guide.md upgraded to schema + portable master plan
- entities/, decisions/, topics/ skeletons created and backfilled from this session
- AGENTS.md amended with project-wiki-rules block requiring agents to maintain the wiki

## [2026-05-04] ingest | Documentation Consolidation
attributed_to: [gemini]   belongs_to: [tecxwork, tecxmate]
- Compiled all legacy documentation from docs/ subfolders into the wiki structure.
- Created stakeholders: tecxmate, vsatw, taiwan-mol, gemini, gpt.
- Created topics: saas-strategy, taiwan-compliance, architecture-overview, design-system, recruitment-workflows, data-privacy, tecxwork, v-gen-trident-2026.
- Created historical decisions: 2026-04-20-custom-booking-engine, 2026-04-24-job-moderation-toggle, 2026-04-28-double-booking-prevention, 2026-04-28-force-timeframe-override, 2026-04-30-navigation-consolidation.
- Refactored wiki to strictly align with the original LLM Wiki Master Plan (renamed entities to stakeholders, moved non-deciding entities to topics).
- Updated index.md and log.md.

## [2026-05-04] decision | Rename entities/ → stakeholders/; topics absorb non-deciders
attributed_to: [niko]   belongs_to: [tecxwork]
- Per [niko]: "stakeholders are things that can make decisions". Folder renamed; type frontmatter updated.
- Moved non-stakeholder pages (tecxwork, admin-panel, recruiter-dashboard, public-homepage, v-gen-trident-2026) into topics/.
- Schema doc, index, and AGENTS.md updated to reflect the stricter distinction: attributed_to must point at a stakeholder; belongs_to may point at either.

## [2026-05-05] decision | CV sharing hint → "Anyone with the link"
attributed_to: [niko]   belongs_to: [recruitment-workflows, data-privacy]
- Per [niko]: per-application private Drive shares to HR email caused drop-off; recruiters hit "request access" → fewer interviews.
- Changed `cvShareOnly` student-form hint in en/vi/zh-TW to instruct "Anyone with the link" (Viewer).
- Apply-only visibility model on recruiter side unchanged. PIPA/consent text unchanged.
- See: decisions/2026-05-05-cv-anyone-with-link.md

## [2026-05-05] update | CV share: rewrite tutorial + add mandatory confirm checkbox
attributed_to: [niko]   belongs_to: [recruitment-workflows, tecxwork]
- Hint copy rewritten in en/vi/zh-TW: "Chia sẻ link CV trên Google Drive và cài đặt quyền truy cập là 'Bất kỳ ai có đường link đều có thể xem'..."
- Tutorial warning boxes (vi/en/zh-TW) reversed from old "do NOT set Anyone-with-link" to new "set Anyone-with-link can view".
- BookingForm: new `cvShareConfirm` checkbox required before Apply ("bạn đã share quyền truy cập... chọn có mới được apply").

## [2026-05-06] decision | Admin toggle: hero overlay on/off
attributed_to: [niko]   belongs_to: [public-homepage, admin-panel]
- Per [niko]: an admin wanted to display the photo carousel only, without the title/tagline/countdown/CTA overlay.
- Added `event_config.hero_overlay_enabled` (default true), wired through getEventBranding, branding API, and admin Event Branding UI (Switch).
- HeroCarousel now treats falsy children as "no overlay" — no empty first slide, no extra indicator dot.
- Migration applied locally; prod run needed: `npm run db:update:hero-overlay-toggle`.
- See: decisions/2026-05-06-hero-overlay-toggle.md

## [2026-05-06] decision | Mobile bottom nav → floating pill with sliding indicator
attributed_to: [niko]   belongs_to: [design-system, public-homepage]
- Per [niko]: shared iOS Telegram/Facebook tabbar references; asked for floating pill with smooth selector. Chose single-pill layout.
- Refactored `mobile-bottom-nav.tsx`: floating centered pill, single absolutely-positioned indicator animating transform+width via refs/ResizeObserver. First paint unanimated to avoid (0,0) slide-in.
- Bumped `site-footer` mobile bottom padding (~0.875rem) across browser/Android-PWA/iOS-PWA so footer links clear the pill.
- Pre-existing /jobs URL-bar wobble: anchored pill with `bottom: calc(100dvh - 100svh + safe-area)` for Android stability; iOS scoped via `@supports (-webkit-touch-callout: none)` to plain safe-area offset since the calc pushed the pill too high on iOS.
- Implementing commits: `546a6ba`, `3b037b2`. Branch `feat/ui/navpill` merged ff into main and deleted.
- See: decisions/2026-05-06-mobile-nav-pill.md
