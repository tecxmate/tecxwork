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

## [2026-05-12] decision | LinkedIn-style job detail apply flow
attributed_to: [niko]   belongs_to: [recruitment-workflows, public-homepage]
- Per [niko]: job clicks should show an immediate apply button instead of sending students to the company page.
- Company logos/names on job listings now own navigation to `/recruiter/[id]` for all-company jobs browsing.
- Created decisions/2026-05-12-linkedin-style-job-apply-flow.md and updated topics/recruitment-workflows.md.

## [2026-05-13] fix | Android standalone PWA viewport frame
attributed_to: [niko]   belongs_to: [design-system, public-homepage]
- Niko shared an Android PWA screenshot with black system frame bars around a light app shell.
- Root viewport and manifest now use light app-frame color `#FAFAFA`; `colorScheme` is light.
- `mobile-bottom-nav.tsx` keeps the Android `dvh-svh` URL-bar stabilizer only outside standalone display mode.
- Updated decisions/2026-05-06-mobile-nav-pill.md and topics/design-system.md.

## [2026-05-13] fix | Android Chromium /jobs viewport framing
attributed_to: [niko]   belongs_to: [design-system, public-homepage]
- Niko clarified the framing bug persists in fresh Android Chromium browsers, only on `/jobs`; iOS and other pages are fine.
- Removed `viewport-fit=cover` from the root viewport so Android Chromium uses the normal layout viewport instead of letting the `/jobs` sticky shell sit under browser/system controls.
- Updated decisions/2026-05-06-mobile-nav-pill.md.

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

## [2026-05-07] decision | Unify event fullname across hero + page metadata
attributed_to: [niko]   belongs_to: [public-homepage, admin-panel]
- Per [niko]: admin updated `event_config.event_name` to "VSATW JOB FAIR 2026: V-GEN TRIDENT" and asked for it to render consistently.
- Hero (`src/app/page.tsx`): replaced `messages.landing.heroTitle` with `branding.name` so the admin-edited fullname drives the H1.
- Static metadata for `/jobs`, `/privacy-policy`, `/terms-of-service` converted to async `generateMetadata()` reading `getEventBranding()`.
- Hardcoded body copy ("V-GEN TRIDENT" in privacy-policy/about) intentionally untouched — those are contextual prose, not branding fields.

## [2026-05-07] fix | Slot generation ignored admin time-frame for new/edited recruiters
attributed_to: [niko]   belongs_to: [tecxwork, admin-panel, recruiter-dashboard]
- Bug: `getEventBranding()` selected only branding text/date columns, so `branding.startHour/endHour/endMinutes/slotDuration` always came from static `EVENT_CONFIG` (10:00–17:30, 15min, 0 buffer). Recruiters onboarded or who changed `interviewerCount` after the admin saved a custom time-frame received slots from 10:00 — visible as a second company still showing 10:00 cells while the admin had set 14:30–17:30.
- Bug 2: onboarding/me-recruiter slot loops never honored `startMinute` or `bufferMinutes`.
- Fix: `event-branding.ts` now reads `startHour/startMinute/endHour/endMinute/slotDurationMinutes/bufferMinutes` from `event_config`; `recruiter-onboarding.ts` and `/api/me/recruiter` now use `slotInterval = slotDuration + bufferMinutes` and respect `startMinute`/`endMinute`.
- `EventBranding` gains `startMinute`, `endMinute`, `bufferMinutes`; legacy `endMinutes` kept as alias.

## [2026-05-08] fix | Hero overlay toggle, company logo across listings
attributed_to: [niko]   belongs_to: [tecxwork, homepage, browse-page]
- Bug: with hero overlay disabled and only one homepage image, `HeroCarousel` short-circuited to `null` (slideCount<=1 && !hasOverlay) and removed the picture too. Now returns null only when there is truly nothing to show; falls through to render single-image carousel otherwise.
- Feature: company logo (`recruiters.logoUrl`) now renders on homepage company cards, browse `RecruiterCard`, homepage job cards, jobs browser cards, and `/jobs/[id]`. Falls back to `Building2` icon when null. `getCachedRecruiters`, homepage `getPublicRecruiters/getPublicJobs`, and `/jobs` listing query now select `logoUrl`. `RecruiterCardData` adds `logoUrl: string | null`; `RecruiterJobPosting` adds optional `logoUrl?: string | null`.

## [2026-05-13] fix | Harden password-reset verify against brute force
attributed_to: [claude-code]   belongs_to: [tecxwork]
- /security-review flagged `/api/auth/verify-code`: no failed-attempt cap and no rate limit on a 6-digit code → known-email account takeover via 1M-keyspace brute force inside the 10-min window.
- Schema: added `failed_attempts` column to `password_reset_codes` (drizzle/0004_password_reset_failed_attempts.sql, src/lib/db/schema.ts).
- `/api/auth/verify-code`: now mirrors verify-email — fetch latest unexpired/unused code by email, reject after 5 failures, increment `failedAttempts` on mismatch, plus IP-keyed `rateLimit(..., "auth", "verify-code")`.
- `/api/auth/forgot-password`: added `rateLimit(..., "auth", "forgot-password")` and switched from `Math.random()` to `crypto.randomInt`.
- See: decisions/2026-05-13-password-reset-brute-force-fix.md
