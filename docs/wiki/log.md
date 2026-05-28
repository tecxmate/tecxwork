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

## [2026-05-13] fix | Restore iPhone viewport-fit behavior
attributed_to: [niko]   belongs_to: [design-system, public-homepage]
- Niko reported the Android Chromium `/jobs` viewport experiment broke iPhone rendering.
- Restored `viewport-fit=cover`; Android `/jobs` needs a page-level fix that does not remove iOS safe-area behavior.
- Updated decisions/2026-05-06-mobile-nav-pill.md.

## [2026-05-13] ingest | Remove Codex Zenshin test recruiter accounts
attributed_to: [niko]   belongs_to: [tecxwork, recruiter-dashboard]
- Removed recruiter test users `codex.zenfa.1778505900@zenshin.com.tw` and `codex.zenfa.1778505800@zenshin.com.tw`.
- Cascade cleanup deleted 1 booking, 18 recruiter slots, 2 recruiter profiles, and 2 user rows.
- Verification query found no remaining `codex.%@zenshin.com.tw` users.

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

## [2026-05-13] fix | Event-day burst hardening
attributed_to: [claude-code]   belongs_to: [tecxwork, recruitment-workflows]
- Walked through 200-student/20-recruiter event load. Found two real burst issues.
- Slot claim: `review` and `reverse` did `SELECT random()` then `UPDATE … status='available'` — two concurrent acceptances could pick the same row and one would see spurious "slot taken" while another free interviewer existed. Replaced with single `UPDATE … WHERE id = (SELECT … FOR UPDATE SKIP LOCKED LIMIT 1)` so concurrent transactions always pick different rows.
- Reverse-route side effect: previous code updated the applicant slot to booked BEFORE the recruiter slot CAS; if the CAS lost the race, `return { ok:false }` committed the applicant-slot-booked state with no matching booking. New flow claims recruiter slot first, then applicant slot, with explicit revert on applicant-slot failure.
- Auth rate limit: `rateLimit(ip, "auth")` = 5/min/IP would lock out an entire venue NAT. Switched to two-tier: outer `api` bucket (60/min/IP) + inner `auth` bucket (5/min per email) on `login`, `verify-code`, `forgot-password`.
- See: decisions/2026-05-13-event-day-burst-hardening.md

## [2026-05-13] fix | Android jobs page horizontal overflow
attributed_to: [claude-code]   belongs_to: [tecxwork, jobs-page]
- Report: /jobs on Android Chromium had dead space / horizontal overflow on the right; iOS Safari was fine.
- Root cause: `<select>` elements in `RecruiterJobsBrowser` size to their longest `<option>` on Android Chromium. Long location strings (full addresses) made the location select wider than the viewport, pushing the flex-wrap row past the screen edge.
- Fix: added `min-w-0 max-w-full` to each filter `<select>` and `shrink-0` on the Filter icon (src/components/recruiter-jobs-browser.tsx). `min-w-0` overrides flex item default `min-width: auto`; `max-w-full` caps intrinsic width at parent width.

## [2026-05-13] feat | Unified bulleted-list editor for job postings
attributed_to: [claude-code]   belongs_to: [tecxwork, recruiter-dashboard, jobs-page]
- Report: recruiter form used plain <textarea>, but renderer (RecruiterJobPostingCard, recruiter-detail) auto-bulleted every non-empty line. Editing experience didn't match the rendered output.
- Decision: smart-textarea approach over full WYSIWYG (TipTap). Lightweight, no deps. User chose this option.
- New component `BulletTextarea` (src/components/bullet-textarea.tsx): toolbar 'Bulleted list' toggle, Enter on bulleted line continues list, Enter on empty bullet exits list, Backspace right after marker removes bullet. Normalizes legacy values (no markers + multi-line) by prepending '• ' on first mount so editor matches renderer.
- Renderer updates (recruiter-job-posting-card.tsx, recruiter/[id]/recruiter-detail.tsx): parseContent groups consecutive '• '/'- '/'* ' lines into <ul>, other non-empty lines render as <p>. Legacy fallback preserved — values with NO markers and multi-line content still render as one bullet per line, so existing data looks unchanged until re-edited.
- Wired BulletTextarea into description/responsibilities/requirements/benefits fields on recruiter dashboard. Added 'bulletedList' string to recruiter en + zh-TW messages.

## [2026-05-13] feat | Admin job-review buttons reflect current status
attributed_to: [claude-code]   belongs_to: [tecxwork, admin-dashboard]
- Approve/Reject buttons on admin job review now show filled when the action would change state, hollow when the job is already in that state. Pending/draft → both filled. Approved → approve becomes green-border on white, reject stays filled red. Rejected → reject becomes red-border on white, approve stays filled green. `aria-pressed` reflects current status.
- Verified: with `jobModerationEnabled = false` (auto-accept on), recruiter POST /api/me/jobs inserts new jobs as `moderationStatus: "approved"` directly (src/app/api/me/jobs/route.ts:194), so they bypass admin review. Admin queue only sees jobs created while moderation was on, or jobs the recruiter explicitly submits for review.

## [2026-05-13] feat | Admin job moderation: compact list + detail page
attributed_to: [claude-code]   belongs_to: [tecxwork, admin-dashboard]
- Admin /admin/jobs list rows were tall (full description + notes textarea + quick-details grid each). On mobile, each card filled the screen so the moderator could only see one or two jobs at once.
- Restructured: list rows are now compact, one row per job — title, company badge, status pill, location/type/created-date, approve+reject buttons. Whole row is a <Link> to /admin/jobs/[id]; the action buttons stop propagation so quick approve/reject still works inline.
- New /admin/jobs/[id] page (src/app/admin/jobs/[id]/page.tsx) reuses RecruiterJobPostingCard so admins see the exact same layout students see on /jobs/[id], with an approve/reject + admin-notes card below in place of the apply CTA.
- Notes textarea moved to detail page only. List-row approve/reject re-uses the job's persisted moderationNotes.

## [2026-05-13] feat | Admin can manually add applicants
attributed_to: [claude-code]   belongs_to: [tecxwork, admin-dashboard]
- Use case: applicants who can't complete email verification (deliverability issues, school filters). Admin creates account on their behalf.
- POST /api/admin/applicants (admin-only) takes { email, name, password }. Validates: email format, name non-empty, password meets min length. Rejects duplicates. Single transaction: insert user (role=applicant, hashed password) + applicantProfile (cvLink empty, pipaConsent true on behalf of user).
- UI: AddApplicantPanel collapsible card on /admin/applicants. Three inputs + Create button. Password shown in plain text input by design so admin can copy-share offline.

## [2026-05-13] ingest | Email copy now matches "Anyone with the link" CV-sharing policy
attributed_to: [niko]   belongs_to: [recruitment-workflows, data-privacy]
- Confirmation email's "Important — CV Sharing" box and the applicant reminder bullet (src/lib/email/index.ts) were still warning students NOT to set their Drive link to "Anyone can view" — the opposite of what the booking form now tells them. Reversed to match.
- Extends decision `docs/wiki/decisions/2026-05-05-cv-anyone-with-link.md`. Commit `a6e32d8`.

## [2026-05-13] fix | Recruiter job save button feedback
attributed_to: [niko]   belongs_to: [recruiter-dashboard]
- Recruiter reported that job edits save successfully but the button stays as `Save`, making the result feel uncertain.
- Updated the job editor so the button shows in-flight `Saving...`, then disabled gray `Saved` when the current draft matches the persisted job; any edit re-enables `Save`.
- Updated `docs/wiki/topics/recruiter-dashboard.md`.

## [2026-05-13] fix | Recruiter new-job add button feedback
attributed_to: [niko]   belongs_to: [recruiter-dashboard]
- Clarified that the new-job CTA is the `Add` button and should have the same duplicate-submit guard and visual feedback as edit.
- Added create-path state: `Add` becomes `Saving...` during POST, then disabled gray `Saved` after success on the reset form; typing the next draft clears it back to `Add`.
- Updated `docs/wiki/topics/recruiter-dashboard.md`.

## [2026-05-13] fix | Recruiter salary currency allowlist
attributed_to: [niko]   belongs_to: [recruiter-dashboard]
- Recruiter job salary currency is no longer arbitrary text. The form now renders a currency select with TWD, VND, and USD first.
- Added shared salary currency options in `src/lib/job-posting.ts`; create/update API routes reject unknown currency codes.
- Updated `docs/wiki/topics/recruiter-dashboard.md`.

## [2026-05-13] fix | Event-configured recruiter salary currencies
attributed_to: [niko]   belongs_to: [recruiter-dashboard, admin-panel]
- For this event, recruiter job forms should only show TWD, VND, and USD by default.
- Added `event_config.salary_currency_options` with default `[TWD,VND,USD]`, admin controls in `/admin/settings`, and recruiter/API filtering so hidden currencies cannot be saved.
- Ran `npm run db:update:salary-currency-options` against the configured database.

## [2026-05-15] fix | Recruiter editor save feedback
attributed_to: [niko]   belongs_to: [recruiter-dashboard]
- Added a sticky save-status strip to recruiter company/jobs editing surfaces.
- The strip distinguishes all saved, unsaved changes, saving, saved, and failed states; job submit/delete buttons now show spinners while requests are in flight.
- Updated `docs/wiki/topics/recruiter-dashboard.md`.

## [2026-05-15] fix | Admin settings save feedback
attributed_to: [niko]   belongs_to: [admin-panel]
- Added a sticky `/admin/settings` save-status strip summarizing saving, saved, and error states across the settings page.
- Platform setting changes now show explicit in-flight/saved/error feedback and roll back optimistic UI state when `/api/admin/mode` fails.
- Updated `docs/wiki/topics/admin-panel.md`.

## [2026-05-13] decision | Admin interview moderation page + Overview→Settings demotion
attributed_to: [niko]   belongs_to: [admin-panel, recruitment-workflows]
- New /admin/interviews with status filter chips, per-row soft cancel, and bulk-cancel by email substring (walks the existing DELETE /api/bookings/[id] so the cancellation email + slot release + waitlist promotion all run unchanged). Admin top nav now: Recruiters · Jobs · Applicants · Interviews.
- Overview content moved to /admin/settings, reachable via a gear icon in the desktop topbar and a Settings entry in the mobile hamburger. /admin 307-redirects to /admin/interviews.
- Hard delete deliberately kept out of the UI — audit trail preserved. Decision: docs/wiki/decisions/2026-05-13-admin-interview-moderation.md. Commit `15bd038`.

## [2026-05-15] fix | Public recruiter industry badge overflow
attributed_to: [niko]   belongs_to: [recruitment-workflows, public-homepage]
- Completed the mobile overflow hardening by making public recruiter-card industry badges shrink and truncate like the already-fixed position chips.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-15] feat | Company photo full-screen viewer
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Recruiter detail company gallery thumbnails now open into a full-screen photo viewer with close, previous/next, Escape, and arrow-key controls.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-15] feat | LinkedIn-style job card recruiter logos
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Public job cards now show larger recruiter logo blocks; clicking the logo or company name opens the recruiter profile.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-15] feat | Browse/jobs decorative image carousels
attributed_to: [niko]   belongs_to: [recruitment-workflows, photo-uploads, admin-panel]
- Added admin-managed wide image slots for `/browse` and `/jobs`; each page can show one image or a two-image horizontal carousel above the list.
- Added `event_config.browse_page_images` and `event_config.jobs_page_images`; ran `npm run db:update:page-images`.
- Updated `docs/wiki/topics/recruitment-workflows.md` and `docs/wiki/topics/photo-uploads.md`.

## [2026-05-15] fix | Seamless job-card recruiter logos
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Removed the extra border/background frame around uploaded recruiter logos on public job cards; placeholder icons keep the framed treatment.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-15] feat | Company photo viewer swipe navigation
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Company photo viewer now supports swipe left/right plus left/right screen tap zones, and uses higher-contrast floating navigation controls.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-15] fix | Company photo viewer side-rail arrows
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Moved company photo viewer arrows outside the centered image into narrow side rails and removed circular arrow backgrounds.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-15] fix | Active nav pill scrolls to top
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Removed the separate floating Back-to-top button and made tapping the active mobile bottom-nav pill smoothly scroll the current page to top.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-15] fix | Recruiter company description editor size
attributed_to: [niko]   belongs_to: [recruiter-dashboard]
- Expanded the recruiter company profile description editor into a taller adaptive textarea and grouped smaller company fields below it.
- Updated `docs/wiki/topics/recruiter-dashboard.md`.

## [2026-05-15] fix | Flatten My Company editor
attributed_to: [niko]   belongs_to: [recruiter-dashboard]
- Removed the single card wrapper around the My Company editor so the form uses page-level space; description leads, uploads sit in a side column on wide screens.
- Updated `docs/wiki/topics/recruiter-dashboard.md`.

## [2026-05-15] fix | Colocate recruiter save action with status
attributed_to: [niko]   belongs_to: [recruiter-dashboard]
- Collapsed recruiter company/job save feedback into a single stateful button that floats above the mobile bottom nav and removed duplicate lower save buttons.
- Updated `docs/wiki/topics/recruiter-dashboard.md`.

## [2026-05-15] chat | Mobile nav long-label behavior
attributed_to: [niko]   belongs_to: [design-system, public-homepage]
- Niko clarified from a mobile nav screenshot that a tab title should never wrap to a second line; when there is not enough width, hide the title and show only the icon.
- Updated `docs/wiki/decisions/2026-05-06-mobile-nav-pill.md`.

## [2026-05-15] chat | Mobile nav all-or-nothing labels
attributed_to: [niko]   belongs_to: [design-system, public-homepage]
- Niko clarified that mobile nav labels should hide as a group; mixed icon-only and labeled tabs are not acceptable.
- Updated `docs/wiki/decisions/2026-05-06-mobile-nav-pill.md`.

## [2026-05-16] chat | Student CV LinkedIn import idea
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko asked whether students can import LinkedIn data to autofill CV/profile fields, citing resume builders with similar LinkedIn import flows.
- Noted that official LinkedIn profile APIs are permission-gated; the safer product path is consent-based student upload/paste of their own LinkedIn PDF/export/text for parsing into editable fields.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-16] chat | Student CV export idea
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko proposed adding CV export for students who have already completed their profile/CV data, as a more immediately useful feature than LinkedIn import.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-16] feat | Student CV export
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Added a `/profile` CV export section that previews a polished CV generated from student profile data and exports via browser print/Save as PDF.
- The template includes the main-logo wordmark font for `tecxwork` at the bottom, without extra generated-by text.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-16] fix | CV export branding
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko asked to remove the `TECXWORK CV` top label and `Generated by TECXWORK` footer copy from the exported student CV.
- The bottom `tecxwork` wordmark now uses the same wordmark font as the main logo.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-16] fix | Mobile nav hydration mismatch
attributed_to: [niko]   belongs_to: [design-system, public-homepage]
- Fixed a React hydration mismatch in the mobile bottom nav caused by measurement-only label spans and client-only layout/device calculations.
- The nav now loads through a no-SSR client wrapper, preserving measured long-label behavior without server/client HTML drift.
- Updated `docs/wiki/decisions/2026-05-06-mobile-nav-pill.md`.

## [2026-05-16] fix | Student CV export print document
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko reported that Export PDF returned a blank result.
- Changed student CV export from page-level `window.print()` to a dedicated print window populated with the CV template HTML and active stylesheet assets.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-16] fix | Student profile CV section order
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko clarified that the CV Link belongs with the My CV QR Code card and Export CV should appear after the My Profile form.
- Reordered `/profile` so QR/CV link comes first, profile editing remains central, and CV export sits at the end.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-16] fix | Compact CV QR card layout
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko clarified that My CV QR Code should place the QR code on the left and the CV link plus QR action buttons on the right to save vertical space.
- Added a horizontal QR card layout variant and applied it to the student profile CV QR card only.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-16] fix | CV header university line break
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko asked for the university to render on a separate line in the generated CV header.
- Updated the CV template header to show major and university as separate lines, with the university in bold.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-16] fix | Compact My Profile header
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko asked to optimize the `/profile` header space by removing the separate icon and using the person avatar on the top left with profile details to the right.
- Moved the avatar upload control into the My Profile header and removed the duplicate in-form profile photo block.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-17] fix | Safari CV PDF blank page
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko reported that student CV PDF export still produced a blank Safari print page.
- Fixed the export path to clone the visible `.student-cv-export-surface` into the print window instead of the hidden `.student-cv-print-only` wrapper.
- Preserved the cursive `tecxwork` wordmark by applying the app root font classes and waiting for print-window fonts before opening the print dialog.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-17] fix | CV PDF print metadata margins
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko asked to remove browser-generated print metadata such as title, date, URL, page count, and the border around the exported CV content.
- Changed CV print CSS to use a zero-margin A4 page with internal document padding and a borderless CV surface.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-17] fix | Direct student CV PDF download
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko showed that Safari still displayed browser print metadata and a larger inset around the CV even after print CSS changes.
- Replaced the `/profile` CV export flow with direct client-side PDF generation from the rendered CV surface, bypassing Safari print preview.
- Removed the Safari-insecure SVG/canvas snapshot path after it raised a runtime `SecurityError`; the PDF is now generated as vector text instead.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-17] fix | Restore browser-rendered CV export
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko rejected the direct PDF generator because it broke the CV typography and layout.
- Restored the browser-rendered print-window export and kept the fix that carries the app root font classes so the cursive `tecxwork` wordmark remains correct.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-17] fix | SVG CV wordmark footer
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko asked to use SVG for the `tecxwork` mark at the bottom of the exported CV.
- Replaced the CV footer's plain text mark with an inline SVG wordmark and targeted the SVG text in the print-window font override.
- Reverted the SVG wordmark after Safari PDF output broke the CV text layout; the footer is back to stable text with the wordmark font override.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-17] fix | Expanded industry tags
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko asked for more company industry tags, including Beauty.
- Added Beauty and additional sector options to public company filters, admin recruiter industry selection, and student preferred-industry choices.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-19] decision | Hide HR email from students
attributed_to: [niko]   belongs_to: [data-privacy]
- Niko reported students were applying directly by emailing HR after finding recruiter contact emails in the platform.
- Removed recruiter `contactEmail` from student-facing recruiter/job page payloads, public recruiter API cache results, and booking-form copy.
- Added `docs/wiki/decisions/2026-05-19-hide-hr-email-from-students.md` and updated `docs/wiki/topics/data-privacy.md`.

## [2026-05-19] fix | Guest all-companies navigation
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko reported that guests clicking "all companies" on the homepage were being sent to sign in.
- Changed homepage companies-section "View all" links from `/get-started` to `/browse`, preserving public company browsing for guests.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-19] fix | Construction industry option
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko asked to add Construction as a company industry type.
- Added Construction to recruiter/company industry options, public filtering, and localized student preferred-industry labels.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-19] fix | Logo upload JSON error handling
attributed_to: [niko]   belongs_to: [photo-uploads]
- Niko reported company logo upload showing `Unexpected token '<'`, indicating the client parsed an HTML error response as JSON.
- Added `/api/upload` storage-config guard, JSON error handling around Vercel Blob writes, and safer client parsing for non-JSON responses.
- Updated `.env.example` with `BLOB_READ_WRITE_TOKEN` and `docs/wiki/topics/photo-uploads.md`.

## [2026-05-19] fix | Event venue changed to MCUT
attributed_to: [niko]   belongs_to: [v-gen-trident-2026]
- Niko requested changing the event location to MCUT (Ming Chi University of Technology).
- Updated static event defaults, schema/default seed values, admin placeholder copy, and event wiki context.
- Added a DB update script so existing `event_config` rows can be moved from NTUT to MCUT.

## [2026-05-19] fix | Optional job location
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko clarified that if a company does not put a job location on the JD, the platform should leave it empty rather than falling back to the event venue.
- Removed recruiter dashboard/API validation requiring job location; existing public cards already hide empty location badges.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-19] fix | DB-backed event venue display
attributed_to: [niko]   belongs_to: [v-gen-trident-2026]
- Niko asked to apply the event location variable anywhere venue text had been hardcoded.
- Switched recruiter detail event-venue display and Open Graph image venue text to use DB-backed event branding instead of static `EVENT_CONFIG` values.
- Kept job location independent and optional; empty job locations remain blank.

## [2026-05-24] fix | Recruiter detail mobile language menu
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko flagged that the mobile recruiter-detail header cramped the company title by showing the full language switcher inline.
- Moved the student language switcher into the mobile hamburger menu on recruiter detail pages while keeping it visible on desktop.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-24] fix | Browser-default first-visit language
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko asked for first-time users to see their browser default language without manually switching on first sign-in/use.
- Added supported-language preference detection for `Accept-Language` and `navigator.languages`, persisted locale cookies on first load, and kept existing manual locale choices authoritative.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-24] fix | Company card logo layout
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko asked company cards to match the job-card logo/title treatment: seamless uploaded logos, no extra frame gaps, and text laid out to the right of a larger logo.
- Updated `RecruiterCard` to use the same larger uploaded-logo block and right-side company title/details layout as job cards.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-24] fix | Long horizontal company logos
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko flagged Bellwether-style long horizontal uploaded logos needing better fit inside square card logo frames.
- Added a small safe inset to uploaded-logo images in company and job cards while preserving `object-contain` and the unframed uploaded-logo treatment.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-25] fix | Recruiter application email
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko asked for recruiters to receive an email as soon as a student submits an application.
- Added a pending-application recruiter email in the student booking submission flow and kept confirmation emails tied to recruiter acceptance.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-25] fix | Job card long metadata layout
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko flagged long job addresses overflowing card boundaries and breaking the layout.
- Constrained location, salary, and deadline metadata in public/internal job cards and external job displays with bounded flex items and truncated inner text.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-26] fix | PWA install reminder cap
attributed_to: [niko]   belongs_to: [public-homepage]
- Niko asked to remind users to install the PWA at most three times.
- Updated `InstallPrompt` to cap shown reminders at three per browser, migrate the legacy dismissed flag as one prior reminder, and suppress prompts after install/standalone mode.
- Updated `docs/wiki/topics/public-homepage.md`.

## [2026-05-26] chat | Job category filtering request
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko shared stakeholder input asking whether jobs can be filtered by Business/general, Tech/Engineering, and Service/Hospitality categories.
- Validation: current jobs have no job-level category field; safest implementation is an additive blank-default `job_openings.job_category` text field with admin-only tagging in job review/moderation and public filtering on `/jobs`.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-26] fix | Job category tagging
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Implemented additive job-level categories for Business/general, Tech/Engineering, and Service/Hospitality across schema, admin tagging, public filtering, and job cards.
- Ran `db:update:job-category` and backfilled 84 blank existing jobs only: 38 Business, 38 Tech/Engineering, 8 Service/Hospitality; follow-up dry-run found 0 blanks.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-27] fix | PWA install identity
attributed_to: [niko]   belongs_to: [public-homepage]
- Niko shared an iOS Add to Home Screen screenshot where the install sheet used the event name and a fallback V icon.
- Updated PWA manifest/root metadata so the installed app name is `tecxwork` and iOS gets an explicit tecxwork Apple touch icon.
- Updated `docs/wiki/topics/public-homepage.md`.

## [2026-05-27] chat | Shareable job category links
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko asked for client-shareable category pages such as `/jobs/tech` and `/jobs/business`.
- Current `/jobs/[id]` detail route makes exact `/jobs/<category>` a route-dispatch choice; implemented `/jobs/cat/<slug>` as one dynamic category page that reuses the shared jobs listing.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-27] fix | Homepage company cards
attributed_to: [niko]   belongs_to: [public-homepage]
- Niko noted that homepage company cards still used the old design compared with the company directory tab.
- Updated the homepage company section to reuse the shared `RecruiterCard` design and data shape.
- Updated `docs/wiki/topics/public-homepage.md`.

## [2026-05-27] feature | Recruiter reschedule proposal + slot pending count
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Pending applications were piling up because students booked times recruiters couldn't honor; added recruiter "Suggest time" action so a pending booking transitions to `reschedule_proposed` with a `proposed_time` field. Student receives email + in-app notification and can Accept (claims a slot at the proposed time and confirms) or Decline (cancels).
- Added pending-count badge per time on the student slot picker (counts pending/waitlisted/reschedule_proposed for that recruiter+time) so students can self-route to less-popular slots.
- Migration `0005_reschedule_proposed.sql` adds `reschedule_proposed` to `booking_status`, `booking_reschedule_proposed` to `notification_type`, and `proposed_time`/`proposed_by_email` columns on `bookings`.
- Recruiter can also Change time (re-propose) or Retract (back to pending) on an awaiting-student booking without waiting for student response.
- Updated `docs/wiki/topics/recruitment-workflows.md`.

## [2026-05-27] update | Category filter routes to /jobs/cat/<slug>
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- The `/jobs` category select now navigates to the shareable category page (`/jobs/cat/business`, `/jobs/cat/tech`, `/jobs/cat/service`) instead of filtering in place; selecting "All" routes back to `/jobs`. The category-locked variant of the page (e.g. `/jobs/cat/tech`) still hides the select, so behavior on that page is unchanged.

## [2026-05-27] fix | Home page server-render error from missing "use client" in RecruiterCard
attributed_to: [niko]   belongs_to: [public-homepage, design-system]
- Symptom: `work.tecxmate.com/` rendered the global "This page couldn't load" fallback in browsers (digest `814491961`). Curl returned 200 but the HTML stream was truncated at ~153 KB with a `$RX("B:1", "814491961")` error marker; live deploy reported `● Ready`. Vercel's deployment thumbnail also captured the error state.
- Cause: `src/components/recruiter-card.tsx` calls `useStudentI18n()` (a `useContext`-based client hook from `student-locale-provider.tsx`) without `"use client"` at the top. Next.js treated it as a Server Component, `useContext` threw at render time, and React closed the streamed Suspense boundary with the error digest. Regression introduced in `c112b18 "Reuse company cards on homepage"`. Every other consumer of `useStudentI18n` already had the directive — `recruiter-card.tsx` was the only one missing it.
- Fix: added `"use client"` to `recruiter-card.tsx` (commit `0ce3c4f`). Post-fix HTML grew from 153 KB to 328 KB; tail ends with `$RC("B:1","S:1")` (successful resolve) instead of `$RX(...)` (boundary error).
- Lesson: any component that calls `useStudentI18n`, `useRecruiterI18n`, or any `useContext`-based hook must have `"use client"` at the top, even if it looks like a pure-presentational card. The build succeeds either way — failure only surfaces at runtime.
- Also addressed the long-standing build warning "Using edge runtime on a page currently disables static generation" by moving `opengraph-image.tsx` off Edge runtime onto Fluid Compute with `export const dynamic = "force-dynamic"` (commit `f400d39`).

## [2026-05-27] update | Enable Vercel Analytics
attributed_to: [niko]   belongs_to: [tecxwork, public-homepage]
- Installed `@vercel/analytics` and mounted `<Analytics />` in `src/app/layout.tsx` so visitor/page-view counts are captured during the pre-event window.
- Cookieless by default; no PIPA consent banner required. Free hobby tier covers ~2.5k events/month — bumps to Pro tier limits automatically if the project is on Pro.

## [2026-05-28] update | OG image is now the cursive wordmark
attributed_to: [niko]   belongs_to: [tecxwork, public-homepage]
- Replaced the V-GEN TRIDENT layout in `src/app/opengraph-image.tsx` with a minimal "tecxwork" wordmark: white background, Instrument Serif italic, `#8C52FF`. Font binary fetched from Google Fonts at request time and passed to `ImageResponse` via `fonts:` (Satori needs the binary, not a CSS family).
- Reasoning: niko asked the link preview to mirror the in-app brand mark rather than carry event-specific copy. Decoupling from `EVENT_CONFIG` also means OG no longer needs touching when the event changes.

## [2026-05-28] feature | Cross-company conflict hint on recruiter "propose time"
attributed_to: [niko]   belongs_to: [tecxwork, recruiter-dashboard, bookings]
- When a recruiter (Company B) suggests a new time to a student who is on B's waiting list, the propose-time modal now shows the student's confirmed busy ranges at OTHER companies. Times only — no company or position is leaked.
- Stack: new `src/lib/applicant-busy.ts` (helper + overlap check), new `GET /api/bookings/[id]/applicant-busy` (recruiter-scoped), soft-guard added to `POST /api/bookings/[id]/propose-time` returning `409` on overlap unless `force: true`. Recruiter dashboard fetches ranges on modal open, renders red chips, and switches the submit button to "Suggest anyway" after a 409.
- Why: niko's product question — Student A picks 5 slots across 5 companies, including Company B's waiting list. When B later proposes a time, B should see A's commitments at other companies so the suggestion doesn't double-book. Recruiter override is allowed because offline negotiation sometimes makes an overlapping suggestion legitimate.
- Statuses counted as busy: `accepted` and `reschedule_proposed`. Slot duration is taken from the booking's `slots` / `applicant_slots` row when present, else falls back to 30 min.

## [2026-05-28] followup | Applicant-busy guard only covers 1/3 of the double-booking surface
attributed_to: [claude, niko]   belongs_to: [tecxwork, recruiter-dashboard, bookings, applicant-busy]
- The cross-company conflict warning shipped above only fires on the recruiter "propose time" path. Two related gaps remain:
  1. **Accept path is unguarded.** `POST /api/bookings/review` (action=accept) does not call `getApplicantBusyRanges`. If a student's `requestedTime` overlaps a commitment at another company, the recruiter accepts blind. Arguably the bigger leak than propose, since accept is the more common action.
  2. **Student-initiated bookings are unguarded.** When a student picks a slot via the booking flow, the UI does not warn them they already hold an overlapping booking. No server check either.
- Why we didn't extend it now: niko's product question was specifically about the waitlist→propose case (Bạn A on Company B's waiting list; B suggests a time). Scoping to that flow kept the change small and reviewable. Extending to the other two is straightforward (same helper, applied at the `review` accept branch and at the student booking endpoint), but each needs its own privacy + UX decision pass.
- How to apply: if a future task says "stop students being double-booked end to end," reuse `src/lib/applicant-busy.ts` and add the same overlapsBusy check at the accept handler and at student-side slot selection. Decide separately whether the student should see *which* company they're already busy with (probably yes, since it's their own data) vs. recruiters (currently no, by design).

## [2026-05-28] fix | Link previews on Meta platforms now show OG thumbnail
attributed_to: [niko]   belongs_to: [tecxwork, public-homepage]
- Instagram DM / Messenger were rendering only title + description (no thumbnail) for `work.tecxmate.com`; iMessage showed no preview at all.
- Root cause: `src/app/opengraph-image.tsx` had `export const dynamic = "force-dynamic"` and fetched Google Fonts on every request. Meta's scraper has a ~5s budget — slow/flaky OG responses get dropped, leaving only the textual card. The wordmark output is identical every request, so dynamic regeneration was pure cost.
- Fix: removed `force-dynamic` so Next/Vercel statically generates and CDN-caches the OG PNG; also added explicit `openGraph.images` (with width/height/type) and `twitter.images` in `src/app/layout.tsx` so scrapers don't have to rely on auto-detection.
- Post-deploy: must re-scrape via Meta Sharing Debugger (developers.facebook.com/tools/debug/) — Meta caches failed previews aggressively (~24h).

## [2026-05-28] lesson | Messenger requires immutable cache-control on OG images
attributed_to: [niko]   belongs_to: [tecxwork, public-homepage, link-previews]
- After Instagram + Sharing Debugger were both rendering the wordmark thumbnail, Messenger still showed an empty preview — including when the URL was cache-busted with `?v=2`.
- Root cause: `next/og` defaults to `cache-control: public, max-age=0, must-revalidate`. Messenger's image proxy (`external.xx.fbcdn.net`) treats that as non-cacheable and silently skips fetching, so the chat shows an empty preview card. Instagram + desktop FB scrapers are more permissive.
- Fix in `src/app/opengraph-image.tsx`: passed `headers: { "cache-control": "public, max-age=31536000, immutable" }` to `ImageResponse`. Safe because Next appends a content hash to the OG image URL (`?<hash>`), so any design change busts the URL.
- Created `topics/link-previews.md` capturing the full OG metadata setup, the four-step debug recipe, and the per-surface cache quirks (Instagram / Sharing Debugger / Messenger / iMessage all have independent caches).

## [2026-05-28] decide | SEO foundation for tecxwork brand discovery
attributed_to: [niko]   belongs_to: [tecxwork, public-homepage]
- Google was auto-correcting "tecxwork" → "texwork" because (a) the indexed domain is work.tecxmate.com (no brand match), (b) the title was just the event name, (c) no JSON-LD/sitemap/robots existed, (d) no multilingual keyword surface.
- Added `src/app/robots.ts`, `src/app/sitemap.ts` (static routes + approved jobs), enriched `layout.tsx` metadata (multilingual title/description with 越南招募・越南工程師・越南工人・台灣工作 + vi keywords, hreflang alternates, keywords array, robots directives), injected JSON-LD Organization + WebSite graph with `parentOrganization` pointing to tecxmate, made `<html lang>` follow `studentLocale`.
- Updated `public/manifest.json` description to multilingual.
- Created topics/seo.md with the playbook (off-page brand signals still required to kill the autocorrect).

## [2026-05-28] finding | Recruiter visibility into student data depends on event mode
attributed_to: [claude, niko]   belongs_to: [tecxwork, recruitment-workflows, data-privacy]
- **Per-booking row** (`src/app/dashboard/recruiter-data.ts:39-65`): every recruiter always sees `applicantName`, `applicantEmail`, `cvLink`, `position`, status, and times for bookings sent to them. This is the minimum a recruiter ever sees.
- **Applicant directory** (`/dashboard/applicants`, `/applicant/[id]`, backed by `GET /api/applicants` — `src/app/api/applicants/route.ts:37-58`): when event mode is `recruiter_books_applicant` or `both`, recruiters can search ALL registered students and see the full profile — phone, nationality, school, major, study level/year, expected graduation, skills, preferred locations/industries, work experiences, work authorization, cv link, linkedin url, portfolio url, description. Access is NOT gated to "students who applied to this recruiter."
- When mode is `applicant_books_recruiter` only, the directory is hidden and recruiters see only the booking-row fields above.
- **Future work (Both mode):** for V-GEN TRIDENT 2026 the event is expected to run in `both` mode, which currently exposes the entire student directory to every recruiter. We may need a tighter policy — e.g., recruiters can search the directory only for students who have already applied to them, or the directory shows reduced fields (name/major/skills) until the student opts in. Decide before the event goes live. Helpers to reuse if tightening: existing recruiter session check in `GET /api/applicants`; relation via `bookings.recruiterId` ↔ `bookings.applicantId`.

## [2026-05-28] ingest | JobPosting JSON-LD on /jobs/[id]
attributed_to: [niko]   belongs_to: [tecxwork, seo]
- Added `JobPosting` structured data per job for Google Jobs eligibility: title, HTML description (desc + responsibilities + requirements + benefits), datePosted from createdAt, validThrough from applicationDeadline, hiringOrganization with logo, jobLocation (country=TW) or jobLocationType=TELECOMMUTE, mapped employmentType + salary unitText, identifier, inLanguage.
- Page metadata also enriched (title includes "tecxwork (Vietnamese Jobs in Taiwan)", canonical, OG).
- Captured quality gates Google enforces silently (short description, missing location, expired validThrough) in topics/seo.md so recruiter onboarding pushes complete data.

## [2026-05-28] feature | Admin can edit recruiter profile + logo on their behalf
attributed_to: [niko]   belongs_to: [tecxwork, admin-panel, recruitment-workflows]
- Admins can now edit a recruiter's company profile from the admin Recruiters tab: company, industry, contact email, website, description, and logo (upload via existing `/api/upload` type=logo). Pencil icon next to the delete button opens an edit modal.
- Backend: new `PATCH /api/admin/recruiters?id=<id>` (admin-session gated). Deliberately EXCLUDES `interviewerCount` — that field triggers slot regeneration in the recruiter's own `/api/me/recruiter` editor, so admin-side editing stays free of booking/slot side-effects. No migration (writes existing `recruiters` columns).
- Data: `getAdminDashboardData` recruiter query + the `Recruiter` type now also load `description`, `websiteUrl`, `logoUrl`, `galleryUrls`.
- Conflict posture: admin and recruiter write the same `recruiters` row; last-write-wins is acceptable for low-frequency logo/detail edits. v1 ships with NO recruiter notification (admin is assisting). Both decisions per niko.
- Not browser-tested yet (typecheck + lint clean only). Verify the modal + logo upload in the running app before relying on it.

## [2026-05-29] feature | Sponsor-priority sort in company directory
attributed_to: [niko]   belongs_to: [tecxwork, public-homepage]
- `/browse` company list now pins sponsors to the top in a fixed order: IVB → Gtalent → Mdor → Tripod → Chinli → SSB Shoes → Việt Hoa → Yongzhan. After sponsors, the prior rule applies: sort by number of approved jobs (desc), then company name.
- Why: niko's directive — these eight are event sponsors and must lead the directory regardless of how many jobs they post.
- Stack: `src/lib/cache.ts` `fetchRecruiters()` gained `SPONSOR_PRIORITY` (ordered keyword list) + `normalizeCompany()` (NFD diacritic strip, đ→d, lowercase, alnum-only) + `sponsorRank()`. Matching is substring-on-normalized-name so full legal names resolve (e.g. "Indovina Bank (IVB)" → rank 0, "Việt Hoa Co., Ltd" → rank 6). Non-sponsors get `Infinity`. Cache key bumped v4 → v5 to flush the prior order.
- Caveat: matching is keyword-contains. If a future non-sponsor company name happens to contain one of these tokens (e.g. "ssb", "ivb"), it would be wrongly promoted. Tokens chosen to be distinctive; revisit if a collision appears.

## [2026-05-29] ingest | Align job-card footers across grid row
attributed_to: [niko]   belongs_to: [public-homepage, recruiter-dashboard]
- Job cards in the homepage/jobs grid had footers ("View details"/"No JD link") floating at different heights because content length varies per card.
- Fix in `recruiter-job-posting-card.tsx`: Card is now `flex h-full flex-col` (fills grid cell; CSS-grid row stretch equalizes heights) and the footer row got `mt-auto pt-2` to pin to the bottom. Footers now align across the row.
- Tradeoff noted: short cards show whitespace above the pinned footer; optional follow-up is capping compact-mode body to one section.

## [2026-05-29] decide | LinkedIn-style two-pane /jobs on desktop
attributed_to: [niko]   belongs_to: [public-homepage, recruitment-workflows]
- Desktop /jobs now uses a split layout: compact job list on the left (logo + title + company + location + tags), selected job's full detail + apply flow on the right. Mobile keeps tap-to-navigate to /jobs/[id].
- Implemented in `recruiter-jobs-browser.tsx`: replaced the 3-col teaser grid with `lg:grid-cols-[minmax(320px,380px)_1fr]`; new `JobListRow` (button) + reused `JobDetailApply` in a sticky right pane keyed by job id so apply/booking state resets per selection.
- `useIsDesktop` (matchMedia 1024px) decides select-in-pane vs router.push; desktop auto-selects first visible job and re-selects when pagination/filters change. `jobs-list-page.tsx` now passes `messages` + `isApplicant` down.
- Niko's directive: "don't have to do 100% like LinkedIn, just go in that direction, job name on the left and details on the right; migrate gracefully."

## [2026-05-29] feature | Admin-controlled company pinning replaces sponsor keyword sort
attributed_to: [niko]   belongs_to: [tecxwork, public-homepage, admin-panel]
- Replaced the hardcoded `SPONSOR_PRIORITY` keyword sort (added earlier same week) with admin-managed pinning. Admins now pin/unpin and reorder the top companies in the Browse directory via the admin Recruiters section; no code change needed when sponsors change.
- Why: niko wanted operators — not the codebase — to control which companies lead `/browse`. Keyword matching was brittle (substring collisions, name-variant drift).
- Stack:
  - Schema: `recruiters.pinned_rank integer NULL` (NULL = unpinned). Migration `src/lib/db/add-recruiter-pinned-rank-column.ts` + `db:update:recruiter-pinned-rank` script; applied to the live DB (host `ep-lingering-sun`, 34 recruiters).
  - Sort: `src/lib/cache.ts` `fetchRecruiters()` now orders pinned first by `pinnedRank` asc, then unpinned by approved-job count desc + alpha. Cache key bumped v5 → v6. Added `invalidateRecruitersCache()` (`cache.expireTag("recruiters")`) so pin edits show immediately rather than waiting out the 5-min TTL.
  - API: `PUT /api/admin/recruiters/pin` takes `{ order: number[] }` (full ordered list of pinned ids), rewrites all ranks in one transaction (dense 0-based via SQL CASE), unpins everything not in the list, then invalidates cache. Admin-only.
  - UI: admin Recruiters section gained a "Featured companies" card — ordered list with ↑/↓/unpin per row + a "Pin a company" dropdown. Optimistically updates parent state via `onRecruiterUpdated`.
- IMPORTANT: the `pinned_rank` migration must also be run against the Vercel **production** DATABASE_URL before deploy if prod uses a different Neon DB than the dev `.env.local`. (The app reads `process.env.DATABASE_URL`; the local `DATABASE_URL_UNPOOLED` points at a different/empty endpoint — don't be fooled by it.)

## [2026-05-29] ingest | Move /jobs search+filters into the left pane
attributed_to: [niko]   belongs_to: [public-homepage]
- Per Niko, the full-width search/filter bar now lives inside the left column of the two-pane /jobs layout (above the job list), so it spans only the list width instead of the whole page. The grid wrapper now encloses the entire section; right detail pane unchanged.

## [2026-05-29] decide | Photo-background page header with adaptive text (PageHero)
attributed_to: [niko]   belongs_to: [public-homepage, design-system]
- Replaced the plain title section + separate PageImageCarousel strip on /browse and /jobs with `PageHero`: page photo as full background, title/subtitle overlaid, semi-transparent scrim between, and text color that adapts light/dark to the photo's luminance for readability.
- Luminance sampled via 32×32 canvas over the central band; CORS works on the blob host so detection is live, with SSR/fallback defaulting to light-text + dark-scrim (always readable). Crossfade carousel replaces horizontal scroll since text is now fixed on top.
- Deleted orphaned `page-image-carousel.tsx`. Created topics/page-hero.md.

## [2026-05-29] tweak | Jobs browser: sticky search/filters on desktop, drop funnel icon
attributed_to: [niko]   belongs_to: [tecxwork, public-homepage]
- `recruiter-jobs-browser.tsx`: wrapped search + filter selects + "N jobs found" count in a `lg:sticky lg:top-16` container (with `lg:bg-background` so the list scrolls under it cleanly) so filters stay reachable while scrolling the job list on desktop. Removed the decorative `Filter` funnel icon (and its now-unused import). Mobile unchanged (non-sticky).

## [2026-05-29] idea | Redesign Browse "Participating Companies" header as photo hero — IMPLEMENTED, see [[page-hero]]
attributed_to: [niko]   belongs_to: [tecxwork, public-homepage]
- SUPERSEDED: this was implemented in a parallel session as the `PageHero` component (`src/components/page-hero.tsx`, now on `/browse` and `/jobs`). Full design + adaptive-luminance details live in `topics/page-hero.md`. The notes below are the original (now historical) request; trust the topic page for current behavior.
- niko requested (then interrupted to switch tasks): on `/browse`, merge the "Participating Companies" title block with the banner photo below it into a single hero — background image with the title/subtitle overlaid on a front layer.
- Requirements stated: (1) text color should adapt light/dark based on the photo so it stays readable; (2) add a semitransparent layer between photo and text to make text stand out.
- Current state: `src/app/browse/page.tsx` renders the title in a separate `<section className="border-b bg-card …">` (lines ~49-58), with the photo carousel `<PageImageCarousel images={pageImages} />` as a distinct block below it. Photos come from `getPageImages("browse")`.
- Implementation notes for whoever picks this up:
  - Per-photo light/dark text is the hard part. Auto-detecting luminance client-side via canvas hits CORS on blob-hosted images; cleanest robust route is a fixed dark gradient overlay + white text (guarantees contrast regardless of photo) rather than true per-image adaptation. If true adaptation is required, compute average luminance server-side at upload time and store a `textOnImage: "light"|"dark"` flag, or sample a downscaled version.
  - The carousel rotates multiple images, so any per-image text color must update per slide.

## [2026-05-29] ingest | PageHero threshold-tuning note
attributed_to: [niko]   belongs_to: [page-hero]
- Recorded the open item for PageHero: dark↔light text uses a single `luma > 0.6` cutoff; if a real photo wrong-foots the color, nudge the cutoff / widen the sampled band / add a per-image override. Not built yet.

## [2026-05-29] tweak | Polish jobs-browser sticky filter section
attributed_to: [niko]   belongs_to: [tecxwork, public-homepage, design-system]
- Fixed the seam where the scrolling job list peeked through above the stuck filter bar: lowered the sticky offset to `lg:top-14` (tucks under the ~60px top bar) and dropped its z to `lg:z-[9]` (below the header's z-10) so the header covers the overlap. Bg bleeds ±4px (`lg:-mx-1`/`lg:px-1`) to kill edge slivers.
- Added a frosted "stuck" treatment: `lg:bg-background/85 lg:backdrop-blur` + `lg:border-b` + `lg:shadow-sm`.
- Filters reworked from ragged `flex-wrap` into an even `grid grid-cols-2 gap-2`; selects unified via `FILTER_SELECT_CLASS` (h-9, rounded-lg, shadow-sm, hover border). Result count + "Clear filters" now share one row (count left, clear right).
- Desktop-only; mobile keeps the plain non-sticky block.

## [2026-05-29] tweak | Jobs browser: search+filters as one full-width sticky line over both panes
attributed_to: [niko]   belongs_to: [tecxwork, public-homepage]
- Moved the search box + filter selects out of the left list column into a single full-width bar above the two-pane grid (list | detail). On desktop it's one row (`lg:flex`): search `flex-[1.4]`, the filter group `flex-[2]` with each select `lg:flex-1`. Sticky `lg:top-14 lg:z-[9]` with the frosted backdrop/border/shadow.
- The result count + "Clear filters" moved down into the left list column (above the list), so the sticky line stays a clean single row.
- Detail pane sticky offset bumped `lg:top-24` → `lg:top-[124px]` so it tucks below the now full-width sticky search bar (no overlap); its max-height adjusted to `calc(100vh-9rem)`.
- Mobile unchanged behaviorally: bar is a non-sticky block (search full width, selects in a 2-col grid).

## [2026-05-29] fix | Long job locations overflowed the browser list column
attributed_to: [niko]   belongs_to: [tecxwork, public-homepage]
- `JobListRow` location line truncated its `<span>` but the flex parent `<p>` lacked `min-w-0`, so with min-width:auto the span couldn't shrink and long locations (e.g. full Vietnamese industrial-park addresses) spilled past the 380px list column into the detail pane. Added `min-w-0` to both the `<p>` and the `<span>`. Classic flex truncation gotcha.

## [2026-05-29] tweak | Admin "Settings" → "Platform", promoted to 5th nav item
attributed_to: [niko]   belongs_to: [tecxwork, admin-panel]
- Renamed the admin Settings entry to "Platform" and moved it from the top-bar overflow menu / gear icon into the main nav as the 5th item (`/admin/settings`), on both desktop top nav and mobile bottom nav.
- Stack: added the item to `navItemsByRole.admin` in `src/lib/navigation.ts` (icon `SlidersHorizontal`); added `nav.platform` to en/vi/zh-TW student messages ("Platform" / "Nền tảng" / "平台") and mapped `/admin/settings → messages.nav.platform` in both `desktop-top-nav.tsx` and `mobile-bottom-nav.tsx`. Removed the standalone Settings gear from `app-topbar.tsx` and the "Settings" row from `app-topbar-account-actions.tsx` (mobile dropdown). Active-tab highlighting already worked since `admin-dashboard` maps `section==="settings"` → `/admin/settings` for `currentPath`.
- Mobile bottom nav handles 5 items automatically (grid `repeat(items.length)`, with icon-only fallback when labels don't fit).

## [2026-05-29] tweak | Admin save status moved into the top bar (left of hamburger)
attributed_to: [niko]   belongs_to: [tecxwork, admin-panel]
- The Platform/settings save-status banner ("All changes saved" / "Saving…" / error) moved from a sticky in-content box into a compact pill in the top bar, rendered persistently to the left of the hamburger menu.
- Stack: added a `rightStatus?: ReactNode` slot to `AppTopBar` (rendered just before `AppTopBarActions` in the right cluster). `admin-dashboard.tsx` passes a compact color-coded pill (Loader2 / dot / CheckCircle2 + `settingsStatusLabel`) as `rightStatus` only when `section === "settings"`; the label hides below `sm` (icon-only on mobile), full detail in `title`. Removed the old in-content `sticky top-3` banner.
- Note: the admin top bar always uses the hamburger (`mobileOverflow=true` in app-topbar) on desktop and mobile, so "left of the hamburger" = the new pill's slot. Status only shows on the Platform section (state is global to AdminDashboard but only meaningful there).

## [2026-05-29] feature | Event Branding unified into global autosave (orange/green dirty state)
attributed_to: [niko]   belongs_to: [tecxwork, admin-panel]
- Event Branding lost its dedicated "Save branding" button. Editing any of its ~13 fields now marks the section dirty (top-bar pill shows orange "Unsaved changes"), and a debounced effect autosaves ~1s after the last keystroke → green "Changes saved". Also flushes on blur to protect against navigating away before the debounce fires.
- Decision (niko, chose "Debounced autosave + orange/green"): branding is free text, so it can't naively autosave per-keystroke like the toggle settings; debounce + dirty-state is the unifying pattern. Added a 4th pill state — orange `#FF9F0A` "Unsaved changes" — above the existing Saving/Saved/Error.
- Stack (`admin-dashboard.tsx`): renamed the `branding` useState setter to `setBrandingState` and wrapped it in `setBranding(next)` that also flips `brandingDirty` + bumps a `brandingVersion` ref. `saveBranding` (useCallback) PUTs `/api/admin/branding`, guarded by an in-flight ref; on success it clears dirty ONLY if `brandingVersion` is unchanged (so edits landing mid-save aren't silently dropped). Debounce `useEffect` only schedules a timer (no sync setState → avoids the repo's `react-hooks/set-state-in-effect` error). Pill `hasUnsavedChanges = brandingDirty`.
- Note: only branding feeds the orange state; the discrete toggle/select settings still autosave instantly and never show "Unsaved changes".
