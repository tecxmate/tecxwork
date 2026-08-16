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

## [2026-06-25] fix | Notification bell text wrapping
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Niko shared a screenshot of application notification body text clipped in the bell popover.
- Root cause: topbar `whitespace-nowrap` inheritance reached the dropdown panel; the panel now resets whitespace and wraps notification title/body text within bounded flex columns.
- Updated topics/recruitment-workflows.md.
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

## [2026-05-29] feature | Admin Platform settings → split-panel (left nav + right content)
attributed_to: [niko]   belongs_to: [tecxwork, admin-panel]
- The Platform/settings page changed from a long vertical stack of sections into a split panel: a left section-nav (General, Event Branding, Feedback & bugs, Interview Time Frame, Tools & Media) and the selected section's content on the right.
- Stack (`admin-dashboard.tsx`): added `SettingsPanelId` + module-level `SETTINGS_PANELS` (id/label/icon) and `activePanel` state (default "general"). Wrapped each existing section block in `{activePanel === id && ( … )}`; left `<nav>` is `lg:sticky lg:top-20`, vertical on desktop and a horizontal scroll row on mobile. Feedback still lazy-loads — the nav button fires the `/api/admin/feedback` fetch on first select. The four sub-sections kept their existing collapsible headers (now default-open: `brandingOpen`/`feedbackOpen`/`timeFrameOpen`/`toolsOpen` flipped to `useState(true)`) so content shows immediately when a panel is chosen; the chevron still lets them collapse in-panel.
- General panel's inner grid changed from `lg:grid-cols-2` (one card + empty column) to single-column so the Platform Settings card fills the content pane.
- Gotcha hit: a JSX comment placed directly inside `{cond && ( … )}` (before the first element) is a syntax error — had to delete the section comment lines that landed between `(` and the block's `<div>`.

## [2026-05-29] tweak | Platform split-panel: strip in-pane headers, sticky mobile tabs
attributed_to: [niko]   belongs_to: [tecxwork, admin-panel]
- Removed the redundant in-pane collapsible headers (icon + title + chevron) from the four settings sub-sections (branding/feedback/timeframe/tools) — the left nav is now the only section label. The collapse machinery is gone: deleted the `brandingOpen`/`feedbackOpen`/`timeFrameOpen`/`toolsOpen` state; each block's content always renders inside its `{activePanel === id && (…)}` gate. Feedback still lazy-loads via the nav button's fetch.
- Mobile: the section nav is now a sticky horizontal tab strip — `sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-30` with a bottom border + `bg-background/90 backdrop-blur`, full-bleed via `-mx-4 sm:-mx-6`. Desktop keeps the sticky vertical sidebar (`lg:top-20`, chrome reset via `lg:` overrides).

## [2026-05-29] feature | Admin Platform: dedicated Overview tab with stat bars
attributed_to: [niko]   belongs_to: [tecxwork, admin-panel]
- Moved the stat cards (Recruiters / Students / Slots / Booking Requests / Emails) out of the always-on header strip into a dedicated "Overview" panel — now the first tab in the Platform split-panel left nav, and the default `activePanel`.
- Added lightweight CSS visualizations (no charting lib, all point-in-time since there's no time-series data): `StatBar` helper renders labeled progress bars for Slot utilization (booked/total), Email quota today (color-toned by % used), and Active interviews (active/total bookings), plus a two-segment "Participant mix" bar (recruiters vs students, with a students-per-recruiter ratio).
- Stack (`admin-dashboard.tsx`): added `"overview"` to `SettingsPanelId`/`SETTINGS_PANELS` (icon `BarChart3`), module-level `StatBar` component, and the panel JSX. Data all came from existing `stats`/`bookedSlots`/`emailStats` — no new fetches.

## [2026-05-29] feature | Admin Overview time-series charts (Recharts)
attributed_to: [niko]   belongs_to: [tecxwork, admin-panel]
- The Overview tab now shows four time-series charts under the stat bars: cumulative registrations (students vs recruiters, area), booking requests/day (stacked accepted/in-progress/declined), emails sent/day (sent vs failed), and cumulative jobs posted.
- Data: confirmed real history exists (students 93 over ~19 days from Apr 13; bookings, emails via `email_logs`, recruiters, jobs all timestamped). New `getAnalytics()` in `admin-data.ts` runs 5 grouped queries aggregated in Asia/Taipei, gap-fills a date spine (min→today), and computes running totals. Returned as a new `analytics` prop (`AdminAnalytics` type).
- **TZ gotcha (important):** casting `created_at::date` returns a JS Date whose `toISOString()` slices to the WRONG day (Taipei midnight = prior-day UTC). Fixed by selecting the day as TEXT via `to_char((created_at AT TIME ZONE 'Asia/Taipei')::date,'YYYY-MM-DD')` — stable across server TZ.
- UI: `src/components/overview-charts.tsx` (Recharts v3), dynamically imported with `ssr:false` in `admin-dashboard.tsx` so it stays out of the public bundle and avoids SSR/hydration issues. Booking buckets: accepted / in-progress (pending+waitlisted+reschedule_proposed) / declined (rejected+cancelled).
- Added `recharts` dependency (admin-only, lazy-loaded). Build passes.

## [2026-05-29] fix | Analytics query crashed all admin pages (drizzle sql reuse)
attributed_to: [niko]   belongs_to: [tecxwork, admin-panel]
- The `getAnalytics()` added for the Overview charts crashed the admin server render (generic "Server Components render" error on every admin page, since `getAdminDashboardData` runs for all sections). Cause: reusing a raw `sql()` day-expression in both `.select({d: day})` and `.groupBy(day)` of a drizzle query builder trips an internal alias path.
- Fix: rewrote the 5 aggregations as raw `db.execute(sql\`SELECT to_char((created_at AT TIME ZONE 'Asia/Taipei')::date,'YYYY-MM-DD') AS d, COUNT(*)::int AS n FROM <table> GROUP BY 1[, status|success]\`)` and read `.rows`. Verified against the live DB via the app's own `db.execute`. No more query-builder column/alias machinery.
- Lesson: for grouped aggregations with a computed day key, prefer raw `db.execute` over `.select()/.groupBy()` with a shared `sql()` chunk.

## [2026-05-29] ops | Local disaster-recovery backup script (Neon + Vercel Blob)
attributed_to: [niko]   belongs_to: [tecxwork, data-privacy]
- `scripts/backup.mjs` mirrors the Neon Postgres DB and all Vercel Blob objects to the personal PC for off-platform DR. `pnpm backup` runs it once. Per run: `pg_dump` → `~/tecxwork-backups/db/tecxwork_<ts>.sql.gz` (keeps newest 48, `DB_RETENTION` env-tunable), and an incremental Blob mirror → `~/tecxwork-backups/blob/<pathname>` (skips files already present with the same size). Backup dir overridable via `BACKUP_DIR`.
- Reads creds from `.env.local`. The script derives the **direct (unpooled)** host by stripping `-pooler` from the canonical `DATABASE_URL` (pg_dump can't run through Neon's pooler). `BACKUP_DATABASE_URL` overrides explicitly. `pg_dump` auto-detected at `/opt/homebrew/opt/libpq/bin/pg_dump` (v18.2 — forward-compatible with Neon's PG; no `brew install` needed despite it being absent from PATH).
- Hourly scheduling via `scripts/com.tecxwork.backup.plist` (launchd, `StartInterval 3600`, `RunAtLoad`). Not yet installed — load it deliberately with `launchctl load ~/Library/LaunchAgents/...`.
- **Why:** niko wants a guaranteed local copy of all data in case anything happens to the hosted services.
- **Verified run:** real DB dump captures production data (128 users, 34 recruiters, 93 applicants, 88 bookings, 107 jobs, 405 slots, 503 external_jobs, ...), 0.28 MB gzipped; Blob mirror = 155 objects / 106 MB with incremental skip confirmed.
- ⚠️ **Stale env var found:** `.env.local`'s `DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING` point at a DIFFERENT, empty Neon endpoint (`ep-bitter-hill-a44dek8n`) than the live `DATABASE_URL` (`ep-lingering-sun-an5htstv`). The first backup test mirrored that empty DB. The script now ignores the UNPOOLED vars and derives from `DATABASE_URL`, but niko should fix/remove the stale `*_UNPOOLED` / `*_NON_POOLING` vars in `.env.local` (and Vercel) so other tooling doesn't silently hit the wrong database.

## [2026-05-29] tweak | Removed redundant stat cards from Overview
attributed_to: [niko]   belongs_to: [tecxwork, admin-panel]
- Dropped the row of stat cards (Recruiters/Students/Slots/Booking Requests/Emails) from the Overview panel — the same numbers are now conveyed by the StatBars (slot utilization, email quota, active interviews, participant mix) and the time-series charts. Also removed the now-unused `statsCards` array.

## [2026-05-29] doc | Backup/DR topic page with multi-PC setup guide
attributed_to: [niko]   belongs_to: [tecxwork, backup-dr]
- Created `topics/backup-dr.md` documenting the local backup system (Neon `pg_dump` + Vercel Blob mirror), the direct-vs-pooler connection detail, the verified run, launchd scheduling, a step-by-step **second-machine setup guide** (clone → libpq → .env.local with DATABASE_URL+BLOB_READ_WRITE_TOKEN → test → customize+load plist; cron/Task Scheduler for non-mac), and restore commands. Indexed in `index.md`.

## [2026-05-29] decide | Per-company slot capacity chart in admin Overview
attributed_to: [niko]   belongs_to: [admin-panel, recruitment-workflows]
- Added a capacity graph to the admin Overview: horizontal stacked bar per company showing Booked (green) + Available (light) = total interview slots, sorted by capacity desc, with an overall "X/Y booked (Z%)" fill-rate header.
- Data added to `AdminAnalytics.capacity` in `admin-data.ts` via `LEFT JOIN slots ... COUNT(*) FILTER (WHERE status='booked') ... HAVING COUNT(s.id) > 0`. "Booked" is measured by slots.status='booked' (not accepted-bookings count). Companies with zero slots are omitted.
- Rendered in `overview-charts.tsx` (`CapacityChart`), full width below the 2-col grid; scrollable (max-h-480) with ~30px/company so 30+ companies fit. Validated query against live DB.

## [2026-05-29] decide | Capacity chart now shows supply vs demand per company
attributed_to: [niko]   belongs_to: [admin-panel, recruitment-workflows]
- Extended the admin Overview capacity chart to two bars per company: top = interview slots (Booked + Available = total capacity / supply); bottom = booking requests (Accepted + Unconfirmed + Rejected / demand). Added a caption noting the two axes don't sum.
- Rationale (Niko's question "how do we show that logically?"): slots and bookings are different units — many requests can target one slot; rejected/cancelled free slots — so they're shown as parallel bars rather than one stack. "Accepted" ≈ "Booked" serves as a consistency check.
- `AdminAnalytics.capacity` now also carries accepted/unconfirmed/rejected. Status buckets reuse existing convention: unconfirmed = pending+waitlisted+reschedule_proposed; rejected = rejected+cancelled. Query LEFT JOINs slot + booking subqueries per recruiter; validated live.

## [2026-05-29] ingest | Capacity analytics topic page
attributed_to: [niko]   belongs_to: [capacity-analytics]
- Created topics/capacity-analytics.md documenting the supply-vs-demand chart: why slots and requests are two parallel bars (different units, don't sum), the status buckets, the accepted≈booked consistency check, the LEFT-JOIN query, and rendering notes. Linked from index.

## [2026-05-29] ingest | Document how total slots is calculated
attributed_to: [niko]   belongs_to: [capacity-analytics]
- Added a "How total slots is calculated" section to topics/capacity-analytics.md: total = time windows × interviewerCount (per admin/timeframe regeneration), with the windows formula, an example, and the caveat that default onboarding (recruiter-onboarding.ts) seeds only 1 interviewer until regenerated.

## [2026-05-29] fix | Admin Jobs tab broke mobile viewport (horizontal overflow)
attributed_to: [niko]   belongs_to: [admin-panel]
- Job Moderation cards used `truncate` (white-space:nowrap) on company/location meta spans whose flex parents lacked `min-w-0`, so a long value couldn't shrink and forced the document ~2.7x wider than the mobile viewport. Confirmed cause: a job `location` value 177 chars long.
- Fix in admin-dashboard.tsx renderJobItem: company/location meta items get `min-w-0 max-w-full` (so truncate engages); the short non-truncating items (type/category/date) get `shrink-0`.

## [2026-05-29] tweak | Capacity chart: sticky custom legend replaces explainer
attributed_to: [niko]   belongs_to: [tecxwork, admin-panel]
- On the Overview "Slot capacity vs booking requests by company" chart, replaced the prose "Top bar = slots / Bottom bar = requests" note and the scrolling Recharts `<Legend>` with a custom legend pinned `sticky top-0` at the top of the chart's scroll area (grouped "Slots: Booked/Available · Requests: Accepted/Unconfirmed/Rejected"). It stays visible while scrolling the per-company rows.

## [2026-05-29] fix | Company pin endpoint 500 (un-inferrable SQL CASE)
attributed_to: [niko]   belongs_to: [tecxwork, admin-panel]
- `PUT /api/admin/recruiters/pin` returned 500 ("Failed query") when pinning a company. Cause: the rank update used `case "id" when $1 then $2 ... end` where every THEN branch was a bind parameter — Postgres can't infer the CASE result type from all-parameter branches.
- Fix: replaced the single CASE update with one typed `UPDATE ... SET pinned_rank = <index>` per id inside the transaction (pinned set is small). `pinnedRank: index` binds as a typed int against the int column, so no inference issue. Verified end-to-end against the live DB.

## [2026-05-29] tweak | Homepage company preview matches Companies-tab order
attributed_to: [niko]   belongs_to: [tecxwork, public-homepage]
- The homepage "Participating Companies" preview ran its own `orderBy(recruiters.company)` (alphabetical) query, so its order didn't match `/browse`. Switched `getPublicRecruiters()` in `src/app/page.tsx` to `(await getCachedRecruiters()).slice(0, 6)` — the same canonical source the Companies tab uses (pinned first, then approved-job count, then A→Z), so the preview's first 6 mirror the directory and benefit from the shared cache.

## [2026-05-29] tweak | Removed "I'm an admin" card from get-started
attributed_to: [niko]   belongs_to: [tecxwork, public-homepage]
- Dropped the admin role card from `/get-started` (it only ever said "contact admin" — no self-signup). The role grid is now 2 columns (Student, Recruiter), centered. Admin login is unaffected: `/login` is credential-based and still authenticates admins and redirects them to `/admin`. Left the message strings (`getStarted.adminTitle/adminDescription`) in place — harmless, unreferenced.

## [2026-05-29] tweak | Recruiter card: signup gated behind admin approval
attributed_to: [niko]   belongs_to: [tecxwork, public-homepage]
- On `/get-started`, the recruiter card's "Sign Up" link was replaced with the contact-admin message (`recruiter.signupHref` → null). Recruiters must be approved first (existing `recruiterEmailApprovals` flow); the public card no longer links straight to `/recruiter/signup`. Reworded `getStarted.contactAdmin` in en/vi/zh-TW to "Contact admin for approval to sign up" (the admin card that previously shared this string was removed earlier today). `/recruiter/signup` itself is unchanged for approved recruiters who have the link.

## [2026-05-30] fix | Recruiters can now set/edit job category; patched Tripod Tech PCB STARter
attributed_to: [niko]   belongs_to: [recruiter-dashboard, admin-panel]
- Bug: recruiter's edit-job form had no category field; categories were assigned only by `tag-existing-job-categories.ts` auto-classifier whose `business` regex matches "management trainee", which mislabeled Tripod Tech's PCB engineering trainee job as Business.
- Fix:
  1. Added `jobCategory` select to recruiter form (`recruiter-dashboard-company.tsx`); accepted+validated in `/api/me/jobs` POST and `/api/me/jobs/[id]` PUT against `JOB_CATEGORY_VALUES`. Added EN/zh-TW labels.
  2. Patched job id=94 ("2026 PCB STARter Management Trainee") in DB: business → tech_engineering.
- Follow-up worth considering: nudge the auto-classifier so `tech_engineering` matches "engineering" before `business` catches "management trainee", and stop defaulting unknown jobs to `business` (use empty / uncategorized instead).

## [2026-06-01] fix | Reschedule proposal notification/email lacked actionable deep link
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Student report: "New Time Proposed" notification was received, but could not be clicked; email opened the platform only, without taking the student to Accept/Decline.
- Root cause: reschedule proposal email linked to `/dashboard`, in-app notifications had no click action, and push notifications defaulted to `/`.
- Fix: proposal messages now carry `/recruiter/<id>?proposal=<bookingId>`; notification rows open metadata URLs; recruiter detail selects the proposed job from the query. Updated topics/recruitment-workflows.md.

## [2026-06-01] ingest | Ubuntu hourly local backup setup
attributed_to: [niko]   belongs_to: [backup-dr]
- Added Linux user-systemd units for the TECXWORK local backup on `/home/niko/repos/tecxwork`: hourly timer plus oneshot service writing to `/home/niko/tecxwork-backups`.
- Environment findings: Node v20.20.2 is present via nvm; `npm ci` is blocked by an out-of-sync lockfile; `postgresql-client`/`pg_dump` and `.env.local` are still required before live DB dumps can succeed.
- Updated topics/backup-dr.md with the Ubuntu systemd install path and logs.

## [2026-06-01] ingest | Taildrop env installed; Blob backup verified
attributed_to: [niko]   belongs_to: [backup-dr]
- Copied `/home/niko/taildrop/.env.local` into the repo as private `0600` `/home/niko/repos/tecxwork/.env.local`.
- Manual backup run verified Vercel Blob mirror: 177 objects downloaded to `/home/niko/tecxwork-backups/blob`.
- DB backup still needs PostgreSQL 17+ client tools: Ubuntu `pg_dump` 16.14 aborts against Neon server 17.10. Added a systemd `ExecCondition` so hourly runs skip instead of failing until compatible `pg_dump` is installed.

## [2026-06-01] ingest | PostgreSQL 17 client installed; backup verified
attributed_to: [niko]   belongs_to: [backup-dr]
- Added the official PGDG apt repository via `postgresql-common` and installed `postgresql-client-17`; `/usr/bin/pg_dump` now reports PostgreSQL 17.10.
- Manual systemd backup run completed successfully: DB dump `tecxwork_2026-05-31T23-36-30-523Z.sql.gz` (328,453 bytes) plus Blob mirror check (177 objects, 0 newly downloaded, 177 unchanged).
- Hourly `tecxwork-backup.timer` remains active; next run scheduled from the successful service activation.

## [2026-06-01] ingest | Booking reschedule audit logs
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Audited student/recruiter reschedule traces: recent `reschedule_proposed` email logs and notification rows exist, with 4 active proposal bookings, but there was no durable action log for propose/retract/accept/decline events.
- Added `booking_reschedule_logs`, a DB update script, and non-blocking route logging for proposal creation, applicant-busy blocks, retraction, student accept/decline, and accept conflicts.
- Created the live `booking_reschedule_logs` table on 2026-06-01; it starts empty because historical rows do not reliably preserve every action timestamp. Updated topics/recruitment-workflows.md.

## [2026-06-01] fix | Linux fresh install surfaced React hooks lint
attributed_to: [niko]   belongs_to: [tecxwork]
- Fresh Linux dev dependency install activated the current `react-hooks/set-state-in-effect` lint rule, failing on `src/components/recruiter-jobs-browser.tsx`.
- Replaced the desktop detail-pane state-repair effect with derived `visibleSelectedJobId`; full `npm run lint -- --quiet` and `npx tsc --noEmit` now pass. Updated topics/tecxwork.md.

## [2026-06-01] fix | Confirmation email raw UTC timestamp
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Student screenshot showed an accepted interview confirmation email displaying `2026-06-06 07:30:00+00`, which looked like 7:30 AM instead of the intended Asia/Taipei time.
- Root cause: raw SQL slot claims can return timestamp strings; email formatting called `.toLocaleString()` without coercing strings to `Date`, so strings rendered unchanged. Email and notification formatting now normalize `Date | string` times before display. Updated topics/recruitment-workflows.md.

## [2026-06-01] fix | Mobile proposal response feedback
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Student screenshot showed tapping Accept on a mobile reschedule proposal appeared to do nothing; live DB still had the SSB booking in `reschedule_proposed` and the new audit log had no response row.
- Code audit found mobile proposal errors were invisible because `respondError` only rendered in the desktop panel. Added mobile/desktop success and error notices, network-error handling, and `finally` cleanup for the loading state. Updated topics/recruitment-workflows.md.

## [2026-06-01] fix | Stable job application matching
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Student report: after recruiter edits, the applicant side could look like no application existed, or show only generic "Applied" for waitlisted/pending/confirmed cases.
- Root cause: booking state was matched to jobs by editable title text (`bookings.position === job.title`). Added `bookings.job_opening_id`, stable id matching in UI/API, duplicate blocking for waitlisted/reschedule-proposed applications, and explicit Pending review / Waitlisted / Interview confirmed labels.
- Ran the live backfill: 124/145 bookings linked, including all 7 SSB bookings to job opening 47. Updated topics/recruitment-workflows.md.

## [2026-06-01] fix | Block impossible reschedule proposals
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Student screenshot showed Accept failing because SSB proposed 14:45, but recruiter 21 had no slot at 14:45; next available slots were 14:50.
- The propose-time route now requires an available recruiter slot at the exact proposed time before notifying the student, logs `proposal_blocked_no_slot`, and recruiter UI only offers "Suggest anyway" for applicant-busy conflicts, not slot-unavailable conflicts. Updated topics/recruitment-workflows.md.

## [2026-06-01] fix | Manually corrected SSB proposal to 14:50
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Manually updated booking 58 (`PHAN MINH ANH`, SSB Industrial Co.) from impossible proposed time 14:45 to available slot time 14:50 Asia/Taipei.
- Booking remains `reschedule_proposed`; student still needs to press Accept. Audit row inserted with `action = manual_corrected_proposed_time`, previous proposed time, and available slot ids 2409/2410. Updated topics/recruitment-workflows.md.

## [2026-06-01] fix | Admin booking time override controls
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Added admin-side booking time control for the cases that previously required manual SQL: admins can save a corrected proposal, confirm and claim an available slot, or edit a pending requested time.
- The override endpoint requires exact available recruiter slots for proposal/confirm actions and records admin proposal/confirm/request updates plus blocked/failed attempts in `booking_reschedule_logs`. Updated topics/recruitment-workflows.md.

## [2026-06-01] fix | Student accepted proposal showed stale old time
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Student screenshot after accepting the corrected SSB proposal showed success but still rendered the old 14:30 time on the job card.
- Root cause was local UI state: the accept API returned only status, so the student page changed `status` to accepted without replacing `requestedTime`. The API now returns the accepted time and the UI updates it immediately. Updated topics/recruitment-workflows.md.

## [2026-06-01] feature | Student application summary on profile
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Added a `/profile` application ledger showing companies/jobs the student applied to, status, and interview/proposed time.
- Extended `/api/bookings/mine` to return all of the current student's bookings when no `recruiterId` is supplied, including recruiter company names and normalized booking times. Updated topics/recruitment-workflows.md.

## [2026-06-01] feature | Student can cancel applications from profile
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Added Cancel controls to active rows in the student `/profile` application ledger with separate confirmation wording for confirmed interviews.
- Student cancellations now write booking audit logs and notify recruiters by email plus in-app/push notification while preserving existing slot release and waitlist promotion behavior. Updated topics/recruitment-workflows.md.

## [2026-06-01] feature | Student cancellation admin toggle
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Added default-off `event_config.student_cancellation_enabled` with admin Settings toggle, profile UI gating, and DELETE-route enforcement.
- Ran the live migration on 2026-06-01; students cannot cancel by UI or direct API unless admin enables the toggle. Updated topics/recruitment-workflows.md.

## [2026-06-01] ingest | Animated icon GIF asset
attributed_to: [niko]   belongs_to: [design-system]
- Converted `public/icon-animated.svg` into `public/icon-animated.gif` for GIF-only surfaces by sampling the CSS animation into 77 frames at 100ms delay.
- Updated topics/design-system.md.

## [2026-06-01] fix | Neon pool crash hardening
attributed_to: [niko]   belongs_to: [tecxwork]
- Prod instances crashed on unhandled WebSocket 'error' events from the Neon pool, amid "Too many database connection attempts" / control-plane failures / 300s timeouts.
- Added pool.on('error') handler (stops the uncaught-exception crash) and neonConfig.poolQueryViaFetch = true (non-transaction queries via HTTP, cutting WebSocket churn). Transactions still use the WS pool.
- created decisions/2026-06-01-neon-pool-crash-hardening.md

## [2026-06-01] incident | poolQueryViaFetch caused prod outage; reverted
attributed_to: [niko]   belongs_to: [tecxwork]
- Pushing the neon-pool fix with neonConfig.poolQueryViaFetch=true triggered TWO prod builds (repo main is wired to both Vercel projects `app` and `tecxwork`). Each build's ~83 prerender queries became HTTP connection bursts that overwhelmed the free-tier Neon DB -> "Too many database connection attempts" -> work.tecxmate.com down (~19:13).
- Recovered by cancelling both in-flight builds (DB drained to ~15 conns, site back to 200s in ~1s). Reverted poolQueryViaFetch; kept only pool.on('error').
- Surfaced: `app` is the live project (work.tecxmate.com, tecxwork.vercel.app, v-gen.vercel.app, 515k req); `tecxwork` is redundant (only tecxwork-six.vercel.app) but still auto-builds main -> doubles build-time DB load. Candidate for deletion/disconnect.

## [2026-06-01] fix | Jobs split-view location overflow
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Fixed desktop `/jobs` split view card sizing so long locations truncate inside the left job card instead of overflowing into the detail pane.
- Moved the selected job detail apply/login CTA from the lower-right footer to the top-right header area. Updated topics/recruitment-workflows.md.

## [2026-06-01] feature | Jobs page banner toggle
attributed_to: [niko]   belongs_to: [page-hero]
- Added `event_config.jobs_page_hero_enabled` defaulting true, with an admin Platform → Tools & Media switch to show/hide the `/jobs` recruiter-posted jobs banner without deleting uploaded images.
- Ran the additive live migration on 2026-06-01. Updated topics/page-hero.md.

## [2026-06-01] change | Jobs page banner defaults off
attributed_to: [niko]   belongs_to: [page-hero]
- Changed `event_config.jobs_page_hero_enabled` to default false and updated fallbacks so `/jobs` hides the recruiter-posted jobs banner unless admins explicitly enable it.
- Updated the live DB default and current row to false on 2026-06-01. Updated topics/page-hero.md.

## [2026-06-01] fix | Deployed jobs address clipping
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Deployment still showed long `/jobs` list-card addresses painting into the desktop detail pane despite the first truncation pass.
- Forced the list-card text column to `w-0 flex-1` and added overflow clipping to the card/header/list ancestors so address text cannot escape the left pane. Updated topics/recruitment-workflows.md.

## [2026-06-01] ops | Vercel and Neon region audit
attributed_to: [niko]   belongs_to: [architecture-overview]
- Latest production Vercel deployment inspection shows Node functions in `iad1` (Washington, D.C.); repo has no explicit `regions` setting in `vercel.json`.
- Local `DATABASE_URL` host points at Neon `us-east-1.aws.neon.tech`; Tokyo target would be Vercel `hnd1` plus a Neon Tokyo/AWS ap-northeast-1 project/branch. Updated topics/architecture-overview.md.

## [2026-06-01] fix | Smooth list loading animations
attributed_to: [niko]   belongs_to: [design-system]
- Added `useSmoothLoading` to delay loader display briefly and keep it visible for a minimum duration, preventing company/list loaders from flickering with fast or interrupted data fetches.
- Replaced default skeleton pulse with a slower shared breathe animation and used a consistent smooth spinner class for list loaders. Updated topics/design-system.md.

## [2026-06-01] decision | Move Vercel + Neon to Tokyo
attributed_to: [niko]   belongs_to: [tecxwork]
- Users are in Taiwan (all 171 schools Taiwan cities; event at MCUT). Both Vercel (iad1) and Neon (us-east-1) are in US East -> trans-Pacific latency. Chose Tokyo (hnd1 + ap-northeast-1) over Singapore. DB is 11 MB.
- Rule: migrate DB first, flip Vercel region only after (must stay co-located). Old DB kept for instant rollback.
- created decisions/2026-06-01-tokyo-region-migration.md

## [2026-06-01] perf | Cache event_config; ISR rejected
attributed_to: [niko]   belongs_to: [tecxwork]
- getEventBranding now reads through the Vercel runtime cache (getCache, 1h TTL, tag "event-config"), invalidated from /api/admin/branding + /api/admin/timeframe. Cuts the per-request event_config query (runs on every page via root layout) -> DB-load resilience vs the free-tier connection ceiling.
- ISR/static for public pages REJECTED: all classify as Dynamic (getSession/getStudentLocale read cookies server-side); revalidate would be a no-op. Region move already captured the latency upside.
- created decisions/2026-06-01-event-config-cache.md

## [2026-06-01] infra | Consolidate to one Vercel project; update architecture overview
attributed_to: [niko]   belongs_to: [tecxwork]
- Deleted redundant `tecxwork` Vercel project (both it and `app` auto-built main -> double-build load that fed the outage). Migrated VAPID web-push keys to `app` (it was missing them; stripped a literal \n corruption), relinked local repo to `app`, redeployed.
- Refreshed topics/architecture-overview.md Data Infrastructure section to current state: Singapore region, single `app` project, free-tier DB resilience (pool error handler + event_config cache), caching model, cookie-dynamic pages.
- created decisions/2026-06-01-vercel-project-consolidation.md

## [2026-06-01] feature | Welcome push on enable (self-test confirmation)
attributed_to: [niko]   belongs_to: [tecxwork]
- /api/push-subscription now fires a one-off "🔔 Notifications enabled" push to the just-subscribed device after a successful subscribe. New helper sendPushToSubscription() in lib/web-push.ts targets a single endpoint (vs sendPushNotification fan-out). Fixes the silent-enable UX gap and gives every user a built-in self-test.

## [2026-06-01] ui | Notification bell moved out of hamburger
attributed_to: [niko]   belongs_to: [tecxwork, design-system]
- Bell is now a standalone icon to the LEFT of the hamburger (was inside the overflow menu), styled to match the hamburger (h-9 w-9, rounded-lg, border). Still gated on logged-in (showNotifications, non-guest).
- Unread indicator changed from a count badge to a purple dot (bg-purple-500). Notification messages no longer line-clamp-2 (full text, break-words); popover widened to w-80 with max-w-[calc(100vw-1rem)] so it can't be cut off on small screens.

## [2026-06-01] ui+feature | Welcome notification in bell; symmetric dropdown animation
attributed_to: [niko]   belongs_to: [tecxwork, design-system]
- /api/push-subscription now also inserts a one-time in-app "system" welcome notification (deduped per user) so the welcome shows in the bell, not just as a system push.
- Added shared `.dropdown-panel` CSS (globals.css) using --duration-base/--ease-fluid; bell popover and hamburger menu are now always-mounted with data-open toggling, giving matched, symmetric open AND close animations. Removed stagger-fade-in (the slow open) from the hamburger.

## [2026-06-01] feature | Notification retention cron (90 days) + CRON_SECRET fix
attributed_to: [niko]   belongs_to: [tecxwork]
- Added /api/cron/prune-notifications (daily 0 19 UTC) deleting notifications older than 90 days. Notifications previously had no retention (kept forever; mild PII).
- Found CRON_SECRET was unset on the app project -> cron routes 503; crawl-jobs had no success log since 2026-04-29. Set CRON_SECRET (all targets); should revive crawl-jobs too.
- created decisions/2026-06-01-notification-retention.md

## [2026-06-02] infra | Linear MCP setup for local coding agents
attributed_to: [niko]   belongs_to: [architecture-overview]
- Captured the current agent-tooling recommendation: use Linear's hosted Streamable HTTP MCP endpoint (`https://mcp.linear.app/mcp`) for Codex and Claude Code instead of a local Linear MCP process.
- Updated topics/architecture-overview.md with the Codex and Claude Code setup commands.

## [2026-06-01] infra | Disable job-crawl cron (legal)
attributed_to: [niko]   belongs_to: [tecxwork]
- Removed the /api/cron/crawl-jobs schedule from vercel.json — job crawling is not legal; not to be re-enabled. Route/crawler code left in place but unscheduled. OPEN QUESTION: crawled external_jobs (503 rows) are still displayed on /jobs via getCachedExternalJobs — decide whether to stop surfacing them.

## [2026-06-01] feature | Notification-primary application_submitted + post-apply push prompt
attributed_to: [niko]   belongs_to: [tecxwork]
- Audit: emails (280+ logged) > notifications (201); application_submitted = 134 (~48% of email). Made it notification-primary: student now gets an in-app "Application Submitted" notification (+push if enabled); the email sends only when the student has no push subscription. Recruiter notification unchanged.
- Added a post-apply "Turn on notifications" prompt (booking-form success view) to grow push adoption before event day. Extracted shared usePush() hook (src/lib/use-push.ts); notification bell refactored to use it.
- created decisions/2026-06-01-notification-primary-apply.md

## [2026-06-04] change | Always email recruiters on new applications
attributed_to: [niko]   belongs_to: [tecxwork]
- Email is no longer the event-day bottleneck, so `/api/bookings` now sends the recruiter `application_submitted` email for every student application instead of gating that email behind the student's push-subscription state.
- Kept the student in-app/push confirmation and post-apply push prompt. Updated decisions/2026-06-01-notification-primary-apply.md.

## [2026-06-04] fix | Hide recruiter email from student emails
attributed_to: [niko]   belongs_to: [data-privacy]
- Student-facing booking confirmation emails now link to `/recruiter/{id}` for the company page instead of showing the recruiter's contact email.
- Student reminder emails now show a platform company-page link per interview instead of a `mailto:` recruiter contact. Recruiter-facing emails still include applicant emails for review workflow.

## [2026-06-06] chat | Vite migration and business-logic exposure assessment
attributed_to: [niko]   belongs_to: [architecture-overview]
- Assessed converting this Next.js App Router codebase to Vite + React. Vite would require a separate backend for current server duties; it does not inherently protect business logic.
- Updated topics/architecture-overview.md with the migration/security assessment.

## [2026-06-06] chat | Next.js suitability from project start
attributed_to: [niko]   belongs_to: [architecture-overview]
- Clarified that Next.js was suitable from the start for tecxwork because the product needed server routes, auth redirects, dashboards, cron, metadata, and Vercel/Neon integration, not just a client-side UI.
- Updated topics/architecture-overview.md with the suitability assessment.

## [2026-06-06] ingest | Main event-day production pre-check
attributed_to: [niko]   belongs_to: [v-gen-trident-2026]
- Ran event-day pre-check: lint warnings only, production build passed, live public routes responded, critical Vercel env names present, and production DB consistency checks found no duplicate accepted slots or double-booked accepted applicants.
- Created missing production booking_action_logs table using the existing additive migration; logger was fail-open but audit logging is now available.
- Noted 7 pending/waitlisted applications whose requested recruiter/time has no available interviewer slot; those need waitlist/reject/reschedule handling. Updated topics/v-gen-trident-2026.md.

## [2026-06-06] ingest | Participant event-pulse visualizer artifact
attributed_to: [niko]   belongs_to: [v-gen-trident-2026]
- Created public/event-pulse.html as a simple participant-facing animated platform visualizer using the Tecxmate design system.
- Artifact can mirror public recruiter/company data where reachable and simulates private booking/notification pulses until a safe aggregate event-pulse endpoint exists. Updated topics/v-gen-trident-2026.md.

## [2026-06-06] ingest | Live aggregate pulse endpoint and stakeholder visualizer expansion
attributed_to: [niko]   belongs_to: [v-gen-trident-2026]
- Added public GET /api/event-pulse as a CORS-enabled aggregate-only endpoint for counts, booking/slot status buckets, company summaries, feature summaries, and integrity counters without exposing emails, CV links, or individual bookings.
- Expanded public/event-pulse.html with live aggregate endpoint support plus atomic-booking and stakeholder proof sections. Updated topics/v-gen-trident-2026.md.

## [2026-06-06] ingest | Public Live footer link for event visualizer
attributed_to: [niko]   belongs_to: [v-gen-trident-2026]
- Moved the participant visualizer to public/event-pulse.html so Vercel serves it at /event-pulse.html.
- Added a footer link labeled Live immediately after Feedback. Updated topics/v-gen-trident-2026.md.

## [2026-06-06] ingest | Live platform stuck report triage
attributed_to: [niko]   belongs_to: [tecxwork]
- Checked live production after a report that concurrent usage made the platform stuck: public pages and DB-backed public APIs responded normally, production logs had no recent 429/500/504 rows, and a direct Neon probe showed low active connection pressure.
- Observed DB counters: 167 applicants, 38 recruiters, 295 bookings, 89 accepted, 105 pending, 388 available slots, 89 booked slots; no duplicate accepted slots or orphan booked slots. Updated topics/tecxwork.md.

## [2026-06-06] ingest | Vercel Pro upgrade recommendation
attributed_to: [niko]   belongs_to: [tecxwork]
- Vercel dashboard screenshot showed Hobby free resources exceeded: Fluid Active CPU 5h23m / 4h, Blob transfer 8.54 GB / 10 GB, Edge Requests 645K / 1M, Function Invocations 620K / 1M.
- Recommended upgrading the live event project to Pro for capacity continuity, with a hard spend limit after upgrade. Updated topics/tecxwork.md.

## [2026-06-06] decision | Upgraded live project to Vercel Pro
attributed_to: [niko]   belongs_to: [tecxwork]
- Niko confirmed the upgrade. Hobby free resources had been exceeded (Fluid Active CPU 5h23m/4h) on event day; Pro lifts the limits and meters overage instead of throttling/pausing.
- Created decisions/2026-06-06-vercel-pro-upgrade.md. Follow-up: set a hard spend cap on the Pro plan.

## [2026-06-06] ingest | Event-day load-readiness audit
attributed_to: [niko]   belongs_to: [load-readiness, tecxwork]
- Audited readiness for 1000 students / 38 recruiters via 3 parallel code agents + live prod DB probe.
- Live facts: prod DB max_connections=901 (~2 CU, not 0.25), pooled endpoint, 17 conns in use → connection exhaustion is NOT a risk; the "cap pool max:5" advice was rejected. Slot integrity protected (advisory lock + SKIP LOCKED + unique constraint + race test).
- Top real risk: 60/min per-IP rate limit (region-shared Vercel cache) on client-fetched /api/recruiters, /api/external-jobs, and auth endpoints would lock out the venue's shared NAT. Recommended raising the api per-IP ceiling; keep per-email auth 5/min.
- Created topics/load-readiness.md.

## [2026-06-06] fix | Raise per-IP rate limits for venue NAT
attributed_to: [niko]   belongs_to: [load-readiness, tecxwork]
- New `public` bucket (1200/min/IP) for cached public reads (recruiters/external-jobs/event-pulse); `api` outer ring 60→300/min; per-email `auth` 5/min unchanged.
- Prevents the venue's shared NAT from being collectively 429'd off /browse and /jobs. Verified live (x-ratelimit-remaining:1199). Merged preview/event-pulse-visualizer→main (also shipped the public event-pulse visualizer), commit 8e75d07, prod deploy Ready.

## [2026-06-06] observation | Neon MCP is authed to the wrong account
attributed_to: [claude-code]   belongs_to: [neon-account-topology, tecxwork]
- Neon MCP (mcp.neon.tech, OAuth) is logged into org "Tecxmate" (dental-ai, alphatecx, us-east-1) — NOT the live app DBs. Production DATABASE_URL is `delicate-lab` (ap-southeast-1); POSTGRES_URL* is `bitter-hill`/`lucky-thunder` (Vercel-Neon integration). Both live under a different Neon login, not shared into Tecxmate.
- Fix: `/mcp` → Neon → Clear authentication → re-auth, logging out of Tecxmate in the browser first so SSO doesn't reuse it. Created topics/neon-account-topology.md.

## [2026-06-06] fix | Cache public event-pulse aggregate (15s)
attributed_to: [niko]   belongs_to: [load-readiness, tecxwork]
- Wrapped GET /api/event-pulse's ~15-subquery aggregate in a 15s server-side getCache (namespace "app", key event-pulse:aggregate:v1) so the public/CORS-* visualizer or a scraper can't run it on every hit. TSC clean.

## [2026-06-06] ops | Backup cadence on niko-pc -> 15 min
attributed_to: [niko]   belongs_to: [backup-dr, tecxwork]
- niko-pc (Ubuntu) runs the backup via systemd user timer `tecxwork-backup.timer` (was enabled+active, hourly). Last run success (exit 0), 48 dumps kept.
- Changed installed unit `OnUnitActiveSec=1h` -> `15min`, daemon-reload + restart; verified next run scheduled +15min. Flagged retention shrinks to ~12h at default DB_RETENTION=48.

## [2026-06-06] ops | DB_RETENTION=192 on niko-pc
attributed_to: [niko]   belongs_to: [backup-dr]
- Set service Environment=DB_RETENTION=192 (~48h history at 15-min cadence), daemon-reloaded. Restores the retention window the hourly default gave.

## [2026-06-06] fix | Event-pulse visualizer fits 16:9 desktop
attributed_to: [niko]   belongs_to: [v-gen-trident-2026]
- The public visualizer (public/event-pulse.html) overflowed ~2x a 1080p screen (scrolling wall). Added a desktop fit-to-viewport mode (`@media min-width:1181px and min-height:820px`): shell locks to 100dvh, main is a 2-row grid (trio + proof) with min-height:0 so rows are bounded by the viewport, not content.
- Compressed hero/proof rhythm; side rail now shows live metrics + company surface (the redundant "How it works" steps are hidden on desktop, kept on mobile). Verified via headless screenshots at 1920x1080 / 1680x1050 / 1440x900 (all fit, no clip); 1366x768 and tablet/mobile keep the scrolling layout.

## [2026-06-06] ops | Disable public event-pulse visualizer
attributed_to: [niko]   belongs_to: [v-gen-trident-2026]
- Disabled the public visualizer for the event: removed the footer "Live" link (site-footer.tsx) and added a temporary (307) redirect /event-pulse.html -> / in vercel.json. Reversible — the public/event-pulse.html file and its desktop-fit work are kept in the repo; remove the redirect + restore the footer link to re-enable.
- GET /api/event-pulse (aggregate-only, cached, CORS *) is left live and harmless; can be disabled separately if desired.

## [2026-07-16] ingest | Vercel Blob → Cloudflare R2 migration + logo recovery
attributed_to: [niko]   belongs_to: [photo-uploads]
- Free-tier Vercel Blob hit 100% of Advanced Requests; store access paused 30 days and existing image URLs now return HTTP 403 (44 URLs / 33 company logos broken on work.tecxmate.com). Chose R2 over paying Vercel.
- Upload backend swapped to Cloudflare R2 (S3-compatible): new src/lib/r2.ts, src/lib/image-host.ts (allow-list accepts R2 host + legacy Blob host), @aws-sdk/client-s3. Legacy Blob URLs still allow-listed.
- Re-sourced 30/33 company logos from the open web (official sites, Wikimedia, FB); SVG/ICO rasterized to PNG; stored in public/company-logos/ with recruiters.logo_url rewritten to /company-logos/<id>.<ext>. Originals backed up. Left for niko: BellWether, Futsu, 富利餐飲, KD 9 Spa. Gallery images unrecoverable.
- Decision: docs/wiki/decisions/2026-07-16-r2-image-storage-migration.md. Shipped via branch fix/logo-recovery-r2-migration off main (multi-tenant work deliberately excluded).

## [2026-07-18] build | Yang Luck ATS-kanban pitch demo
attributed_to: [niko]   belongs_to: [tecxwork]
- Built clickable Yang Luck demo on branch demo/yang-luck (off main, not merged). Star = /pipeline 5-stage ATS kanban with dnd-kit drag-drop that persists.
- Isolated demo Neon project tecxwork-yl-demo (MCP can't branch prod delicate-lab). New applications table. Seeded 1 recruiter + 7 jobs + 30 candidates across 5 stages.
- Vercel preview (branch-scoped demo DB): https://app-git-demo-yang-luck-nikolasdoans-projects.vercel.app/pipeline
- Decision: docs/wiki/decisions/2026-07-18-yang-luck-demo.md

## [2026-07-18] build | Yang Luck demo — 25 real client companies + subsidiaries
attributed_to: [niko]   belongs_to: [tecxwork]
- Scraped 6 confirmed Yang Luck group subsidiaries (yangluck.com.tw 集團夥伴) + 19 real representative central-Taiwan client firms in served sectors (agencies don't publish client lists).
- Added job_openings.client_company/client_industry/client_kind. Reseeded: 25 companies, 35 white-collar positions, 36 candidates across 11 companies + 5 stages (showcase 麗明營造 = 12).
- ATS board now groups by CLIENT company (25 tabs, subsidiaries badged 集團); candidate cards show applied position; drawer shows placement company+role.

## [2026-07-18] build | Demo: design-system alignment + yangluck rebrand
attributed_to: [niko]   belongs_to: [tecxwork, design-system]
- Kanban/pipeline now reuse the app design system: Card/Button/Badge components, font-heading, tokens. Standalone /pipeline dropped its custom header/toggle → redirects to /dashboard/pipeline (the native tab), reusing AppTopBar + RecruiterLanguageSwitcher (bilingual 繁中/English).
- Rebranded app chrome tecxwork → "yangluck 揚運" (brand-link, brand/pwa splash, site-footer, browse loading, layout metadata, student login/signup messages).

## [2026-07-18] fix | Demo: 25 client companies now real recruiters (visible in /browse)
attributed_to: [niko]   belongs_to: [tecxwork]
- Previously the 25 clients were only tags on Yang Luck's jobs (ATS-only). Now each client/subsidiary is its own recruiter with positions → shows in /browse "Participating Companies" (25, agency hidden via recruiters.client_kind='agency').
- getPipelineBoard now aggregates the whole placement pipeline across all client recruiters (agency super-view), grouped by company. cache.ts fetchRecruiters excludes clientKind='agency'.

## [2026-07-18] build | Demo: real Yang Luck logo mark replaces placeholder glyph
attributed_to: [niko]   belongs_to: [tecxwork, design-system]
- Added `public/yang-luck-logo.png` — the actual Yang Luck red/navy swoosh-wave mark (white knocked out to transparent, tight-cropped from the 394×368 brand PNG).
- Swapped the purple placeholder `/icon.svg` briefcase glyph for the real mark in all 5 visible logo renders: brand-link header, browse loading skeleton, register card, brand-splash, pwa-first-run-splash. Presented on an always-white rounded chip (`bg-white object-contain ring-1`) so it reads in both light and dark themes.
- Dropped the now-unused eye-blink keyframes/CSS from both splash components (the animation was tied to the placeholder glyph); kept the pop-in animation. Favicons (`icon.svg`, `icon-192/512`, manifest) left unchanged — this pass only touched the in-app wordmark lockup.

## [2026-07-18] feat | Demo: company logos + photos + Yang Luck hero carousel
attributed_to: [niko]   belongs_to: [tecxwork, photo-uploads]
- Scraped real logos for 20/25 client companies (public/yl/logos/) + company photos for 18 companies' detail-page galleries (public/yl/photos/, recruiters.gallery_urls).
- Homepage hero now cycles Yang Luck's own 5 branded key-visuals (public/yl/hero/; homepageImages + hero_overlay_enabled=false; page.tsx passes all images to HeroCarousel). Real documentary Yang Luck photos don't exist publicly — used their official branded banners.
- Preview domain yangluck.tecxmate.com added in Vercel (bound to demo/yang-luck branch); needs a Cloudflare CNAME -> cname.vercel-dns.com (DNS-only).

## [2026-07-26] feat | Competitive audit (CBtalent/NTUT) → directory-quality fixes
attributed_to: [niko]   belongs_to: [tecxwork, saas-strategy]
- ntut.cbtalent.tw is NOT copying tecxwork — it's NTUT's instance of CBtalent (white-label campus-recruiting SaaS). Treated as competitive intel.
- Shipped on demo/yang-luck: #2 hide 0-job companies in /browse, #5 dedupe titles + company rows, #6 verified-employer badge (new recruiters.verified col, default false) + seeded job closing dates. #4 (counts/pagination) was already done.
- Root-caused "only 1 company": demo Neon DB (lingering-sun) was never migrated (no applications table). Fixed via drizzle-kit push + FK-safe reseed (25 verified companies). See decisions/2026-07-26-competitive-audit-cbtalent.md.

## [2026-07-26] fix | Resolve Neon env hazard — realign stale prod vars to delicate-lab
attributed_to: [niko]   belongs_to: [tecxwork]
- Root of the demo 500: 3 Neon DBs; only DATABASE_URL is authoritative. Prod runtime=delicate-lab; lingering-sun is OLD prod (post Tokyo-migration) now repurposed as the yang-luck demo DB.
- Demo branch DATABASE_URL had drifted → realigned to lingering-sun (integration DB); demo recovered (200, 25 verified companies).
- PROD env footgun fixed: 7 stale vars (POSTGRES_URL/_NON_POOLING/_NO_SSL/_PRISMA_URL, POSTGRES_HOST, PGHOST, PGHOST_UNPOOLED) pointed at lingering-sun (= demo DB); realigned all to delicate-lab. Live prod unaffected (still 38 companies; code reads only DATABASE_URL).
- Note: lingering-sun was truncated+reseeded as the demo DB — it was decommissioned old-prod, no live data loss. Pending: add `verified` column to delicate-lab before any demo→main merge.

## [2026-07-26] chore | Prepared Yang Luck ATS merge migration
attributed_to: [niko]   belongs_to: [tecxwork]
- src/lib/db/add-yang-luck-ats-schema.ts (npm run db:update:yang-luck-ats): idempotent, additive migration = exact `git diff main...HEAD` schema delta. Adds recruiters.client_kind/verified, job_openings.client_company/industry/kind, pipeline_stage enum, applications table (+indexes). Run with DATABASE_URL=prod (delicate-lab) at merge; safe to re-run.
- Side note: realigning prod Neon vars (POSTGRES_URL/PGHOST/etc.) via rm+add left them Production-scoped only (dropped from Preview/Dev). Harmless — code reads only DATABASE_URL; demo uses its branch DATABASE_URL override. Both prod (38 cos) + demo (25 cos) verified 200.

## [2026-07-26] feat | ATS Phase 0 hardening — de-demo the pipeline (verified live)
attributed_to: [niko]   belongs_to: [tecxwork, saas-strategy]
- Started the ATS production-hardening effort (full roadmap: decisions/2026-07-26-ats-production-hardening.md; detailed plan in ~/.claude/plans/glowing-wiggling-eich.md). Decisions: multi-tenant-ready, unified agency+corporate, design-for-PII (staged tooling).
- Phase 0 (commit 3b8a167, code-only, no migration): getPipelineBoard() recruiter-scoped (agency keeps cross-client super-view); PATCH /api/applications/:id now auth-gated + ownership-checked (was fully open); applying to a job creates a real 'applied' pipeline card (idempotent on the unique index).
- Verified live on yangluck.tecxmate.com: unauth stage-move → 401; agency login sees all candidates, 麗明營造 client login is scoped (no cross-company leak). Apply→card path (needs an applicant login) verified by review only.

## [2026-07-26] feat | ATS Phase 1a — multi-tenancy + RBAC + audit (verified live)
attributed_to: [niko]   belongs_to: [tecxwork, saas-strategy]
- Migration db:update:ats-tenancy (commit 5a5c4a6): orgs, memberships (member_role enum), audit_log (append-only, PII-by-reference), org_id on recruiters/job_openings/applications. Applied to demo DB (lingering-sun): 1 Yang Luck org, 27 memberships, 26 recruiters + 36 applications backfilled.
- Wiring (commit 669868d): getMember() resolves org+role+recruiter; RBAC canMoveStage/isOrgManager; PATCH /api/applications/:id enforces tenant isolation + row ownership + writes move_stage audit; getPipelineBoard org-scoped; apply stamps org_id.
- Verified live: authenticated agency move → 200 + audit_log row (org 1, actor 2, move_stage, field_names[stage], metadata{from,to}); client moving another company's card → 403; agency/client board scoping intact. Phase 1b (configurable pipeline) is next.

## [2026-07-26] feat | ATS Phase 1b — configurable pipeline + transition log (verified live)
attributed_to: [niko]   belongs_to: [tecxwork, saas-strategy]
- Migration db:update:ats-pipeline (commit 646534a): pipeline_templates, pipeline_stages (stage_kind), application_stage_transitions (append-only), applications.stage_id. Seeded Yang Luck default template (5 stages), backfilled 36 apps + 36 initial transitions.
- Board renders columns from the org template (board.stages), grouped by stageId, bilingual by stage_kind; drag PATCHes {stageId}. PATCH validates target stage ∈ org, updates stage_id + writes an append-only transition (txn) + audit. Legacy stage enum kept as fallback.
- Verified live: agency {stageId} move → 200 + transition row (app 1: 1→3, moved_by 2), card restored; client moving another company's card → 403; board renders + scoping intact.
- CAVEAT: seed-yang-luck.ts is not yet tenancy-aware — after any reseed, re-run db:update:ats-tenancy && db:update:ats-pipeline (idempotent) or scoped boards return null.

## [2026-07-26] feat | ATS Phase 2 — agency CRM layer + Clients view (verified live)
attributed_to: [niko]   belongs_to: [tecxwork, saas-strategy]
- Decision: LAYER the agency spine over the existing recruiter/job/application model (don't replace) — student-facing app untouched.
- 2a (db:update:ats-agency, commit c391a80): clients/contacts/job_orders/submissions/placements tables + backfill (25 clients, 25 contacts, 35 job_orders, 37 submissions, 2 placements).
- 2b (commit db121ab): getAgencyCrm() + ClientsCrmView on a new agency-only /dashboard/clients tab (totals, submission funnel, per-client table). Non-agency recruiters redirected.
- Also seeded a demo applicant (student@yangluck.demo/demo1234) + slots for 麗明營造 so the full apply→card flow is testable; verified apply→application row live.
- Verified: agency Clients tab renders CRM (client 上銀科技 present); client recruiter gets no agency client list (no leak). Polish TODO: hide Clients nav item for non-agency.

## [2026-07-27] feat | ATS Phase 3 — migrant-labor compliance documents (verified live)
attributed_to: [niko]   belongs_to: [tecxwork, saas-strategy]
- The Yang-Luck differentiator. Migration db:update:ats-compliance (commit 128b234): compliance_documents (doc_type enum), unique per (candidate, doc_type). Seeded 48 docs / 12 candidates — 6 expired, 8 expiring ≤30 days.
- getAgencyCrm() computes expiry status live (expired/expiring_soon/valid, 30-day window). Clients tab shows a compliance panel: expired + expiring alert cards + attention table (candidate, ARC/work-permit, number, expiry, status), bilingual.
- Verified live: ARC docs + status badges render on the agency Clients tab; clients table intact.
- Phase 3 remaining: talent pools, activity feed, resume/doc R2 + signed URLs.

## [2026-07-27] refactor | Split compliance into its own tab (Client ≠ ARC)
attributed_to: [niko]   belongs_to: [tecxwork, saas-strategy]
- Feedback: ARC/compliance shouldn't live under "Clients". Moved the compliance panel out of ClientsCrmView into a dedicated ComplianceView + agency-only "Compliance" nav tab (/dashboard/compliance) — commit 5b4d163.
- Verified live: Compliance tab shows ARC/work-permit + expiry status; Clients tab is clean (client list only). Both agency-gated.

## [2026-07-27] feat | Hide agency-only nav tabs from non-agency recruiters
attributed_to: [niko]   belongs_to: [tecxwork]
- NavItem.agencyOnly + visibleNavItems(role,isAgency); isAgency threads dashboard→AppTopBar→DesktopTopNav and layout→MobileBottomNav (one indexed clientKind query for recruiter sessions). Commit 18b31d2.
- Verified live: agency sees Clients + Compliance tabs; co-leeming (client recruiter) sees neither; shared tabs (Pipeline) unaffected. Removes the phantom-tab quirk from Phase 2/3.

## [2026-07-27] feat | ATS Phase 4 — pipeline reporting (verified live)
attributed_to: [niko]   belongs_to: [tecxwork, saas-strategy]
- Agency-only Reports tab (/dashboard/reports, commit bd6c087) from the append-only transition log: getPipelineReport() → metrics (candidates/placements/rate/avg days), funnel per stage with avg days-in-stage, aging list. PipelineReportView = metric cards + funnel bars + aging table.
- seed-report-demo backdates demo apps/transitions ~8 weeks for realistic spread (oldest ~37d).
- Verified live: funnel/metrics/aging render on agency Reports tab; tab hidden from client recruiters.
- Phase 4 remaining: scorecards/evaluations, notes + @mentions.

## [2026-07-27] feat | ATS Phase 4b — candidate notes + scorecards (verified live)
attributed_to: [niko]   belongs_to: [tecxwork, saas-strategy]
- Migration db:update:ats-collab (commit 6192b21): activity (notes + stage_change events) + scorecards (recommendation enum, ratings jsonb, comment); seeded 15 notes + 10 scorecards. Shared authorizeApplication() authz helper.
- APIs: GET/POST /api/applications/:id/timeline (fetch/add note), POST /api/applications/:id/scorecard. Stage moves write a stage_change activity event.
- CandidateTimeline in the pipeline candidate drawer: fetch-on-open, scorecards (rec + star ratings + comment) + notes timeline, add-note input + submit-scorecard form.
- Verified live: unauth→401; GET returns seeded data; add note (author name resolved) + add scorecard persist. Remaining: @mentions.

## [2026-07-27] feat | ATS Phase 5 — PII governance (consent/retention/erasure, verified live)
attributed_to: [niko]   belongs_to: [tecxwork, saas-strategy]
- Migration db:update:ats-pii (commit ac3f1a4): applicant_profiles + consent_at/consent_purpose/retention_until/anonymized_at; backfilled consent + 18-month retention for 37 candidates.
- Timeline API returns candidate governance (consent date, retention + review-due flag, canErase by role). POST /api/applications/:id/erase-candidate = org-manager-only right-to-erasure (anonymize PII in place, audited). CandidateTimeline "Data & consent" panel + Erase-PII action (managers only).
- Verified live: consent/retention shown (retention 2028-01-26); unauth erase→401, non-manager(co-leeming)→403, canErase true only for agency; 0 accidental erasures.
- Remaining: automated retention enforcement, cross-border transfer register, client portal; plus talent pools + signed-URL docs (Phase 3 leftovers).

## [2026-07-27] feat | ATS talent pools / hotlists (verified live)
attributed_to: [niko]   belongs_to: [tecxwork, saas-strategy]
- Migration db:update:ats-pools (commit c507076): talent_pools + talent_pool_members; seeded 4 pools (VN Engineers, ID Manufacturing, Hospitality CN/EN, Redeployment) + 15 members. Manager-only APIs; candidate-drawer Talent-pools panel (add/remove/create).
- Verified live: 4 pools with counts, candidate 阮氏梅 in VN Engineers, add/remove works, client recruiter→403.
- Remaining (secondary): automated retention enforcement, cross-border transfer register, client portal, signed-URL docs, @mentions.

## [2026-07-27] feat | Retention enforcement cron — completes PII lifecycle (verified)
attributed_to: [niko]   belongs_to: [tecxwork, saas-strategy]
- GET /api/cron/retention-sweep (CRON_SECRET-gated, commit 222a2ff): auto-anonymizes candidates past retention_until, audited as system erasure; ?dryRun=true reports count. Schedule via cron config to activate.
- Verified: unauth→401; detection logic finds due candidates (0→1 on temp past-retention, reset→0, no erasure).
- Judged NOT needed for the demo (with reasons): cross-border transfer register (needs legal counsel), signed-URL docs (no real files in demo), @mentions (few users), client portal (large separate build). ATS is now feature-complete for the roadmap.

## [2026-07-27] ingest | Kanban pipeline board aligned to design system
attributed_to: [niko]   belongs_to: [design-system, recruitment-workflows]
- Pipeline kanban read as "brand new" / not part of the app. Realigned to native idioms: candidate cards use the signature Glow Card hover; hex stage/AI colors → palette tokens + status-pill tints; column headers now use the booking tab's colored count-circle (bg-{c}/15 text-{c}) instead of a gray count badge + dot; borders softened to /60.
- Faithful port of the booking tab's application-stage grouping (kanban = board form of same pipeline). See docs/wiki/topics/design-system.md History.

## [2026-07-27] ingest | De-floated the recruiter save/status "Add" action
attributed_to: [niko]   belongs_to: [design-system, recruiter-dashboard]
- On /dashboard/jobs (and My Company) the shared save/status action rendered as a fixed (mobile) / md:sticky top-right floating pill with heavy shadow + backdrop-blur — read as a detached, distracting FAB overlapping the header.
- Fix (recruiter-dashboard-company.tsx): removed the fixed/sticky wrapper, pill shape, glow shadow, backdrop-blur and pb-28 spacer; renderStatusStrip() now returns an in-flow button co-located in each form header (next to the Add / Edit title and the existing Submit/Delete cluster). Hardcoded Apple hex (#FF9500/#30D158) on the button swapped for the system orange/emerald scale. Only instance of the pattern; both jobs + company surfaces fixed.

## [2026-07-27] ingest | Required-field asterisks on the job form
attributed_to: [niko]   belongs_to: [design-system, recruiter-dashboard]
- Add/Edit job form gave no signal for which fields gate the Add button. Add is disabled until Position title + Employment type are set (only two inputs with `required`).
- Marked exactly those two labels with a red asterisk (text-destructive, aria-hidden since inputs already carry `required`). All other fields are genuinely optional and stay unmarked — not marking unenforced fields keeps the signal truthful. Shared renderJobForm, so applies to both Add and Edit.

## [2026-07-27] decision | Student profile → tabbed layout (was one long scroll)
attributed_to: [niko]   belongs_to: [design-system, recruitment-workflows]
- Competitor uses a tabbed profile editor (Basic / Education / Work / Skill / CV / Additional / View); ours was a single very long scroll, hard to track. Adopted the pattern.
- src/app/profile/page.tsx: added an 8-tab shell (basic, education, preferences, experience[work+certifications], skills, cvqr, applications, view) over the SAME draft + single PUT /api/me/profile save. Persistent identity header (avatar + completion + Save) stays visible on every tab; Save decoupled from the form (calls saveProfile() directly so it works on any tab). Each tab shows one region; a wizard footer offers Back / "Save Changes & Next" that advances only on a successful save. Added i18n keys profile.tabsBasic/tabsCvQr/tabsView (en/vi/zh-TW).
- Decision: free tab navigation (not linear wizard) + one-payload save, per niko. No API changes.

## [2026-07-27] ingest | Split profile "Experience" tab into Work + Certifications
attributed_to: [niko]   belongs_to: [design-system, recruitment-workflows]
- Per niko, split the combined Experience tab into two: "Work" (work experience) and "Certifications". Profile tabs now 9: basic, education, preferences, work, certifications, skills, cvqr, applications, view. Removed the now-unused Separator import. tsc + next build green.
## [2026-07-27] ingest | Job detail page: two-column reading flow + related-jobs internal linking
attributed_to: [niko]   belongs_to: [job-detail-page]
- niko: job content belongs on the LEFT, supporting content on the right — "that's how the natural reading flow is". References: a job-board detail screenshot and tuyendungviettrien.com/viec-lam/ke-toan-truong-1782868345700.
- /jobs/[id] reflowed from a single max-w-4xl column into max-w-6xl `minmax(0,1fr) 20rem`: left = title + Summary/Responsibilities/Requirements/Benefits + JD link; right (sticky) = salary + apply CTA + deadline, About-the-company card, General-information fact list. New src/components/job-detail-content.tsx; TextBlock exported from recruiter-job-posting-card.tsx for reuse.
- niko: add related-jobs suggestions at the end with backlinks — "keeps the person going inside the platform". New src/components/related-jobs.tsx + getRelatedJobs(): approved openings, same recruiter OR same category, newest first, max 6, topped up with newest approved so the block is never empty. Backlinks to /jobs/<id>, /jobs/cat/<slug>, /recruiter/<id>. Rendered via a `footer` prop so it hides during the booking flow.
- New `jobDetail` i18n block in en/vi/zh-TW. Verified: tsc clean, next build clean, page renders 200 in all three locales with 6 related backlinks.

## [2026-07-27] fix | Email sending broken by trailing "\n" in Vercel env vars
attributed_to: [niko]   belongs_to: [tecxwork, recruitment-workflows]
- Root cause: RESEND_API_KEY and EMAIL_FROM were saved in Vercel with a trailing LITERAL backslash-n. The corrupted key fails Resend auth ("API key is invalid") → every transactional email (verification codes, booking notes) silently throws. Verified: the key authenticates once the "\n" is stripped; EMAIL_FROM="V-GEN <noreply@tecxmate.com>\n" also makes an invalid From header.
- Fix: src/lib/email/index.ts sanitizes both env values (.replace(/\\[rn]/g,"").trim()) in getResend() and EMAIL_FROM, so a mispasted env var can't break all email. PERMANENT fix is to correct the two env vars in the Vercel project serving yangluck (remove the trailing \n) — recommended but not yet done (needs the owner).
- Also: yangluck.tecxmate.com is a SEPARATE Vercel project from "app" (which serves work.tecxmate.com); its DB is the Neon lingering-sun endpoint (not tecxwork-yl-demo). Student login niko.tecx@gmail.com seeded there directly.

## [2026-07-27] ingest | Candidate profile drawer: wider + de-duplicated, 2-col facts
attributed_to: [niko]   belongs_to: [design-system, recruitment-workflows]
- niko: the pipeline candidate drawer felt "way too much to the right" and "not very logical". Chose the wider-drawer + 2-col option.
- pipeline-board.tsx CandidateDrawer: widened max-w-md → max-w-xl; Placement + AI score now sit side by side (2-col); structured facts (School, Major) in a 2-col grid; dropped the duplicate Nationality row (already in the header); relabeled the blank-label description line as "About/簡介" (was reading as a mysterious duplicate of Major); View CV made full-width. Added `about` to the drawer i18n dict (zh/en). tsc clean.

## [2026-07-27] ingest | Pipeline candidate panel: desktop push/split-view (was overlay)
attributed_to: [niko]   belongs_to: [design-system, recruitment-workflows]
- niko wanted the board to shift left and the candidate panel to dock on the right (push, not float-over), unsure if it changes the foundational layout. Chose the contained split-view scoped to the pipeline board only — no app-shell change.
- pipeline-board.tsx: board now sits in a `flex` row (`min-w-0 flex-1`, kanban scrolls x); on desktop (matchMedia >=1024px) the detail panel docks in-flow as a sticky right column (w-380/xl:420, own scroll, no backdrop); below lg it stays the full-screen overlay. Extracted shared CandidatePanelBody (header+body, incl. Escape-to-close) used by both the docked panel and CandidateDrawer overlay, so the panel mounts once (no double CandidateTimeline fetch). tsc + next build green.
- If detail panels are later wanted on other surfaces (jobs/companies), generalize CandidatePanelBody into a shared right-rail component then — deferred.

## [2026-07-27] decision | Yang Luck is the ESA licensee → moat is the client-facing compliance clock
attributed_to: [niko]   belongs_to: [yang-luck, saas-strategy, taiwan-compliance]
- Competitive review: ntu.cbtalent.tw is a **Crossbond** portal white-labelled per school, funded by the school in exchange for running job fairs — the software is a cost of sale, deliberately thin (extends the 07-26 CBtalent audit with the *business model*). tuyendungviettrien.com = Việt Triển, Vietnamese-first listings/SEO volume play. pointsup.co = Taoyuan, 繁中/EN/VN, 企業方案 + 評點制方案 + dispatch. All three compete on the **discovery layer** — the layer whose cost collapsed. No moat, zero switching cost.
- [niko] confirmed Yang Luck is the ESA licensee, not a customer of an unlicensed tool. Scopes the old "position as event operations software to dodge licensing" strategy to the Tecxmate-independent-product case only; regulated matching/placement is available surface for Yang Luck.
- **Correction:** the sub-agent inventory behind the first draft surveyed `worktree-yang-luck-logo` @ ee7df2e (base db6c9ae, 07-18) — ~30 commits stale — and wrongly reported the ATS as an unsecured thin demo. Every blocker it flagged (open `PATCH /api/applications/:id`, unscoped `getPipelineBoard()`, bookings↔applications unreconciled) was fixed in Phase 0 (`3b8a167`); Phases 0–5 of [ats-production-hardening](decisions/2026-07-26-ats-production-hardening.md) shipped 07-26/27. Process fix: always fetch and survey `origin/demo/yang-luck`.
- Genuinely still open, ranked: (1) **client portal** — deferred in the hardening doc, but it *is* the lock-in; every compliance feature so far serves Yang Luck staff, not the factory HR whose switching cost we want to raise; (2) real signed-URL document storage (an expiry date with no clickable artifact isn't auditable); (3) MOL 私立就業服務機構評鑑 evidence pack — in no roadmap, largely derivable from existing `audit_log`/transition/activity data; (4) fee ledger + RBA Employer-Pays export for tier-1 electronics — no schema exists; (5) recruiter-side Vietnamese.
- New: [stakeholders/yang-luck.md](stakeholders/yang-luck.md), [decisions/2026-07-27-yang-luck-licensee-positioning.md](decisions/2026-07-27-yang-luck-licensee-positioning.md). Updated: [topics/taiwan-compliance.md](topics/taiwan-compliance.md) §1 scope limit, index.md.

## [2026-08-08] ingest | Comprehensive platform manual (all screens, all roles)
attributed_to: [niko]   belongs_to: [platform-manual, tecxwork]
- niko asked for a comprehensive PowerPoint/Figma of every screen and function across applicant, recruiter and admin — tutorial + function explanation + workflow. Clarified: HTML first (fastest to iterate), then export .pptx; screenshots from the app run locally via Playwright; audience = end users + investors + internal handover; English now, 繁中 at the final version; structure = workflow-driven, not screen-by-screen.
- Built as four "Acts" following real journeys (Applicant 14 steps · Employer 6 · Agency/ATS 6 · Admin 6) plus orientation and reference. 51 annotated screens embedded. Artifact: https://claude.ai/code/artifact/dc62f299-3a37-43be-86e9-99e93d412d9e — see topics/platform-manual.md.
- Design honours the app's own tokens (accent #8C52FF, Georgia display per --font-heading's declared fallback) rather than inventing a doc theme.

## [2026-08-08] ingest | .env.local points at PROD; demo DB needed 4 fixes before capture
attributed_to: [claude-code]   belongs_to: [neon-account-topology, data-privacy]
- Discovered while setting up screenshot capture: `.env.local` on demo/yang-luck resolves to the production DB (175 real applicants, 320 real bookings) and has no `applications` table. Screenshotting it would have put real student PII into an investor-facing document. Switched to the isolated `tecxwork-yl-demo` Neon project.
- That demo DB needed: all 7 ats-* migrations (missing `recruiters.org_id` → pipeline 500), a manual `recruiters.verified` column (missing → `/` and `/recruiter/[id]` 500 via fetchRecruiters), the demo applicant seed, and 384 slots + 15 bookings across every status. `drizzle-kit push` is NOT safe here — it wants to truncate `orgs`. Details in topics/demo-db-manual-capture.md.

## [2026-08-08] bug | SlotPicker ignores admin-configured event date
attributed_to: [claude-code]   belongs_to: [event-time-config, recruitment-workflows]
- `src/components/slot-picker.tsx:36` seeds its date from the build-time `EVENT_CONFIG.date` in `src/lib/data.ts`, not `event_config.event_date` (which everything else reads via getEventBranding()). Changing the date in Settings → Interview Time Frame therefore leaves the student slot picker opening on the old day, showing "No available slots on this day" — the booking flow appears broken.
- Not patched (out of scope for a documentation task); demo data was aligned to the constant instead. Flagged for fix before the next live event.

## [2026-08-08] ingest | Manual: proper front matter — reader onboarding before Act 1
attributed_to: [niko]   belongs_to: [platform-manual]
- niko: "pay attention to when users first open the docs, what they read first and what they see first. They should have enough context of the document and the platform before moving on." The v1 hero dropped straight into Act 1 — no orientation on how the document works, who the parties are, or the domain vocabulary.
- Added a "Start here" band ahead of the Acts: (1) How to read this manual — three reader routes with time estimates (learning ~45min / evaluating ~10min / doing one job ~5min) plus a legend explaining the repeating four-part screen anatomy; (2) What the platform is — now leads with the agency business model and a four-parties table (student / client company / agency / admin); (3) How a placement actually happens — hand-authored inline SVG lifecycle diagram; (4) Vocabulary — 14-term glossary (job order, submission, placement, ARC, work permit, PIPA, client vs subsidiary…). Hero gained an explicit "New here? / Just need to do a job?" router.
- The diagram carries the one claim prose kept failing to land: **a single Apply creates two records** — an interview booking (employer's, ends at the interview) and a pipeline card (agency's, runs for weeks) — linked by "same candidate, no shared status field", both converging on Hired. Admin actions are drawn as gates on the top band.
- Diagram gotchas worth remembering: (a) `.diagram` had to override the generic `figure{display:flex}` or the SVG collapses to intrinsic size (422px) with the caption beside it; (b) a CSS `text-anchor` in a class beats the SVG `text-anchor="start"` presentation attribute, which silently centred four labels on their arrow lines — use an inline `style` instead; (c) SVG can read CSS custom properties (`fill="var(--r-agency)"`), so the diagram themes for free.

## [2026-08-08] bug | Manual: sidebar links landed on the wrong section (CLS)
attributed_to: [niko]   belongs_to: [platform-manual]
- niko: clicking "4.1 Every booking" jumped to "2.4 Company profile" — "it is interacting like a scroll wheel, not a page". Root cause was cumulative layout shift, not scrolling: build.py emitted `<img loading="lazy">` with no width/height, so images reserved zero space; during the long smooth scroll the images above the target finished loading, the document grew, and the animation landed thousands of pixels short (worst case 5,778px).
- Fixed by emitting width/height on every img (read from the WebP RIFF header at build time) plus `height:auto` in CSS so the attributes act as an aspect-ratio hint rather than a literal height. 4/41 links broken → 41/41 correct.
- Reproduction was the hard part and is worth remembering: **Chromium cannot reproduce this** — it decodes `data:` URI images immediately even when marked lazy, so layout never shifts and the test passes vacuously. It also disappears if the test disables `scroll-behavior:smooth`, since an instant jump gives images no chance to shift the target mid-flight. Regression test `docs/manual/src/check-anchors.mjs` therefore runs in **WebKit with smooth scrolling left on**. Verified it fails 4/41 on the pre-fix build.

## [2026-08-08] fix | Manual screenshots were soft — optimize step, not the capture
attributed_to: [niko]   belongs_to: [platform-manual]
- niko asked whether the blurriness was a screenshot or HTML limitation. Neither: Playwright captured at deviceScaleFactor 2 (2880px wide) and the optimize step downscaled to 1320px, rendering at up to 1150 CSS px ≈ 1.15x — soft on any modern display.
- Now 2100px source + rendered width pinned to 1050px (`figure img{max-width:1050px}`) = a true 2.04x on every viewport. Both numbers must move together; without the pin the content column reaches ~1150px on a wide monitor and sharpness silently degrades. Page 3.5MB → 7.4MB, still well under the 16MB artifact ceiling.
- Also removed a 2600px height cap that had been silently truncating the 5 tallest screenshots (the /tutorial page lost ~2/3 of its content). No height cap now. Re-encode is a repo script: `docs/manual/src/optimize.py`.

## [2026-08-08] ingest | Manual: reframed as THREE products; added job-fair mechanism diagram
attributed_to: [niko]   belongs_to: [platform-manual, recruitment-workflows]
- niko: "I think it's actually three products. The third one is Realtime Job Fair event organization system — real-time recruiter/applicant matchmaking, and there's a solid atomic booking function." Correct, and verified in code before writing it up.
- The third product is genuinely distinct: (a) two-sided matching — `booking_direction` enum carries both `applicant_books_recruiter` and `recruiter_books_applicant`, the latter drawing on `applicant_slots` (students publish their own availability); (b) capacity is real — `recruiters.interviewer_count` multiplies the slot grid into seats; (c) the seat claim is atomic — `db.transaction` + `UPDATE slots ... WHERE id = (SELECT id ... FOR UPDATE SKIP LOCKED LIMIT 1)` in review/reverse/respond-proposal routes.
- "Two products, one codebase" → "Three products, one codebase" (marketplace / ATS / live job fair), plus a new `#jobfair` section with a second SVG diagram sitting alongside the placement lifecycle. Its claim: both booking directions funnel into one atomic claim with three outcomes (seat claimed → interviewer N · just taken → next free · all gone → waitlist). SKIP LOCKED is why concurrent acceptances take *different* seats instead of colliding, and why nobody is told "full" while a seat is free — the failure a naive count()-then-insert produces under load.

## [2026-08-08] ingest | Manual: screenshot lightbox (tap to enlarge, prev/next, zoom)
attributed_to: [niko]   belongs_to: [platform-manual]
- All 51 screenshots are now tap-to-enlarge with next/prev across the whole set, arrow keys, swipe, wrap-around, and a zoom toggle. Zoom renders at the 1x design width (1050px) and pans; fitting to a phone viewport is barely bigger than the in-page image, so fit-only would have made "enlarge" pointless.
- Two non-obvious decisions worth keeping: the overlay is **opaque** `#0A0810` rather than translucent + `backdrop-filter`, because WebKit composites a backdrop-filtered element's backdrop unevenly and the page remained legible through a 94%-opaque layer; and the two SVG diagrams are excluded from the gallery (vector, already legible, would read as broken entries).
- Test harness note: headless WebKit refuses synthesised touches — `new Touch(...)` is an "Illegal constructor" and `document.createTouch` throws a type error — so the swipe assertions run in Chromium while everything else stays in WebKit. `docs/manual/src/check-lightbox.mjs`, 19 checks.

## [2026-08-08] ingest | Manual: 繁體中文 + Tiếng Việt, single trilingual page
attributed_to: [niko]   belongs_to: [platform-manual]
- niko asked for Chinese and Vietnamese, "easy to understand and natural". 1,039 translatable units / ~7,500 words per language, translated as plain conversational 繁體中文 (Taiwan usage) and Vietnamese rather than literal renderings.
- **Architecture decision worth keeping:** one page with a runtime switcher, NOT three files. The screenshots are 7.4MB of base64; three pages would store them three times (22MB). Runtime swapping means the trilingual manual is 7.68MB — only 0.22MB more than English alone — one URL, instant switching, and it mirrors the product's own EN/VN/中 switcher.
- Pipeline: `i18n_extract.py` stamps `data-t="N"` on translatable elements (outermost-unit rule, skips `.route`/`<code>`/script/style) and dumps `strings/en.json`; `i18n_autofill.py` copies the 183 language-neutral units ("✓", "—", bare `<code>/browse</code>`) verbatim so only real prose is hand-translated; `build.py` inlines all three dicts and **fails the build** on any missing or orphaned key — silent drift would mean the Chinese page asserting something the English stopped saying.
- Kept untranslated on purpose: routes, `demo1234`, demo emails, and product button labels that genuinely are English. Added a glossary entry explaining that a few screens still say "Student" where the manual says "applicant".
- Language defaults to browser preference (vi/zh) on first visit, then persists in localStorage. Verified no SVG diagram label overflows its box in either language — Vietnamese is the long one, so diagram strings were written short deliberately.
- Regression: `check-i18n.mjs`, 19 checks in WebKit — dictionary coverage, tags/hrefs surviving innerHTML swaps, diagram labels, title, reload persistence, and anchors still landing correctly once translated.

## [2026-08-08] ingest | Manual shipped at /documentation, linked from the site footer
attributed_to: [niko]   belongs_to: [platform-manual, public-homepage]
- niko: "push to GitHub first, and then put a hyperlink called documentation at the footer next to the tutorial." Done — `public/documentation.html` served at `/documentation` via a rewrite in next.config.ts, with a plain `<a>` in site-footer.tsx (a next/link would client-navigate and 404 on a static file). Live: https://yangluck.tecxmate.com/documentation
- Build output moved from docs/manual/ into public/ so there is exactly one copy of the 7.7MB file, not two. Sources stay in docs/manual/src/.
- **Public vs internal split.** niko chose "strip internal notes, keep demo credentials". Blocks marked `data-internal` (the "Notes & known gaps" section naming the slot-picker bug and its source path) are removed from the public build. Crucially the strings are ALSO filtered out of the injected i18n dictionary — removing the section from the DOM alone left every sentence sitting in the JSON blob, findable in view-source. Verified live: 0 hits for slot-picker.tsx / EVENT_CONFIG / x-notes. The private Claude artifact keeps the full version.
- **git gotcha:** pushing failed with `RPC failed; HTTP 400 ... unexpected disconnect` because of the 7.7MB blob. Fix is `git config http.postBuffer 524288000`. Will recur on every manual rebuild — the postBuffer setting is now local to this clone, so a fresh clone will hit it again.
- Repo cost: ~14MB added (7.7MB built file + 6.2MB screenshot sources). Each future rebuild adds another ~7.7MB blob to history, so rebuild deliberately rather than on every text tweak.

## [2026-08-08] ingest | PowerPoint decks (EN/繁中/VN) + dropped "GET" from route lines
attributed_to: [niko]   belongs_to: [platform-manual]
- `public/tecxwork-manual{,-zh,-vi}.pptx` — 43 slides each, 16:9, ~4MB. Generated by `docs/manual/src/build_pptx.py`, which **parses manual.src.html** rather than restating content: step number, title, route, purpose and control list all come from the same markup the HTML renders, and translated decks reuse the i18n dictionaries. The deck therefore cannot silently drift from the manual.
- **Slide layout, after niko's feedback:** text column left, screenshot **full-bleed on the right, full height**. The first version boxed the screenshot under a header — niko: "now it is too small to read". On a slide the screenshot *is* the content, so it takes the larger half and no margin. Pages taller than 1.05:1 are cropped to their top with a note saying so.
- niko: "dont use GET, its only for technical team, the directory hierarchy is enough" — removed the `<b>GET</b>` prefix from all 37 route lines plus the legend sample (key 101 in all three dictionaries). Applies to both the HTML and the deck.
- python-pptx limits worth remembering: **no WebP decoder** (screenshots convert to JPEG in-memory) and **no SVG** (the two diagrams are pre-rendered to PNG by `render-diagrams.mjs`).
- Verification: PowerPoint's AppleScript PNG export is blocked by its sandbox, so `/tmp/preview_pptx.py` renders slides to HTML by reading geometry back **out of the saved file** (not from the builder's intentions), which is how the layout bugs were caught. Caveat: it does not render autoshape fills, so step badges look blank in the preview while being correct in the file — confirmed directly via python-pptx.
- Bug found and fixed while previewing: the diagram slides' blurb read "Start here" because `#lifecycle .act p` selects the eyebrow; needs `p:not(.act-no)`. Same trap on the Act dividers.

## [2026-08-09] ingest | Tier 1: agency CRM is writable (clients, contacts, job orders, placements, compliance)
attributed_to: [niko]   belongs_to: [recruitment-workflows, admin-panel]
- Audit finding that prompted this: the whole agency layer was READ-ONLY. `clients` (read in 5 files, 0 writes), `job_orders` (1/0), `placements` (3/0), `compliance_documents` (1/0), `pipeline_stages` (4/0), and `contacts` had 0 reads and 0 writes — a table nobody had ever used. Clients/Compliance/Reports were dashboards over data only a seed script could create.
- Added POST/PATCH/DELETE under `/api/agency/*` plus modal forms on the Clients and Compliance screens. Everything goes through `requireAgency()` in `src/lib/agency-auth.ts` — one choke point that enforces "agency recruiters only" AND returns the orgId every query must filter by, so "did we scope this?" is answerable by reading one function instead of twelve. Every write is audit-logged (field NAMES only, never values, so candidate erasure never has to mutate audit_log).
- Design decisions worth keeping: **placement clientId is derived from the job order, never accepted from the caller** (a mismatched client would corrupt every per-client number on the Clients screen); duplicate client name → 409; duplicate candidate+job_order placement → 409; a `client_order` without a client → 400.
- **Compliance renewal supersedes rather than overwrites.** A labour inspector can ask "was this worker covered on 1 August?" a year later; overwriting the expiry destroys the only record that answers it. Old row → `status='superseded'`, new row inserted, and the read layer excludes superseded so a renewed doc stops showing as expired.

## [2026-08-09] fix | compliance unique index had to become partial (found by tests)
attributed_to: [claude-code]   belongs_to: [drizzle-sql-gotchas]
- `unique_candidate_doc_type` was `UNIQUE (candidate_id, doc_type)` with no predicate, meaning a candidate could hold exactly one ARC row EVER. That is right for *current* documents and wrong for the table, and it made the supersede-and-keep-history design impossible — the renewal tests failed with `duplicate key value violates unique_candidate_doc_type`.
- Rebuilt as `UNIQUE (candidate_id, doc_type) WHERE status <> 'superseded'` — same guarantee for live documents, history allowed behind them. Migration: `src/lib/db/add-compliance-partial-unique.ts` (applied to the demo DB and the test branch). schema.ts now needs `import { sql }` for the index predicate.

## [2026-08-09] fix | half the test suite could not even import (pre-existing)
attributed_to: [claude-code]   belongs_to: [tecxwork]
- `booking-race.test.ts` failed at import with `Cannot find package 'server-only'` — `server-only` is not in package.json and is not installed; Next resolves it during a build, Vitest cannot. So one of the only two existing test files had been silently un-runnable. Fixed with a no-op stub aliased in vitest.config.ts (`src/test/stubs/server-only.ts`) — in tests everything already runs server-side, so the guard has nothing to protect.
- Also added the agency tables to the per-test truncate in setup.ts, or CRM tests leak rows into each other.
- Test DB is a Neon branch of tecxwork-yl-demo: `test-agency-crm` (br-calm-grass-ajkwm2y5). Suite now 3 files / 19 tests green.

## [2026-08-09] ingest | Candidate search — recruiters can finally find people
attributed_to: [niko]   belongs_to: [recruiter-dashboard, recruitment-workflows]
- Audit gap #5: there was no way to search the candidate pool. `/dashboard/applicants` is a booking-approval queue, not a search — so a recruiter could not ask "who has BIM, a valid ARC, and graduates in June?", which is the core daily act of recruiting.
- New `/dashboard/candidates` tab (`src/lib/candidate-search.ts` + `candidate-search-view.tsx`). One search box covering name / school / major / description / skills, plus faceted chips for nationality, study level, skills and document status, with real counts over the whole pool.
- **Filters live in the URL, not component state** — a useful search ("all BIM candidates needing document attention") is then just a link a recruiter can keep or send, and the back button behaves. Costs a server round-trip per filter change, which is why the query is SQL-side with LIMIT/OFFSET rather than fetch-everything-then-filter-in-JS.
- Decisions worth keeping: skills filter is **AND not OR** (adding a skill must narrow — there's a test that would catch an OR regression); the **worst document wins** so one expired ARC flags the candidate regardless of the rest; superseded documents are ignored so a renewal clears the flag; `docStatus: "none"` is distinct from `"valid"` because nothing-on-file is not the same as verified-fine.
- **Erased candidates are excluded from results AND from the facet counts.** After a PIPA erasure the row survives for FK integrity but the person asked not to be found; a facet reading "2" that returns 1 result would also read as a broken filter.
- Test-perf note: `seedApplicant` bcrypt-hashes a password, and 30 of those blew the 20s timeout. Search never touches `users`, so the search tests insert `applicant_profiles` rows directly — 60s → 30s for the file.
- Suite now 4 files / 26 tests.

## [2026-08-09] ingest | Post-placement lifecycle — guarantee windows + document risk
attributed_to: [niko]   belongs_to: [recruitment-workflows]
- Audit gap #8: `placements` was a terminal state (candidate, client, start date, fee). But in Taiwan staffing the risk and the money sit AFTER placement — a worker leaving inside the guarantee triggers a clawback, and a permit lapsing while they are on a client site is the agency's legal problem. None of it was representable.
- Migration `add-placement-lifecycle.ts` adds `probation_until`, `guarantee_until`, `end_date`, `end_reason`. Probation and guarantee are separate columns on purpose: probation is the employer's right to end the contract, the guarantee is the agency's clawback exposure, and they usually differ.
- New `/dashboard/placements` (agency-only) with `src/lib/placement-lifecycle.ts`. **The join that justifies the screen is compliance_documents.placement_id → placements** — that FK already existed and had never been used, so "this worker's permit expires in 10 days AND we are still liable" was unanswerable. Demo data now links docs to placements; Maria Santos shows 35 days of guarantee left, permit expiring 2026-08-19, NT$45,600 at risk.
- Rules enforced server-side: ending a placement requires an end date; `fell_off` also requires a reason; the response returns `insideGuarantee` computed **at the moment of the decision** rather than recomputed later from dates that may since have been edited. `updatePlacementSchema` deliberately cannot change candidate/job order/client — those are facts about what happened and feed the client-level counts.
- Also: an ended placement is never counted as "in guarantee" or as document risk (they are gone; it is not live exposure), and superseded documents are ignored so a renewal clears the flag.
- Verification note: the Playwright script for this MUTATES data (marks a placement fell_off), so re-runs are not idempotent and gave a false failure. The committed regression tests (10 cases) are the deterministic version. Suite now 5 files / 36 tests.

## [2026-08-09] ingest | Error reporting + error boundaries (audit #14)
attributed_to: [niko]   belongs_to: [tecxwork, load-readiness]
- There was no error monitoring and **no error boundaries at all** — an unhandled error rendered Next's own error screen and nobody was told. On event day that means a recruiter hits a 500 mid-booking and the first you hear of it is a phone call.
- `src/instrumentation.ts` implements Next's `onRequestError`, the one hook that sees every uncaught server error. Two transports, neither needing an account: a structured single-line JSON log (Vercel indexes it, so you can alert on `level:"error"` with zero integration), and an optional POST to `ERROR_WEBHOOK_URL` (Slack/Discord/anything).
- **Deliberately not wired to Sentry.** An unconfigured vendor SDK is dead weight, and no DSN was available; the webhook covers "tell someone" today and a DSN can be added later without changing the shape.
- Query strings are stripped from reported paths — this app puts search terms and ids in them, and the path alone is enough to locate a bug.
- `app/error.tsx` + `app/global-error.tsx`: friendly copy, a retry, a link to /feedback, and the Next `digest` shown as a reference so a support message ties back to the server stack trace. The raw error text is deliberately NOT shown to the user. global-error styles itself inline because the design system may be exactly what failed.
- Verified by temporarily adding a throwing route: onRequestError emitted the structured log with path/method/routeType, and the boundary rendered. Route removed afterwards.
- Gotcha: a folder named `__errtest` is not routable — Next treats a leading underscore as a private folder.

## [2026-08-09] ingest | Calendar invites for interviews (audit #11)
attributed_to: [niko]   belongs_to: [tecxwork, interview-scheduling]
- There was **zero** calendar code in the repo. A confirmed interview existed only inside TECXWORK, so the way anyone remembered it was by logging back in. On event day that is how no-shows happen.
- `src/lib/calendar.ts` writes RFC 5545. Three details are load-bearing and easy to get wrong:
  - **CRLF endings.** A bare `\n` makes Outlook reject the file outright.
  - **Folding at 75 _octets_, breaking only on code points.** Names here are Vietnamese and Chinese; folding by character overflows the limit, folding by byte splits a multi-byte character and every client shows mojibake. Tests assert both directions.
  - **A stable UID per booking** (`booking-<id>@tecxwork.com`) so a reschedule *updates* the event instead of adding a second one, and a cancellation actually removes it.
- All times are emitted in UTC, so there is no VTIMEZONE block to get wrong and no ambiguity between a candidate in Vietnam and a recruiter in Taipei. Clients render in the viewer's own zone.
- **METHOD:PUBLISH, not REQUEST.** REQUEST renders an RSVP card but expects ORGANIZER to match the sending mailbox — ours is the platform address, not the recruiter's, and the mismatch makes some clients drop the invitation entirely.
- Endpoints: `/api/bookings/[id]/calendar` (one interview) and `/api/bookings/calendar` (the caller's whole day — a recruiter with 14 interviews will not click "add" 14 times). Both are restricted to the parties on the booking, and a stranger gets 404 rather than 403 so booking ids can't be enumerated.
- Cancelled/rejected bookings still return a file, issued as `STATUS:CANCELLED` with no alarm, so a calendar holding the event drops it instead of leaving a ghost interview.
- The .ics is also attached to the confirmation email for both sides. Attachment build failures are swallowed: a calendar file must never stop the confirmation email, which is the part the candidate depends on.

## [2026-08-09] fix | Test suite hung for 10 minutes on a TRUNCATE lock
attributed_to: [claude]   belongs_to: [tecxwork, testing]
- One agency-CRM test "failed" after **599 seconds** while the same file passed 12/12 when run alone. Not flakiness in the test — a lock.
- `beforeEach` truncates ~25 tables, which needs ACCESS EXCLUSIVE on every one of them, and `afterAll` never closed the DB pool. Each test file therefore left idle Neon connections behind, and Postgres waits **forever** for a blocked TRUNCATE by default, so the hang looked like a slow test.
- Two fixes: `closeDb()` (new, test-only export) releases the pool in `afterAll`, and `set lock_timeout = '15s'` makes a blocked truncate fail fast and loudly instead of hanging.
- Result: 6 files / 48 tests green in 192s, down from 759s with a failure.

## [2026-08-09] security | Candidate database was readable by client-company recruiters
attributed_to: [claude]   belongs_to: [tecxwork, permissions]
- Found while implementing RBAC, and more serious than the gap being fixed: `/dashboard/candidates` called `searchCandidates()` after checking only that *a* recruiter was signed in. `searchCandidates` performs no authorization of its own — it is a pure query.
- Verified live: logging in as `co-chiafu@yangluck.demo` (a **client-company** recruiter, not the agency) rendered **22 candidate names** with contact details and document status. The agency's candidate pool is its own asset and is full of PII subject to PIPA.
- Cause is a shape worth remembering: the API route was guarded, and the **page that renders the same rows** was not. Server components load data directly and bypass route guards entirely.
- Fixed by gating the page on `getAgencyActor("candidate:read")`. Re-verified: 0 names for the client-company recruiter, 22 still for the agency admin.

## [2026-08-09] ingest | Role-based access control on the agency surface (audit #4)
attributed_to: [niko]   belongs_to: [tecxwork, permissions]
- `member_role` has had seven roles since the ATS tenancy migration, but only the **tenant** boundary was ever enforced. Any member of an agency org could create clients, end placements (which triggers a fee clawback) and read the whole candidate database. An interviewer brought in for one afternoon had the authority of the account manager.
- `src/lib/permissions.ts` is a **capability matrix**, not role checks at call sites: `role === "admin" || role === "account_manager"` scattered around is exactly what lets a new role silently inherit powers nobody intended. Adding a role is now one deliberate edit to one table.
- Notable policy calls: only admin/account_manager may write clients (owning an account is commercial); interviewers hold **no** org-wide capability at all and reach candidates only through applications assigned to them; viewers read the commercial picture but never the candidate database — an observer with no operational need does not get PII.
- Enforcement goes through the gate that already existed: `requireAgency(capability)` for the 14 API routes, plus a new `getAgencyActor(capability)` for server components, which is what closes the page-vs-route gap above.
- The role is read from the **membership scoped to the org being acted in**, not the session — a user with memberships in several orgs must not carry one tenant's admin rights into another. Tested.
- Missing membership = denied. Inferring a role from the recruiter row would hand out authority by accident.
- The nav filters on capability too, so a role is never shown a tab that would only redirect it. Verified live by demoting the agency admin to `viewer`: writes 403, reads 200, candidate PII gone, and the Candidates tab disappeared while Clients/Placements/Compliance stayed. Role restored afterwards.
- **Test-helper note:** `seedAgency` did not create a membership, so deny-by-default correctly broke all 22 existing agency tests. Production has a membership for every recruiter (verified), so the helpers were fixed rather than adding a permissive fallback.

## [2026-08-09] security | Revocable sessions — logout and password reset now actually end access (audit #15)
attributed_to: [niko]   belongs_to: [tecxwork, auth]
- The JWT was stateless with a 24h expiry and **no revocation of any kind**. Two consequences, both verified live before the fix:
  - **Signing out did not sign you out.** `/api/auth/logout` cleared the cookie; a token captured beforehand kept working for the rest of its 24 hours. This matters here specifically because candidates sign in from shared campus and library machines.
  - **A password reset did not evict anyone.** Reset set `passwordHash` and nothing else, so someone already holding a token kept full access — the reset did not undo the compromise it was performed in response to.
- Fixed with a `sessions` table: one row per signed-in device, id = the JWT's `jti`. `getSession` verifies the signature and then checks the row still exists and has not expired.
- **Why a table rather than a `token_version` / epoch column:** an epoch forces all-or-nothing revocation, so signing out on your phone would sign out your laptop. A row per device gives correct per-device semantics for the same one indexed lookup per request.
- Revocation points: logout deletes **that one** row; password reset deletes **all** rows for the user. Both tested.
- **Tokens without a `jti` are refused**, not grandfathered — an unrevocable token is exactly what was being removed. Everyone signed in at deploy time is asked to log in once more. Intended.
- Expired rows are swept opportunistically on sign-in, scoped to that user. Bounded work on a path already writing, so no cron.
- `getSession` is deliberately **not** memoized with React `cache()`: the test helpers swap sessions mid-test, and a per-request memo would have returned a stale session and hidden real failures.
- Verified live end to end: token captured → works (200) → logout → replay 401. And: stolen token live (200) → victim resets password → same token 401 → victim signs in fine. All three published demo logins still work.
- **Test-helper note:** `withSession` had to become async (it now creates a real session row); hand-signing a token would test a state the app can no longer produce. 19 call sites updated.

## [2026-08-09] ingest | CSV exports for the agency surface (audit #12)
attributed_to: [niko]   belongs_to: [tecxwork, exports]
- Before: exactly one export — admin-only, bookings only. A recruiter or agency could get **nothing** out of the system. HR teams generally want data out before they will trust putting data in.
- **Bug found and fixed in the existing export: no UTF-8 BOM.** Excel on Windows ignores the charset in the HTTP header when opening a downloaded file and guesses the local codepage, so "阮文測試" arrived as mojibake. In this product *every* candidate name is Vietnamese or Chinese, so the old export was effectively unusable in the tool people actually open CSVs with. Verified before (BOM absent) and after (present).
- `src/lib/csv.ts` centralises the three things that must be right: the BOM, formula neutralisation (`=`, `+`, `-`, `@`, tab, CR — candidate-supplied text lands in these files, so it is an injection sink), and CRLF endings per RFC 4180.
- Deliberate detail: **numbers are not neutralised**. Prefixing `-500` into `'-500` would turn a negative fee into text and break every sum in the sheet. Only strings get the guard.
- Three new exports, each gated by the capability that already guards the matching screen: candidates (`candidate:read`), placements (`placement:read`), compliance (`compliance:read`).
- The candidate export **takes the same query parameters as the search page**, so "export" means "export what I am looking at". Verified: unfiltered 38 rows, `docs=attention` 12, `q=BIM` 6.
- Compliance exports **every** document, not the dashboard's `attention` subset — an inspection asks to see the whole file, and handing over only the problems answers a question nobody asked. Superseded revisions are excluded so one person never appears to hold two conflicting permits.
- Placements carries a separate numeric "Fee At Risk" column so finance can sum the clawback exposure directly instead of rebuilding it with a formula.
- `EXPORT_LIMIT = 10_000` caps the candidate query — far above any realistic pool, but an unbounded query on a user-triggered download is how one click takes the database down. Truncation is logged, never silent.

## [2026-08-09] ingest | Editable pipeline stages (audit #3)
attributed_to: [niko]   belongs_to: [tecxwork, pipeline]
- `pipeline_stages` / `pipeline_templates` were read in four places and **written in none** — the hiring process was whatever the seed script happened to insert, and no screen could change it.
- **Retiring a stage archives, it never deletes.** `application_stage_transitions` is the append-only record every funnel and time-in-stage report is built from, and it references stage ids; destroying a stage anyone ever moved through would either be refused by the foreign key or take the history with it. New `archived_at` column; every board query filters on it.
- Two guards that matter more than the CRUD:
  - **Refused while candidates stand in the stage** (409, naming the count). Archiving an occupied stage would drop those people off the board while their rows still sat in the database — silent data loss discovered weeks later. Verified live against the real demo board: retiring "Interview" with 22 candidates is refused.
  - **Refused on the last remaining stage.** `getPipelineBoard` returns null with zero stages, so an empty board cannot be recovered from the UI.
- Reordering requires the request to name **every** active stage exactly once. A partial list would leave unnamed stages where they were, so the order the user sees after a drag would not be the order they arranged. Applied in a transaction.
- New capability `pipeline:configure`, held only by admin and account_manager — the line between *using* the pipeline and *redefining the process everyone else works inside*.
- **Latent bug fixed while here:** `stageIdByKind` was built last-wins. Editable stages make duplicate kinds possible ("Client interview 1" / "…2"), so a legacy row carrying only the old enum would have landed in whichever stage came last. Now first-wins in board order.
- The template is created on demand, so a brand-new org is never stageless.
- UI is up/down buttons rather than drag-and-drop: a pipeline has a handful of stages and is rearranged rarely, so a drag library and its pointer/touch edge cases cost far more than they return — and buttons work with a keyboard and a screen reader. Remove is disabled (not just server-refused) for occupied stages, so the reason is visible before the click.
- Verified live: add → reorder to position 4 → board shows the new column → rename → retire → board restored, archived row intact with its name and id. Probe stage removed afterwards.

## [2026-08-09] ingest | Document custody — CVs and permits held, not linked (audit #6)
attributed_to: [niko]   belongs_to: [tecxwork, documents]
- **The gap, measured:** 37 of 38 CVs were Google Drive URLs. A link is not custody — the candidate owns that file and can delete or revoke it, taking the agency's record of what it submitted with it. Worse, the product *instructed* candidates to set "anyone with the link can view", so every CV was readable by anyone holding the URL. And `compliance_documents.file_id` was a dead column: the tracker knew an ARC existed and when it expired but never held the scan an inspection asks to see.
- **Why the existing `/api/upload` could not be reused:** it is images-only, and `uploadToR2` returns a **public, immutable, edge-cached** URL. Correct for a logo; catastrophic for an ARC scan — uploading one there publishes it permanently.
- **Decision (niko):** build storage-agnostic now, add the hosted driver later. R2 is not configured in this environment, so a verified-end-to-end hosted implementation was not possible this session.
- `DocumentStorage` is three methods — put/get/remove. Everything that makes documents *safe* (capability check, tenant scoping, audit) lives in the route above it, so adding R2/S3/Blob later is one file plus one line in `getDocumentStorage`.
- **Documents are streamed through the app, never linked to.** A presigned URL is a bearer token that keeps working for whoever it is forwarded to, and URLs get pasted into chat threads. Proxying costs a little bandwidth and buys a permission check *and* an audit row on every single read.
- **A permit is not a CV.** `capabilityForKind` routes ARC/work-permit/passport to `compliance:read`/`compliance:write` and everything else to `candidate:read`. Tested: a hiring manager can open a CV and is refused an ARC scan.
- Storage keys are 24 random bytes, never derived from the filename or the candidate — a key must not leak whose document it is, and two people uploading "cv.pdf" must not collide.
- Upload allow-list (PDF/JPEG/PNG/WebP) rather than a deny-list; SVG and HTML are absent on purpose because they render as active content.
- Deletion is soft. A document relied on during a placement is part of the record even after it is superseded; PIPA erasure is a separate deliberate act that also clears bytes.
- `getDocumentStorage()` **throws** when unconfigured rather than falling back to a temp directory: an upload that appears to succeed and writes to a container filesystem that vanishes on the next deploy is worse than a clear 503.
- **Config:** set `DOCUMENT_STORAGE_PATH` for local disk. (`.env.example` is gitignored in this repo, hence recorded here.)
- Verified live with storage configured: 90-byte PDF uploaded → written under an unguessable key → downloaded **byte-identical** with `Cache-Control: private, no-store` and `nosniff` → client-company recruiter refused 403, unauthenticated 401 → SVG refused 415 → audit rows recorded upload and view with kind/candidate/size and no content. Attaching to compliance record #46 flipped that row from "Attach" to "Scan". All probe data removed afterwards.
- **Not done:** a general per-candidate document manager on the candidate screen. The compliance attach/view flow is wired because that is where the dead column was and where an inspection happens.

## [2026-08-09] note | Test-suite flakiness is network-bound, not a product defect
attributed_to: [claude]   belongs_to: [tecxwork, testing]
- Two consecutive full runs each failed **one** test — a different test each time, always a timeout, never an assertion. Every file passes in isolation on retry (agency-crm 12/12, documents 18/18, pipeline-config 18/18, placement-lifecycle 10/10 in 50s after a run where the same file took 441s).
- Measured the database directly to rule it out: `select 1` 778ms cold, `count(*)` 226ms, the 30-table `TRUNCATE` **523ms**. The DB is healthy — 125 tests' worth of truncates is about 65s, nowhere near the 1400s+ a full run now takes.
- The cost is **network round-trips to a remote Neon branch at 0.25 CU**: each test makes 10–20 queries at ~200–400ms RTT, so ~4–6s per test is the floor and an occasional stall pushes one test past the timeout.
- Two changes this session raised the per-test query count on purpose: revocable sessions add a session lookup to **every** authenticated request, and `withSession` now writes a real session row. Correct designs; they simply cost round-trips against a remote DB.
- `testTimeout`/`hookTimeout` raised 20s → 60s so honest slowness stops being reported as failure while still bounding a genuine hang.
- **Recommendation for CI:** run the suite against a **local Postgres** (container or service) rather than a remote Neon branch. That removes the RTT floor entirely and should take the suite from ~25 minutes to a couple. Left as a decision for niko — it changes how CI is provisioned.

## [2026-08-09] decision | Tests move to a local Postgres
attributed_to: [niko]   belongs_to: [tecxwork, testing]
- Chosen after three full runs each failed a **different** file on timeouts while every file passed in isolation. The database was measured and is healthy (30-table TRUNCATE = 523ms); the cost is 10–20 network round trips per test at ~200–400ms each against a remote Neon branch. The pooler was ruled out too (direct endpoint: 144s vs 159s for the same file).
- **Blocker found and solved:** the app uses `@neondatabase/serverless`, whose `Pool` talks WebSocket to Neon's proxy and **cannot reach a plain local Postgres**. `getDb()` now picks the driver from the URL — `node-postgres` for localhost, Neon otherwise. `pg` is a devDependency and is `require`d lazily inside the local branch, so it never enters a serverless bundle.
- `./scripts/setup-test-db.sh` (`npm run test:setup`) drops, recreates and schema-pushes `tecxwork_test`. It exits with instructions if Postgres is missing or not running rather than failing obscurely.
- **One-time step for niko:** `brew install postgresql@17 && brew services start postgresql@17`, then `npm run test:setup`. Claude did not install it — that is a machine-level change to make deliberately.
- **Unverified until then:** the local driver branch has not been exercised, because there is no Postgres on this machine. The Neon path is confirmed unaffected (37 tests across 3 files green after the change).

## [2026-08-09] ingest | Offers — what was offered, who authorised it, what came back (audit #7)
attributed_to: [niko]   belongs_to: [tecxwork, offers]
- "Offer" existed only as a **column on the pipeline board**. A candidate sat in it and nothing recorded the salary, the start date, who authorised those terms, or whether the person said yes — and when a placement was created later its salary was retyped from memory.
- The lifecycle rules live in `src/lib/offers.ts` as a transition table rather than as `if`s spread across routes, because those rules *are* the feature.
- **Drafting and approving are separate capabilities.** A recruiter holds `offer:write` and can prepare terms; only `offer:approve` (admin, account manager, hiring manager) can authorise them. One person promising money unilaterally is exactly what an approval step exists to prevent.
- **Terms freeze at approval.** An approval that can be edited afterwards authorises nothing — so PATCH is refused with a 409 once the offer leaves draft.
- Withdrawal needs `offer:approve` too: pulling authorised terms is a decision of the same weight as granting them.
- **Expiry is evaluated at read time**, not by a nightly sweep. A sweep leaves a window where a lapsed offer is still acceptable, and the whole point of the date is that it holds at the moment someone tries to use it. `effectiveStatus` folds it in for display; the accept path re-checks it.
- One live offer per application, enforced by a **partial** unique index so a declined offer can be followed by a fresh one while the declined row stays for history. The route detects the violation via the driver error's `constraint` field — it is not in the message string, and drizzle wraps the original in `cause`.
- An accepted offer with a job order **creates the placement and carries the terms across**, which is the point: the salary is no longer retyped.
- The candidate is taken from the application, never from the caller — otherwise an offer could be filed against someone who never applied.
- **Bug found by looking at the screenshot:** the accepted candidate appeared in *both* "Awaiting an offer" and the offers list. The exclusion covered only live offers; accepted is settled, not waiting. Declined/withdrawn/expired correctly still appear, since those are exactly the people who need a new offer. Regression tests added.
- Verified live through the running app: duplicate live offer 409 · accept-before-approval 409 · edit-after-approval 409 · decline-without-reason 400 · accept 200. Demo data removed afterwards.
- **Verification caveat, since closed:** the remote test branch degraded badly during this item (a file that ran in 147s took 42 minutes; a single round trip later measured **8.8 seconds**, against 226ms earlier). 2 of the 3 new regression tests passed and the third timed out rather than failing an assertion.
- The gap was then closed **by live verification instead**, against the running app on the healthy demo database: awaiting-offer went 6 → 5 on drafting → **6 on decline** → 5 on accept. That is exactly what the timed-out test asserts, so the behaviour is confirmed; only the unit test's run is outstanding, pending the local-Postgres move.

## [2026-08-09] ingest | Billing and invoicing (audit #9)
attributed_to: [niko]   belongs_to: [tecxwork, billing]
- The agency's entire revenue lived in `placements.fee_amount` — a number with no bill behind it. Nothing recorded what had been charged, when it went out, or whether it had been paid, so **"how much is outstanding?" had no answer anywhere in the product**.
- **Amounts come from the placement, never from the request body.** Letting a caller send the amount is exactly how an invoice ends up disagreeing with the placement it is supposed to be billing.
- **Tax is applied to the subtotal, not per line**, and held in basis points (500 = 5% 營業稅) so the arithmetic is exact integers. Rounding each line then summing gives a different answer from rounding the sum — and the client's own accounts do the second. Pinned by a test: `[15,15,15]` at 5% is 2, not 3.
- **A placement's fee can only be billed once**, enforced by a partial unique index rather than by application logic. Postgres cannot reference another table from an index predicate, so `invoice_lines.voided` mirrors the parent invoice's void — deliberately denormalised, written in the same transaction as the void, which is the only place it can change. A duplicate-billing guarantee this important belongs in the database.
- **Void, never delete.** An invoice number sent to a client is part of the accounting record even when wrong, and a gap in the sequence reads to an accountant as a missing document. A reason is required. Voiding frees its placements to be re-raised on a correction.
- **A paid invoice cannot be voided** — that needs a credit note, which is a different document with its own number. Refusing is more honest than pretending.
- Invoice numbers are `INV-YYYY-NNNN`, sequential per org per year, derived from what exists so a gap never appears silently.
- The screen answers the questions the product could not: outstanding, overdue (past due date), paid this year, and what is still unbilled. It also flags **placements that fell off after being invoiced** — the fee the agency has billed but may have to credit.
- **Migration gotcha worth remembering:** the first run created `invoice_lines` and then failed on the index, so `CREATE TABLE IF NOT EXISTS` skipped the new column on the retry. Idempotent migrations need a separate `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for anything added after the table's first version.
- Verified: 21/21 unit tests, plus live against the demo data — 45,600 + 5% = 47,880, duplicate billing refused by name, pay-before-issue 409, void-a-paid-invoice 409. Probe data removed afterwards.
- **Not done:** credit notes. Flagged rather than half-built — a credit note is its own numbered document and deserves the same care as an invoice.

## [2026-08-09] answer | What TECXWORK charges today
attributed_to: [claude]   belongs_to: [tecxwork, billing]
- Asked directly by niko. The honest answer from the code: **a per-placement fee that a human types in. There is no rate card anywhere in the system.**
- `placements.fee_amount` is a plain optional integer set by hand. Nothing computes or validates it.
- The demo data uses **1.2× one month's salary** (45,600 on 38,000; 40,800 on 34,000) — a pattern *in the data*, not a rule in the code.
- The invoice adds **5% 營業稅**, which *is* in the code (`DEFAULT_TAX_RATE_BP`).
- `placements.guarantee_until` records when clawback exposure ends, but nothing calculates what a clawback is worth.
- **Decision (niko):** keep the credit amount a manual judgement with the guarantee context shown, rather than inventing a sliding scale. A rate card and a clawback schedule remain open options.

## [2026-08-09] ingest | Credit notes, and a left sidebar for the employer workspace
attributed_to: [niko]   belongs_to: [tecxwork, billing, navigation]
- **Credit notes** close the gap the invoice work deliberately left: a paid invoice cannot be voided, so the correction has to be its own numbered document (`CN-YYYY-NNNN`, its own sequence) that both sides can reconcile.
- Created issued and immutable. Tax follows **the invoice's own rate**, so the credit reverses what was actually charged rather than today's default. Crediting more than remains is refused — that would turn an invoice into money owed to the client. A draft cannot be credited: void it instead.
- Outstanding is now **net of credits**; a fully credited invoice is not money anyone is waiting for.
- **A real bug the permissions invariant caught**, not a timeout: `offer:write` had no matching `offer:read`, and the offers list was gated on write — so a **hiring manager, whose entire job is approving offers, could not see them**. Added `offer:read`; reads now use it. Regression test pins it. This is the invariant test earning its place.
- **Left sidebar** replaces the horizontal nav on desktop for the employer workspace: twelve destinations had outgrown a top bar, and a rail gives each a stable position that does not reflow as labels change length. Grouped Hiring / Clients / Company; ungrouped items fall into "Workspace" so a new nav entry can never silently vanish.
- Collapse state is read with **`useSyncExternalStore`, not an effect** — localStorage is external state React does not own, and effect-then-setState triggers the cascading render the lint rule exists to prevent. Subscribing to `storage` keeps two tabs in step for free.
- The collapse control sits at the **top** of the rail: at the bottom it collided with the floating account widget.
- Mobile is untouched — the top bar and bottom nav still serve small screens, where a persistent rail costs more width than it earns.
- Verified: 31/31 billing tests · credit against a **paid** invoice 201, over-credit 409 with the remaining amount named, net 47,880 → 0 · sidebar 12 destinations in 3 groups, collapse persists across navigation, horizontal nav suppressed on desktop only.

## [2026-08-09] fix | The last failing test was a dropped socket, not a bug
attributed_to: [claude]   belongs_to: [tecxwork, testing]
- Full run: **180/181**. The single failure was `Failed query: set lock_timeout` inside `beforeEach` — the WebSocket to the remote Neon branch dropping mid-run, surfacing as a failed statement on a healthy test. (I initially read the 10.5s duration as an assertion failure; the log shows otherwise.)
- `withReconnect` now wraps the setup statements: on failure it closes the dead pool, logs, and retries **once**. That distinguishes "the connection blinked" from "the query is wrong" — a genuinely bad statement fails again immediately and still reports.
- Applied to `beforeAll` as well: a socket dropping on the first statement previously skipped an entire file (seen once — 25 tests skipped, then 25/25 on a rerun with no code change).
- This is mitigation, not a cure. The cure is the local Postgres move, still pending installation.

## [2026-08-09] note | The published manual is out of date
attributed_to: [niko]   belongs_to: [tecxwork, documentation]
- `/documentation` is linked in the site footer and no longer matches the product. Measured: **Billing, invoices, credit notes and candidate search are not covered at all**; Offers, Documents and pipeline-stage editing get passing mentions only; and **all 11 recruiter screenshots show the old horizontal nav** replaced by the sidebar.
- Regenerating means re-shooting those screens, writing five new sections, re-translating to 繁中 and Vietnamese, and rebuilding both the HTML and the PPTX from `docs/manual/src/`.
- **Decision (niko): leave it for now.** Recorded here so it is a known debt rather than a surprise.

## [2026-08-09] ingest | Fee rates — placement fees computed, not guessed
attributed_to: [niko]   belongs_to: [tecxwork, billing]
- Follows directly from "what are we charging?": the answer was **a number a human types in**, and nothing computed or checked it.
- **A half-built rate card already existed.** `clients.default_fee_pct` was in the schema *and offered in the CRM form* — and it computed nothing, was read nowhere, and was null for all 28 clients. Its flaw was conceptual: a bare "%" never said what it was a percentage *of*.
- Replaced by `fee_basis` + `fee_value`, where the basis says what the number means:
  - `months_salary` — hundredths of a month (120 = 1.2 months). The Taiwan convention, and what **every existing fee in the data already follows** (45,600 on 38,000; 40,800 on 34,000).
  - `percent_annual` — whole percent of the first year.
- `default_fee_pct` is kept rather than dropped (dropping a column is irreversible and it costs nothing), with its non-null values migrated across as `percent_annual`. Now marked superseded in the schema.
- A placement takes its fee from the client's rate **only when none was given** — an explicit fee still wins, because not every deal follows the rate. With no rate agreed, the fee stays empty: a wrong fee that looks computed is worse than a blank field.
- The audit trail records `feeSource` (`rate` | `explicit` | `none`) — *whether* the rate applied, never the amount, keeping the trail value-free.
- Rounding is to whole currency at the point of calculation: 1.15 months of 33,333 is 38,332.95, and a fee is a whole number of dollars.
- Clawback is still a manual judgement per niko's earlier decision; a schedule could now be layered on the same rate.
- Verified: 41/41 billing tests, plus live — a rate of 1.2 months on a client produced 45,600 from a 38,000 salary with no fee supplied.
- **Housekeeping:** removed three `Playwright Test Co` clients (and a dependent job order and placement) left in the demo database by an earlier verification run this session.

## [2026-08-10] fix | Defect sweep over the session's work
attributed_to: [claude]   belongs_to: [tecxwork, billing]
- Ran a targeted sweep over the thirteen features shipped this session, looking for the classes of defect most likely to hide: unguarded routes, float arithmetic on money, non-idempotent migrations, and unscoped tenant queries.
- **Clean on three of four.** No float anywhere on a money path; every migration's guards match or exceed its statements; the only two bare `requireAgency()` gates are the deliberate row-dependent cases (`documents/[id]`, `offers/[id]`) where the capability cannot be known until the row is read. Helpers taking a bare id (`creditableRemaining`, `stageOccupancy`, `activeStageCount`) are each called only after their route has already scoped by org.
- **Found: `refreshInvoiceTotals` was dead code** — written, never called. Invoice lines are only inserted at creation and flagged on void; there is no endpoint that adds or removes one, so nothing ever needs totals recomputed. Removed.
- **Found while tracing it: a voided invoice reported "0 lines".** `getBillingData` filtered lines on `voided = false`, but that flag exists so the partial unique index frees a placement to be re-billed — not to erase what the document said. An invoice that was voided still shows the lines it was raised with; its status already communicates the void. Fixed, with a regression test.
- 42/42 billing tests after the change.

## [2026-08-11] note | Yang Luck positioning decision merged — two of its five open items had shipped
attributed_to: [claude-code]   belongs_to: [yang-luck, saas-strategy]
- The 07-27 licensee-positioning decision sat unmerged for 29 commits of `demo/yang-luck`. Before merging, checked its ranked "genuinely still open" list against the branch — the strategic core held, the status list had decayed.
- **(2) Real document storage — done** (`de9fee6`). `documents` holds real bytes (opaque `storage_key` never exposed to a client, content type, size, soft delete). Notably it did **not** ship as the requested signed-URL storage: `GET /api/agency/documents/[id]` proxies the bytes so the permission check runs on every read and every read leaves an audit row, which a presigned URL would escape. Stronger answer for an audited ARC scan.
- **(4) Fee ledger — done**, "no schema exists" no longer true: `invoices`/`invoice_lines`/`credit_notes`, `clients.fee_basis`+`fee_value`, `placements.fee_amount` with a `fee_source` trail. The **RBA Employer-Pays export** half is still genuinely open and keeps its ranking.
- **(3) MOL 評鑑 — partly**: `ecd1219` exports candidates/placements/compliance as CSV, so the inputs can leave the system; no assembled evidence pack mapped to the evaluation criteria.
- **(1) Client portal and (5) recruiter-side Vietnamese — unchanged.** `member_role` has no client-facing seat (all seven roles are agency-side), and `src/messages/recruiter/` is still en + zh-TW only. Item 1 remains the ranked #1.
- The decision page's **open question on the revenue split is now half-answered** by the 08-09 fee-rate work (Taiwan side explicit; Vietnam-side component still unknown), so item 4 is gated on a narrower question than when written.
- Recorded as a dated addendum on the decision page rather than by editing the 07-27 text — a decision record should read as what was decided when it was decided.

## [2026-08-11] ops | CI, and the first lint run this repo has had
attributed_to: [claude-code]   belongs_to: [tecxwork, testing]
- Health check of `demo/yang-luck` @ `435e3a2` (82 ahead of `main`, 0 behind): build clean, typecheck clean, **192/192 tests**.
- **The local-Postgres move is done.** Ran the suite twice against a local Postgres 16 — 192/192 both times, `withReconnect` never fired. The 180/181 recorded on 08-09 was the Neon socket, as diagnosed. `withReconnect` stays for Neon-targeted runs; local is now the cure. Recipe in `topics/testing.md`.
- **There was no CI in this repository** — no `.github/` at all. Added `.github/workflows/ci.yml`: lint → schema push → build → typecheck → test, on a `postgres:16` service container.
- **Order matters and is not obvious.** `next-env.d.ts` is gitignored and emitted by `next build`, so `tsc --noEmit` on a clean checkout reports ~25 phantom `Cannot find module 'next/server'` errors. Build before typecheck. Recorded in `topics/testing.md` so the next agent doesn't chase them.
- **One real lint error, found because nothing had ever run lint:** `react-hooks/set-state-in-effect` in `src/app/pipeline/pipeline-board.tsx` — `useEffect(() => setMounted(true), [])` guarding dnd-kit against hydration. Exactly the cascade the 08-09 sidebar work avoided with `useSyncExternalStore`; this one predated it. Replaced with the same idiom already used in `theme-toggle.tsx`. `next build` does not run ESLint, which is why a build-only check never saw it.
- Deleted `src/components/job-directory.tsx` — unreferenced anywhere since the jobs page was rebuilt into `jobs-list-page.tsx`. (Its former sibling `/api/external-jobs` also has no in-app caller now; left in place, flagged not fixed.)
- Lint is now **0 errors, 37 warnings** (warnings are pre-existing `<img>`-vs-`next/image` and unused-var noise; CI fails on errors only).

## [2026-08-11] finding | PRs #4 and #5 sit on orphaned pre-rebuild history
attributed_to: [claude-code]   belongs_to: [tecxwork]
- `main`'s history was rebuilt on 2026-06-01 — its root is `6695209` ("Add admin booking time controls"), while PR #4 and PR #5 descend from the original root `4e59575` ("Initial commit from Create Next App", 2026-04-08). `git merge-base` between them returns **empty**: zero shared commits, so GitHub cannot merge either one and both diffs are computed against base commits no longer reachable from `main`.
- Both are also obsolete on the merits. #4's recruiter-jobs query already ships in `jobs-list-page.tsx` with the same `moderationStatus = "approved"` filter and more fields; #5 was the self-described "Approach A, graduate to B if valuable" prototype, and Approach B shipped here as the full ATS (`applications`, `application_stage_transitions`, `offers`, `placements`).
- Closed both with that explanation. `demo/yang-luck` shares `main`'s post-rebuild root and is unaffected.
- PR #10 (docs-only, Yang Luck licensee positioning) was open with its base 29 commits ahead of it — **since rebased, corrected and merged** (`29a713a`); see the 08-11 note above. The stakeholder page and decision record now exist on `demo/yang-luck`.

## [2026-08-11] decision | Corridor-agnostic — don't assume Vietnam supplies and Taiwan hires
attributed_to: [niko]   belongs_to: [tecxwork, saas-strategy]
- [niko]: "do not always assume the source is the Vietnam and the hiring is the Taiwan side. Just make it generic job platform." VN→TW is the **first corridor** — Yang Luck's operating reality and V-GEN TRIDENT's — not the product model.
- **Reframed the revenue-split open question** on the 07-27 decision. It was worded "Taiwan-side employer service fees vs any Vietnam-side fee component", which builds the corridor into the question so every answer inherits it. Now asked in roles: *which side of a placement carries the fee — hiring employer, supply-side partner, or both, and in what proportion.*
- **Checked rather than assumed: the live product is already generic.** `nationality` is free text with an empty default; the whole fee chain (`clients.fee_basis`/`fee_value`, `placements.fee_amount`/`fee_source`, invoices, credit notes) carries no geography; no `src/messages/` copy asserts a direction. The en/vi/zh-TW locales are a market choice, not a structural one.
- **One hardcoded exception, in dead code:** `external_jobs.is_vietnamese_job` (default true) + `isVietnameseRelatedJob()` in the 104/1111 crawlers. `external_jobs` is referenced nowhere outside the crawler and `schema.ts`, and `/api/external-jobs` has had no caller since the jobs page moved to recruiter-posted openings. Genericising dead code is wasted work — whether to delete the subsystem is now the open question.
- **Jurisdiction ≠ direction, and is deliberately NOT genericised:** the 5% 營業稅, ESA/私立就業服務機構 licensing, and ARC/work-permit tracking follow from where the operator is *licensed*, not from who supplies candidates. Any Taiwan-licensed operator needs them whatever the corridor. `months_salary` is the local convention but already sits beside `percent_annual`, so it is parameterised.
- Yang Luck's stakeholder page keeps its VN→TW description — a true fact about that client, not a claim about the platform.
- New: [decisions/2026-08-11-corridor-agnostic-positioning.md](decisions/2026-08-11-corridor-agnostic-positioning.md). Updated: the 07-27 decision's open question, index.md.

## [2026-08-11] feat | Employer-Pays fee trail + 評鑑 evidence exports (items 3 & 4)
attributed_to: [claude-code]   belongs_to: [tecxwork, billing, taiwan-compliance]
- Closes the export half of the 07-27 decision's item 4 and most of item 3, on the schema the billing work already built.
- **`GET /api/agency/export/fees`** (invoice:read) — the RBA Employer-Pays trail: one row per placement with salary, fee, **fee-in-months-of-salary** (the number auditors benchmark), client agreed rate, the invoice/credit chain and net billed. Two structural columns worded precisely: "Fee Charged To" = employer (client) — no schema path bills a candidate — and "Worker-Charged Fees Recorded" = 0, *recorded*, because the export proves what the system holds, not what happened outside it.
- **`GET /api/agency/export/evidence`** (compliance:read AND invoice:read — the pack spans both domains) — dated 評鑑 summary: placements by status, stage transitions, offers, fee/invoice/credit counts, document expiry buckets, audit-log coverage, PIPA consent among placed candidates. Aggregates only, no names; the itemised evidence is the existing detail exports.
- **New drizzle gotcha #3 recorded:** columns inside a `sql``` fragment render unqualified, so a correlated subquery in a projection silently self-compares — and passes tests when fresh serial IDs coincide. Caught only by a two-invoice attribution test; both routes now use separate grouped queries. See topics/drizzle-sql-gotchas.md.
- Verified: 9 new tests (org scoping, RBAC 403s for hiring_manager/coordinator, credit attribution, voided-line exclusion, no-PII-in-aggregates), full suite green.

## [2026-08-11] feat | Recruiter-side Vietnamese (item 5)
attributed_to: [claude-code]   belongs_to: [tecxwork, recruitment-workflows]
- `src/messages/recruiter/vi.ts` — full translation of the recruiter message tree (signup, bookings/stage review, applicant browsing, company/job form, notifications, slot picker). `RecruiterLocale` is now `en | zh-TW | vi`; `accept-language` starting `vi` resolves to it; the switcher is a mapped 3-way toggle (EN / 中 / VI) instead of two hardcoded buttons.
- Typed as `RecruiterMessages` (derived from en.ts), so a missing or extra key is a compile error, not a silent English fallback. Two local helpers in recruiter-dashboard-company.tsx had narrowed the parser's locale to `en | zh-TW`; widened — `parseLanguageRequirementTokens` itself was already trilingual.
- **Known limitation, deliberately out of scope:** the newer agency views (pipeline, clients CRM, compliance, placements, candidate search) carry their own inline `en | zh` dictionaries and map `vi → en`. Making the ATS layer trilingual is per-view translation work, not wiring. Item 5's `src/messages/recruiter/` gap is closed; the ATS-view gap is now the honest remainder.

## [2026-08-11] decision | Client portal design written (item 1) — proposed, not ratified
attributed_to: [claude-code]   belongs_to: [tecxwork, saas-strategy, taiwan-compliance]
- The ranked-#1 moat item is too large to build safely in a shared session, so the deliverable is the build-ready design: [decisions/2026-08-11-client-portal-design.md](decisions/2026-08-11-client-portal-design.md).
- Key calls made in it: a client contact is a **different species of principal**, not a member_role — separate `portal_invites`/`portal_sessions` tables, magic-link auth (agency invites, email proves, no passwords), its own cookie, every query double-scoped org+client from the session row. Phase 1 is the read-only worker permit clock — the screen that creates the switching cost; documents and invoices are phase 2; interaction is phase 3 and explicitly where scope creep lives.
- Flagged for niko before any build: ratify the auth model, confirm the PIPA basis against the actual consent text, and decide whether phase 1 must include invoices for clients to bother logging in.

## [2026-08-11] chore | External-jobs crawler removed (decision-by-PR)
attributed_to: [claude-code]   belongs_to: [tecxwork]
- The corridor-agnostic decision left one open question: whether to delete the dead external-jobs subsystem — the 104/1111 crawler, its tables, and `/api/external-jobs`, caller-less since the jobs page moved to recruiter-posted openings, and home to the only hardcoded corridor assumption in the schema (`is_vietnamese_job`).
- Removed: `src/lib/crawler/` (5 files), `/api/external-jobs` + `/api/external-jobs/crawl`, `/api/cron/crawl-jobs` (not in vercel.json crons — nothing schedules it), `external_jobs`/`crawl_logs` tables + `job_source`/crawler `job_type` enums from schema.ts, and `getCachedExternalJobs` from cache.ts (recruiter caching untouched). ~1,200 lines.
- **Prod tables are NOT dropped** — schema.ts removal never drops live tables; `external_jobs`/`crawl_logs` rows linger harmlessly in prod until someone runs a manual DROP. Recorded so nobody mistakes them for live surface.
- The merge of this PR is the decision; closing it unmerged is also a decision. Verified: build, tsc, lint, 201/201.

## [2026-08-11] feat | Manual + decks refreshed — the recorded stale-manual debt paid
attributed_to: [claude-code]   belongs_to: [platform-manual, tecxwork]
- niko asked for the manual and PPT update the 08-09 log had recorded as known debt. Act 3 grew 6 → 11 screens (candidate search, offers, placements, billing, stage editor; compliance + stored artifacts; reports + the two audit exports). All 56 screenshots re-captured showing the sidebar era; decks 43 → 48 slides × en/zh/vi; 79 new strings translated to 繁中/Tiếng Việt each.
- **The whole demo world now runs locally**: seeds/migrations made driver-switching (Neon HTTP ↔ local pg via new `seed-sql.ts`), a new `seed-yang-luck-billing.ts` scripts the billing/offers layer that had only ever been created by hand, and the capture/check Playwright tooling lost its hardcoded per-machine paths.
- **Two real bugs found by the tooling on the way:** `add-ats-compliance.ts`'s ON CONFLICT predates the partial unique index (fails on any current-schema DB — fixed); and confirmation that the applicant slot picker still keys on the hardcoded `EVENT_CONFIG.date`, not the admin row — the known-gaps bug, now with a reproduction recorded in topics/platform-manual.md.
- Verified: build.py clean, i18n 1144 keys × 3 enforced, all four checkers green (anchors/mobile-nav under Chromium — WebKit undownloadable in CCR; re-run there before calling those two fully verified). tsc + lint clean.

## [2026-08-11] incident | Prod carried an unmerged branch's schema for two months
attributed_to: [claude-code]   belongs_to: [tecxwork, neon-account-topology]
- Migrating prod ahead of fast-forwarding `main` onto the ATS codebase, `drizzle-kit push` asked ~30 create-vs-rename questions. Those questions *were* the finding: drizzle only asks when the database holds an object the schema doesn't.
- Cause: `41183dd` on `multi-tenant-exploration` (06-06) — **applied to prod, never merged anywhere**. Its own message says so: *"Applied + verified in prod … 39 memberships, 170 participants."* Left `organizations`, `events`, `event_participants`, `memberships`, `event_id` on 9 tables, and two orphan enums.
- **The hazard produced no prompt.** `memberships` exists in both schemas with different meanings (FK→`organizations` vs `orgs`; `membership_role` vs `member_role`; index order flipped). Being an existing table, drizzle would have silently ALTERed it — reshaping the ATS **access-control** table around 39 rows of unrelated event data.
- **Decision: park, don't drop.** `schemaFilter` defaults to `public`, so moving orphans to a `legacy` schema hides them from drizzle while keeping rows recoverable. Enums travel with their tables (a referenced enum can't be dropped). `event_id` dropped outright — 1 event existed, so the column held no information. Push then ran purely additive: 22 tables, no prompts. Full record: [decisions/2026-08-11-prod-schema-drift-legacy-parking.md](decisions/2026-08-11-prod-schema-drift-legacy-parking.md).
- **Rule established:** never apply a migration to prod from an unmerged branch, and treat *any* prompt from a prod `push` as a stop signal. Corollary both agents on this problem learned the hard way — the repo is not a description of production; check the database.
- `main` fast-forwarded `00646e1 → 7bc0400` afterwards. `legacy` still holds ~737 rows; `DROP SCHEMA legacy CASCADE` once the deploy is confirmed good.

## [2026-08-11] fix | Client branding removed from the public site; brand made per-deployment
attributed_to: [niko]   belongs_to: [tecxwork, design-system]
- niko: *"remove any yangluck branding i dont want to expose our customer now."* Moving `main` onto this codebase put a **client's name and logo on the public site** — the header, splash, footer, page title and several copy strings were hardcoded to Yang Luck.
- **I had this wrong twice before checking.** I told niko the branding was data (`event_config`, editable in admin settings). The visible brand was *hardcoded markup*; `getEventBranding()` is a separate, genuinely data-driven path. Both are true, which is why a partial answer looked right.
- New `src/lib/brand.ts`: one brand record per deployment, selected by `NEXT_PUBLIC_BRAND`, **defaulting to TECXWORK**. An unset or misspelled env var falls back to our own brand — a deployment can only expose a client by explicitly opting in. Yang Luck's demo keeps its branding with `NEXT_PUBLIC_BRAND=yang-luck`.
- Rewired: `brand-link`, `brand-splash`, `pwa-first-run-splash`, `site-footer`, `layout` metadata, `register`, `browse/loading`. New `brand-mark.tsx` for the header lockup — the same markup had been copy-pasted into four files, which is how a rebrand previously meant editing five and missing two. The splashes keep their own sizing/animation and read only the brand values.
- Copy restored to main's original wording (`Sign Up for TECXWORK`, etc.) across en/vi/zh-TW, and the zh-TW verified badge de-branded 揚運認證企業 → 認證企業 (en/vi already said plain "verified employer").
- **Half the fix is data and is NOT in this change.** `event_config.event_name` is `揚運 Yang Luck 人才媒合平台`, and it renders in 12 places — page title, homepage, jobs pages, legal pages, calendar invites and outbound email. Caught only by building and curling the rendered HTML; the code diff alone looked complete. Prod's row must be updated separately.
- work.tecxmate.com unparked (the #20 redirect removed) in the same change. Verified: rendered homepage serves `icon.svg` + `tecxwork`, no client logo; tsc, lint, 201/201.

## [2026-08-11] fix | Manual: language + theme controls into the rail, uncramped mobile bar
attributed_to: [niko]   belongs_to: [platform-manual, design-system]
- niko, from a phone screenshot: the mobile bar held the 目錄 toggle, the title *and* a duplicate language switcher, so the title rendered as "TECXWORK 使用手…". Move the switcher into the left panel, add a theme toggle there, stop the bar being cramped.
- The switcher existed **twice** — once in the rail, once cloned into the bar behind `.lang-switch-bar` for ≤1080px. Deleted the clone rather than shrinking it; the rail is one tap away and already held the original. Bar is now toggle + title, and the title no longer ellipsises (measured: `scrollWidth === clientWidth`).
- **The dark and light `data-theme` token blocks already existed and nothing ever set the attribute** — the manual could only follow the OS. Added an Auto/Light/Dark control beside the language switcher; `auto` removes the attribute and hands control back to `prefers-color-scheme`, so the existing media query stays the fallback rather than being replaced.
- Theme labels are real prose, so `.theme-switch button` was added to `i18n_extract.py`'s selectors and the three strings translated (自動/淺色/深色 · Tự động/Sáng/Tối). The language buttons stay untranslated on purpose — EN/繁中/VN name themselves.
- Verified in a 390px WebKit-sized viewport: bar has 2 children and an untruncated title, both controls present and visible in the drawer, Dark repaints (`rgb(20,18,22)`) and sets `aria-pressed`, Auto clears the attribute. All four checkers pass.

## [2026-08-12] feat | Admin workspace gets the recruiter workspace's left rail
attributed_to: [niko]   belongs_to: [admin-panel, design-system]
- niko: *"the admin panel also need to redesign to match the nicely done left side bar of the recruiter panel."* New `src/components/admin-sidebar.tsx`, wired beside the whole admin workspace so the rail stays put while the section changes; `hideDesktopNav` on `AppTopBar` because the bar still carries navigation on small screens.
- **Two components, not one parameterised rail** — the two differ in grouping and in capability filtering (recruiter filters by plan, admin does not), and one component threading both reads worse than two stating their own case. ~150 lines of mostly-markup each; revisit if a third workspace appears.
- The collapse preference is **shared on purpose** (`tecxwork_sidebar_collapsed`): an admin who is also a recruiter should not find one workspace collapsed and the other expanded. Moves via `useSyncExternalStore` over a `tecxwork:sidebar` event — `storage` does not fire in the tab that wrote the value.
- **An hour lost to a stale dev server.** Port 3000 was occupied, `next dev` quietly bound 3001, and the browser check kept hitting 3000 — an older server whose `.next` had been deleted, hence the flood of 500s on chunk requests. Every symptom (`aside` absent, 5 admin links still in the top bar, empty `body.firstElementChild`) said "the code is broken"; the code had worked the whole time. tsc+lint green while the browser shows nothing means the two are not looking at the same build — read the dev server's own port line and kill strays first.
- Verified: 224px expanded / 68px collapsed, preference persists across navigation, active state tracks the route, desktop top-bar admin links 0 (was 5), suppressed at 390px. tsc 0, lint 0 errors.

## [2026-08-12] fix | /documentation closed — the manual ships as a file, not a URL
attributed_to: [niko]   belongs_to: [platform-manual, data-privacy]
- niko: *"close the documentation. no more yangluck. i'll update screenshots later."* The 08-11 branding fix took Yang Luck out of the header; `/documentation` still served a manual titled "Yang Luck 揚運 build" with 51 inlined screenshots of the client's live pipeline, candidate drawer (names, nationalities), clients and invoices.
- **Dropping the `next.config.ts` rewrite would not have closed it.** The manual is a static file in `public/`, so it was already served at `/documentation.html`; the rewrite only added the prettier URL. Route and file are two exposures — both had to go.
- Generalised from that: **nothing under `public/` is private.** Also removed three `tecxwork-manual*.pptx` decks (13 MB) and three `demo/*.png` — *none of which the app linked to*, and all public anyway. The PNGs show named candidates against named clients (麗明營造, 揚運機電, 長隆人力資源); `DEMO.md` calls them pitch assets, so they moved to `docs/pitch-assets/` rather than being deleted.
- **The trap:** `build.py` wrote back into `public/`, so the next rebuild after a re-capture would have silently restored everything removed here — exposure returning as a side effect of a routine build. Both builders now emit to gitignored `docs/manual/dist/`; publishing is a deliberate copy documented in the manual README. The decks' closing slide advertised `yangluck.tecxmate.com/documentation` (now a 404, and client-branded) and no longer names a URL.
- **Not closed by this:** git history still holds all of it and the repo is public — `public/documentation.html` and `docs/manual/src/screenshots/` are readable by anyone who clones. Deleting from HEAD is not deletion; a history rewrite or a private repo is niko's call. Source screenshots kept deliberately, since the re-capture needs them.
- Verified against a dev server whose port was read from its own startup line: `/documentation`, `/documentation.html`, all three `.pptx` and `/demo/*.png` all 404; `/tutorial` still 200; "documentation" appears 0 times in the served HTML. tsc 0, lint 0 errors.

## [2026-08-12] feat | /how-it-works — the employer/agency explainer
attributed_to: [niko]   belongs_to: [tecxwork, design-system]
- niko: *"this needs a landing page explain beautifully how it works."* Scoped to a new `/how-it-works` route for **employers and agencies**. `/documentation` had just been closed, taking with it the only end-to-end explanation; `/about` is positioning and `/tutorial` is a reference manual.
- Argues mechanism, not features: append-only stage history, double-billing blocked by a **database constraint** rather than app code, no silent gaps in invoice numbering, integer money, renewals that supersede. Centrepiece is a hand-authored inline SVG carrying the one claim prose makes slowly — **one application creates two records** (the employer's booking, over in an afternoon; the agency's pipeline card, alive for weeks).
- **Five tempting claims that are false, found by surveying the code first** — worth remembering, the next person will reach for the same ones: AI screening (`ai_score` is a mocked demo badge, "not real inference"); the client portal (`status: proposed`, no tables); "click Export for your RBA pack" (fees/evidence are **API-only, no UI button**); "30 days before expiry" (dashboard 30d / CSV 60d / evidence 90d disagree); 30-minute slots (configurable, default **15** — the manual is wrong); plans and tiers (no subscription concept exists).
- The Employer-Pays section **states its own limitation on the page**: worker-charged fees are reported as *recorded* zero, which proves the system holds no such fee — no path in the data model from a fee to a candidate — and is not the claim that no cash moved outside it. An auditor handed the wider claim would rightly distrust the rest of the pack.
- Corridor-agnostic per 08-11 (employer side / supply side / candidate). **`/about` still contradicts it** — "connecting Vietnamese students in Taiwan" — flagged for niko rather than silently rewritten from inside an unrelated page.
- **Gap: English only.** Consistent with `/about` and `/privacy-policy`, but the audience is Taiwanese agencies and the recruiter workspace is bilingual EN/繁中, so 繁中 is the obvious next step. Copy sits in top-of-file arrays so translating is mechanical.
- Verified: 200; no horizontal overflow at 1440/390/dark; SVG themes via CSS custom properties in both modes from one copy of the markup; body line length capped at 64ch after measuring 914px on the first pass. Added to sitemap (0.8) and the footer. tsc 0, lint 0 errors.

## [2026-08-12] fix | /how-it-works rewritten in plain language
attributed_to: [niko]   belongs_to: [tecxwork, design-system]
- niko: *"write in simple direct language. try to see how cake resume do it."* The first draft was literary — *"A placement is a paper trail that happens to involve people"*, *"What holds when nobody is watching"* — and read as advertising to an audience that wants to be told plainly.
- Cake (cake.me, the Taiwan incumbent) writes short benefit-first sentences in second person, with headings that name the thing: Job Posting, Resume Search, Employer Branding. **Both cake.me and cakeresume.com are blocked by the container's egress proxy**, so the pattern came from search results rather than the pages themselves.
- Headings are now *The five steps*, *Your records stay correct*, *Control who sees what*, *Ready for an inspection*, *Works in any hiring corridor*, *Try it with one real job*. Shorter sentences, contractions, "you" throughout. **No claim changed — only the wording.**
- **Two JSX traps, both invisible to tsc and lint, both caught only by grepping the rendered HTML:** (1) `&rsquo;` inside the data arrays is *not* markup — those strings render through `{step.body}`, so React escapes them and the page literally shows `haven&rsquo;t`; entities work in JSX, not in JS strings. (2) JSX dropped the space after `</em>` mid-sentence, rendering "soon andwe are still" — needs an explicit `{" "}`.

## [2026-08-12] feat | Brand, notifications and account move into the workspace rail
attributed_to: [niko]   belongs_to: [design-system, recruiter-dashboard, admin-panel]
- niko: *"Move the account settings into the lower left corner into the collapsible sidebar. show the company name not only recruiter. tecxwork Logo should also be on the bar... Notification put it on... on top of the account settings. this is very standard layout of SaaS workspace."*
- Brand lockup now heads the rail (wordmark expanded, logo only collapsed); notifications and the account block sit at its foot, notifications above. **The desktop top bar is removed entirely** (`hideOnDesktop`, `lg:hidden`) — with those three moved out it was an empty strip. Below `lg` there is no rail, so the bar keeps everything; same breakpoint both ways, so the two can never both be absent.
- **The company is the primary line, the role secondary.** "Recruiter" tells someone what they can do, which they know; the corner should answer *which account am I acting in*. Admin has no company, so it names the platform (`BRAND.displayName`) with "Administrator" beneath.
- `NotificationBell` gained a third variant (`rail`) rather than a parallel component — it owns polling, mark-read and the unread count, and a copy would have duplicated all of it. The panel anchors upward and to the right: the trigger is at the bottom of a 4rem–14rem column, so downward opens off-screen and left-aligned gets clipped to the rail.
- **Closing the account menu on collapse is derived, not an effect.** `useEffect(() => setOpen(false), [collapsed])` trips `react-hooks/set-state-in-effect`; instead the state stores *which rail width the menu was opened against* and `open` is `openedWith === collapsed`. One render, no effect.
- `SidebarBrand`/`SidebarFooter` are shared by both rails; only the nav grouping stays per-workspace.
- **Local-env gotcha:** rebuilding the demo environment needs `DATABASE_URL` **and** `JWT_SECRET`. With only the first, push and seed succeed and pages render, but every login 500s — which reads as broken auth rather than a missing var. `drizzle.config.ts` also reads `process.env.DATABASE_URL` directly and does not load `.env.local`, so push needs it on the command line.
- Verified against a seeded local DB: 224px/68px, brand and account degrade correctly when collapsed, desktop bar hidden in both workspaces, 390px keeps the bar with no rail and no horizontal scroll. tsc 0, lint 0 errors.

## [2026-08-12] fix | Mobile nav pill scrolls horizontally; active-pill bug fixed
attributed_to: [niko]   belongs_to: [design-system, recruiter-dashboard]
- niko: *"since you cannot show all these button on four tab of 1 floating pill, you can make the item inside the pill horizontally scrollable?"* The pill was a grid of `repeat(items.length, minmax(0,1fr))` — fine at four, about **30px per tab at twelve**, and the fallback dropped *every* label the moment one did not fit.
- Now a flex row with `overflow-x: auto`, items `grow shrink-0`: four still spread across the pill, twelve take their label's width and scroll. That retires the icon-only fallback and its machinery — a ResizeObserver, an orientation listener, a hidden measuring span per item and a Set of hrefs, all dead once labels always fit.
- Scroll starts at the left, not centred: `justify-center` on an overflowing flex row pushes the first items past the scroll origin where no gesture reaches them.
- The active tab now scrolls itself into view (jump on first paint, glide after), and the indicator is measured in **content coordinates** (`+ container.scrollLeft`) since it is absolutely positioned inside the scroll container and travels with the tabs.
- **Pre-existing bug this surfaced: the active pill never rendered on a cold load, in any role.** `mounted` gates the component behind a rAF, so the first pass returns `null` — and the measuring effects, keyed `[measure, items.length]`, ran against refs that did not exist yet and never ran again. It only appeared after a client-side navigation changed `measure`'s identity. Adding `mounted` to the deps fixes it. **Shape worth remembering: an effect that reads refs, in a component with a mount gate, needs the gate in its deps** — otherwise it runs exactly once, when there is nothing to read. Caught only because the new scroll-into-view failed identically and the probe printed `directSpans: 0`.
- Verified at 390px: agency 12 tabs all labelled and scrolling (863/364) with Billing centred at `scrollLeft` 442; guest 4 tabs filling the pill and not scrolling; indicator within 1px of the active tab in every case, including after scrolling by hand. tsc 0, lint 0 errors.

## [2026-08-13] fix | Homepage no longer lists jobs publicly
attributed_to: [niko]   belongs_to: [public-homepage, data-privacy]
- niko: *"Turn off the public facing job listing on both homepage of work.tecxmate.com and yangluck.tecxmate.com."* Both domains deploy the same code, so one change covers both.
- Removed the `#jobs` section (74 lines) and the `getPublicJobs()` query that fed it — no point paying for a query nothing renders.
- **That alone was not enough, twice over.** First: the company cards on the homepage each listed up to three vacancy titles under "Open Positions" — a job listing by any reading. Gated behind a new `showPositions` prop on `RecruiterCard`, off on the homepage, left on in `/browse` where the question being asked *is* "who is hiring".
- **Second, and the one worth remembering: hiding the badges in JSX did not remove the data.** `RecruiterCard` is a client component, so everything handed to it is serialised into the RSC payload — every vacancy title was still sitting in view-source with the badges gone. Confirmed by grepping the served HTML, not the rendered text. Fixed by stripping `positions` server-side in `getPublicRecruiters()` before the objects cross the boundary. **Hiding a client component's props hides pixels, not data.**
- Verified: job titles appear **zero** times in the homepage HTML source (all six `positions` arrays serialise as `[]`); companies still render; no layout break or horizontal scroll at 1440px or 390px. `/browse` untouched. tsc 0, lint 0 errors.
- **Still public and deliberately untouched:** the `/jobs` page itself, the "Jobs" tab in the guest nav, and the hero's "Find Jobs" button. The ask named the homepage; unpublishing `/jobs` is a larger call with SEO and candidate-flow consequences, and is niko's to make.

## [2026-08-13] fix | Login reported server faults as "network error"
attributed_to: [niko]   belongs_to: [tecxwork, data-privacy]
- niko, unable to sign in to the Yang Luck demo: *"how do I get login on Yang Luck now it's say a network error"*. The message was lying.
- `const data = await res.json()` ran **before** the `res.ok` check. A route handler that throws — missing `JWT_SECRET`, a database that will not connect — returns Next's **HTML** error page, so `.json()` threw, landed in the outer `catch`, and rendered `messages.login.networkError`. A server fault was reported as the user's connection, which sends them to check their wifi while the problem is a missing env var.
- Now parses defensively: body parsed in its own try, `!res.ok || !data` handled, and anything 5xx (or an unparseable body) reports **`serverError` with the status code** — "the server could not complete the request (error 500). This is not your connection." Naming the number is what makes it searchable. A 200 with no `user` is also treated as a fault rather than routing to `/browse` looking signed out.
- **Reproduced end to end**: removed `JWT_SECRET` locally → endpoint 500 → form previously said "Network error", now says "error 500". Restored it → login lands on `/dashboard/interviews`. Strings added in en/vi/zh-TW.
- **The same `await res.json()`-before-`res.ok` pattern exists in ~9 other files** (register, forgot-password, profile, feedback, the recruiter and admin dashboards). Not touched here — flagged for a follow-up sweep.

## [2026-08-12] ingest | Agent-connector & SaaS readiness audit
attributed_to: [niko, claude-code]   belongs_to: [tecxwork, saas-strategy]
- niko: expose connectors to Claude the way Apollo.io and Buffer do; how far from full SaaS, and what does connector-readiness take? Audit only — nothing implemented, nothing decided.
- **Already there (the expensive half):** real `orgs`/`memberships` tenancy, capability RBAC (7 roles × 15 capabilities) enforced through the single `requireAgency(capability)` gate, `audit_log.actor_type` already accepting non-human actors, per-operation Zod schemas that convert straight to MCP tool schemas, and erasure-aware candidate search.
- **The hard blocker:** there is no machine auth anywhere. Every route resolves identity from the `vgen_session` cookie; the only bearer token in the codebase is `CRON_SECRET`. A connector cannot hold a cookie.
- **Also missing:** `getAgencyCrm`/`getPipelineBoard` read the session internally (no injectable actor); `insert(orgs)` exists only in tests, so tenancy is hand-provisioned, not self-serve; no subscription layer (`billing.ts` is placement-fee invoicing, i.e. product not monetization); per-IP non-atomic rate limiting, wrong shape for bursty agents; single-org-per-user; no versioned/public API or webhooks.
- **Path recorded in dependency order:** actor decoupling → API keys → `/api/mcp` Streamable HTTP → OAuth 2.1 + dynamic client registration (what Apollo/Buffer actually ship) → self-serve + billing. Two safety rules written down for Phase 2: no MCP tool ever takes `orgId` as a parameter, and no destructive/financial tool in v1.
- **Left open for niko:** the PIPA basis for streaming candidate PII to a model provider, API-keys-first vs wait-for-OAuth, and whether self-serve is actually wanted given Yang Luck is a hand-provisioned named client.
- created topics/agent-connectors.md; updated index.md

## [2026-08-12] feat | SaaS tenancy + commercial model — orgs can now be created, priced and suspended
attributed_to: [niko, claude-code]   belongs_to: [tecxwork, saas-strategy, agent-connectors]
- niko redirected: tackle commercial + multi-tenant BEFORE connectors. Connectors on a hand-provisioned deployment monetise nothing.
- **Four decisions taken** (see decisions/2026-08-12-saas-tenancy-and-commercial-model.md): per-seat tiers; NO payment processor (Taiwan B2B needs 統一發票, which Stripe cannot issue — entitlement columns + offline invoicing is the honest build at this customer count); sales-led provisioning; subdomain per tenant.
- **The leverage move:** `CAPABILITY_FEATURE` in the new `lib/plans.ts` maps each existing capability to a plan feature, so the one gate derives entitlement from the capability a route already declares. All 84 routes gained plan enforcement with **zero route edits**.
- **Shipped:** `orgs` commercial columns + `org_invites` (the table that finally gives `insert(memberships)` a caller — it had none outside tests); `proxy.ts` (Next 16 renamed Middleware→Proxy) resolving Host→`x-tenant-slug` and always overwriting it so the header cannot be spoofed; `lib/tenant-host.ts` (pure, framework-free) + `lib/tenant.ts`; `lib/provisioning.ts` (createOrg seeds a default pipeline, SHA-256-only invite tokens, seat accounting that counts pending invites); platform + tenant APIs; `event_config.org_id` with a `coalesce(org_id, 0)` unique index.
- **`agency-auth.ts` gate order is now tenant → commercial state → plan → role**, deliberately: "suspended", "not on your plan" and "not your job" send people to three different people.
- **Backward compatible:** no tenant in the host ⇒ the caller's own membership stands. 201 pre-existing tests passed unchanged; suite now **246 passed**, lint 0 errors, build clean, 4 static routes still static.
- **Accepted trade-offs recorded:** seat checks are not atomic (commercial limit, not a security boundary); existing tenants backfilled to growth/20 seats rather than a 3-seat trial that would have locked their team out; migration verified idempotent against a rebuilt pre-migration DB, and the platform-default singleton guard verified by a rejected duplicate insert.
- **Still open:** wildcard DNS + `PLATFORM_ROOT_DOMAIN`, no platform-admin UI (API-only), invitation emails not sent, multi-org-per-user (`getMember` still `limit(1)`), and the PIPA basis for connectors.
- **Near-miss worth recording:** `src/proxy.ts` already existed (it holds the role-based route guards for /admin, /dashboard, /profile, /applicant) and was overwritten wholesale when tenant resolution was added. Nothing caught it — build passed, all 201 tests passed, because NO test covered proxy redirects. Caught by reading `git status` and seeing `M` where `A` was expected. Guards restored verbatim and merged with tenant resolution (broad matcher for the header, prefix checks inside for the guards so the JWT is only verified where needed), and `src/test/proxy.test.ts` now covers both — including that a client-supplied `x-tenant-slug` is overwritten rather than trusted.
- created decisions/2026-08-12-saas-tenancy-and-commercial-model.md; updated index.md, topics/agent-connectors.md

## [2026-08-12] feat | Onboarding loop closed — invite email, accept page, platform console
attributed_to: [niko, claude-code]   belongs_to: [tecxwork, saas-strategy]
- Provisioning shipped earlier the same day but a customer could still only be onboarded with `curl`. This closes the loop end to end: provision → invite → email → accept → member.
- **Invite email** (`sendOrgInviteEmail` + `buildInviteUrl`): the link points at the tenant's OWN subdomain so the invitee lands on the workspace they are joining. The raw token is returned in the API response **only when the send failed** — a mail outage should not force a revoke-and-re-invite that burns a seat round trip.
- **`/invite` landing page** deliberately reveals nothing before acceptance — not the invited address, not the role, not whether the token is even real. The token travels in a URL (browser history, referrer headers), so confirming "yes, valid for finance@client.com" would leak workspace membership to anyone holding a stale link.
- **`/admin/workspaces`** — platform console: provision, change plan, adjust contracted seats, suspend, reactivate. Built standalone rather than as a section of the 4,007-line `admin-dashboard.tsx`; running an event and deciding which customers exist are different axes.
- **`?next=` on login** — an invitation must survive the sign-in round trip. Login had no `next` support, so the invite page would have sent people to a dead end. Added `lib/safe-redirect.ts`: rejects other origins, `//evil.example` (which a naive `startsWith("/")` allows — the usual way this bug ships), the `/\` variant, and control characters. Checked by code point rather than regex, because a literal control character inside a character class is invisible in a diff.
- Verified: 263 tests pass (was 255), lint 0 errors, build clean, `/invite` + `/admin/workspaces` + the three invite APIs all in the route manifest.
- **Still open:** no members screen inside a workspace (invite API exists, no UI listing current members/roles); wildcard DNS + `PLATFORM_ROOT_DOMAIN` unset; multi-org-per-user; the PIPA question.
- updated decisions/2026-08-12-saas-tenancy-and-commercial-model.md

## [2026-08-12] feat | Team management — the workspace can now run its own people
attributed_to: [niko, claude-code]   belongs_to: [tecxwork, saas-strategy]
- Last gap before the product can be handed to a customer: the invite API existed but no screen listed who was in a workspace, so a tenant admin was calling `/api/org/invites` by hand.
- Added `lib/members.ts` (actor-free, same discipline as `provisioning.ts`), `/api/org/members` (GET list / PATCH role / DELETE member), and a **Team** tab in the recruiter dashboard gated on `member:invite` — the nav already supports per-capability tabs, so it hides itself for everyone else and the page re-checks server-side.
- **Two guards matter more than the UI.** (1) The **last administrator** cannot be demoted or removed: a workspace with no admin cannot invite, cannot change roles and cannot recover on its own, and the click that causes it looks entirely ordinary. (2) Removing someone **unlinks the recruiter row from the org but keeps the row** — a departure is not an erasure, so their jobs/candidates/placements stay with the workspace; without the unlink, leaving would permanently strand the account because a later invitation elsewhere is refused as "already belongs to another workspace". Both are tested, including that a removed person can then join a different workspace.
- Seat budget is stated at the top of the screen rather than only surfacing as an error when an invitation is refused; the invite button disables at zero seats. When the invite email fails, the UI shows the fallback link the API returns — which is what makes that fallback worth having.
- Verified: 272 tests (was 263), lint 0 errors, build clean, `/dashboard/team` + `/api/org/members` in the manifest.
- **Still open:** per-tenant branding UI (schema + reader are tenant-scoped, the admin editor still writes the platform-default row); wildcard DNS + `PLATFORM_ROOT_DOMAIN`; multi-org-per-user; the PIPA question.
- updated decisions/2026-08-12-saas-tenancy-and-commercial-model.md

## [2026-08-12] note | Merge of main into the SaaS branch — two branding mechanisms now collide
attributed_to: [claude-code]   belongs_to: [tecxwork, saas-strategy, design-system]
- `main` moved while PR #23 was open (PR #21, per-deployment branding). Merged in; the only textual conflict was this log — both sides appended, resolved chronologically (main's 08-11 entry precedes the 08-12 ones, per the append-only newest-at-bottom rule).
- **Semantic finding, no code conflict:** the visible brand is now chosen **per deployment** by `NEXT_PUBLIC_BRAND` from a closed union of `BrandKey`s, while `event_config` (event name, tagline, organiser, imagery) is now **per tenant** by subdomain. Subdomain tenancy exists so many tenants share ONE deployment, and a build-time env var cannot vary per subdomain — so onboarding a customer who wants their own logo currently needs a new `BrandKey`, a code change and a redeploy.
- Not urgent (the default is TECXWORK, so nothing leaks) and deliberately **not** unpicked here — PR #21 shipped two days ago and the resolution is niko's call. Likely shape recorded in the decision page: `brand.ts` becomes the fallback for single-tenant deployments, per-tenant brand fields resolve from the host.
- Verified after merge: 272 tests, lint 0 errors, build clean.
- updated decisions/2026-08-12-saas-tenancy-and-commercial-model.md

## [2026-08-12] note | Handoff written for Codex — and a correction on the migration target
attributed_to: [claude-code]   belongs_to: [tecxwork, saas-strategy]
- niko asked for a handoff to Codex, which has local repo + database access that this remote session does not. Written to `docs/handoff-codex.md`.
- **Correction recorded.** I had told niko to run `db:update:saas-tenancy` against production. While writing the handoff I found that **21 migration scripts refuse prod hosts** (`delicate-lab`/`bitter-hill`) with "Use the demo DB" — including `add-ats-tenancy.ts`, the script that *created* `orgs`/`memberships`/`audit_log`. So the ATS schema may exist only on the demo database and production may never have had `orgs` at all.
- Consequences if so: `add-saas-tenancy.ts` fails at its first `ALTER TABLE orgs` (not destructive — statements run singly outside a transaction, so only the preceding `CREATE TYPE` lands, and re-running is idempotent); and more importantly the agency layer would **already** be broken on prod's current `main`, meaning prod serves only the public/event side. Unverified from here — no production credentials in this container.
- Handoff leads with this as the thing to settle before running anything (`\d orgs` decides it), then covers Neon topology (incl. the MCP being authed to the wrong Neon account), migration/test conventions, the `brand.ts` collision, the proxy near-miss as a generalisable lesson, and the open-work order ending at connectors.
- `add-saas-tenancy.ts` deliberately has **no** prod guard, unlike the other 21 — it is the one migration meant to be runnable against a live DB. Recorded so nobody "fixes" that inconsistency without deciding the above.
- created docs/handoff-codex.md

## [2026-08-12] feat | PR #23 merged — and branding made deploy-order-independent
attributed_to: [niko, claude-code]   belongs_to: [tecxwork, saas-strategy]
- niko: "merge it". I had held the merge pending `db:update:saas-tenancy`; niko reaffirmed, so merged. **The migration is still outstanding** and agency routes read columns that do not exist until it runs.
- Second merge of `main` in a day (PRs #24–#30 landed: recruiter rail, sidebar account, mobile nav scroll, how-it-works, homepage jobs hidden, documentation route closed). Two conflicts: `log.md` (both appended — resolved chronologically) and `login/page.tsx`, which was **substantive** — main added defensive JSON parsing plus a `!data.user` malformed-response guard while this branch added `?next=` support. Both kept; the guard now runs before the redirect.
- Verified the Team tab survived main's nav-into-rail refactor: `DashboardSidebar` calls the same `visibleNavItems(role, isAgency, capabilities)`, so the `member:invite`-gated entry flows through unchanged. All four wiring points in `recruiter-dashboard.tsx` intact.
- **Made `getEventBranding` survive a pre-migration database.** The tenant-scoped read hard-depended on `event_config.org_id`; without it every query failed and the whole public site fell back to hardcoded `EVENT_CONFIG`, losing the admin-controlled event name, dates and imagery. Now catches Postgres `42703` (undefined_column) **only** — a genuinely broken query still surfaces — and falls back to the unscoped read. Deploy order no longer matters for the public site.
- Proved it rather than asserting it: `src/test/event-branding-premigration.test.ts` drops the column, inserts a config row via raw SQL (drizzle would name the dropped column), asserts the DB value is served rather than the static default, and restores the column in `afterAll`.
- Verified: 273 tests (was 272), lint 0 errors, build clean, schema restored after the DDL-mutating test.

## [2026-08-14] fix | One expiry window; /about no longer assumes a corridor
attributed_to: [niko]   belongs_to: [taiwan-compliance, public-homepage]
- niko: *"fix this — the 30/60/90-day expiry mismatch and /about's corridor contradiction."* Both had been flagged on 08-12 and left for him to call.
- **The mismatch was a real bug, and the code said so itself.** `export/compliance/route.ts` declared `const EXPIRING_SOON_DAYS = 60` directly under a comment reading *"Matches the dashboard's definition of 'needs attention'"* — the dashboard used 30. A permit was "expiring" on screen and "valid" in the spreadsheet handed to an inspector.
- The window existed as a bare `30` in **three** further files (`agency-crm`, `candidate-search`, `placement-lifecycle`), each rebuilding the same midnight-UTC cutoff by hand. Now one `src/lib/compliance-window.ts` exporting `EXPIRING_SOON_DAYS = 30` and a `complianceWindow()` helper returning `{today, cutoff}` together — separately computed bounds are how they drift.
- **The 90 was left alone, deliberately.** The evidence pack reports a count under a row labelled "Expiring within 90 days": a stated reporting horizon for the 評鑑, not an operational alert. It now has its own named `EVALUATION_HORIZON_DAYS`, and the row label is built from the constant so the number and the words cannot diverge.
- `/about` rewritten to the corridor-agnostic framing: three parties, no assumed countries, jurisdiction following the operator's licence. **The VSATW / V-GEN TRIDENT history stays** — the 08-11 decision says VN→TW is the first corridor *not the model*, so deleting the origin story would have been the opposite mistake; it is now worded as "the first corridor it ran, not the shape of the product".
- Verified: **201/201 tests pass** (agency-crm, candidate-search, placement-lifecycle and evidence-exports all directly cover this), tsc 0, lint 0 errors, `/about` renders 200 with no corridor language left.

## [2026-08-14] feat | Workspace home + activation checklist — a new tenant now has a way in
attributed_to: [niko, claude-code]   belongs_to: [tecxwork, saas-strategy]
- niko: "continue to make this a durable SaaS. and polished like Lark, Apollo.io, ClickUp". PR #23 merged first (36cceda).
- **The gap this closes:** provisioning could create a workspace, but a new tenant landed on `/dashboard/interviews` — an empty table with no indication of what to do. The product was reachable and not enterable. That is the most visible distance from the products niko named.
- New `src/lib/activation.ts` (actor-free, takes an orgId): six setup steps **derived from the data**, never from a stored `onboarding_completed` flag. A flag drifts — it reads done after someone deletes their only client, and pending for every tenant provisioned by hand before the feature existed. Deriving costs six counting queries issued in one `Promise.all` and is always true; there is a test that deletes a client and watches the step untick.
- **Steps are filtered by plan, and the denominator shrinks with them.** "Record a placement" is not a task a starter customer is failing — counting it would put 100% out of reach.
- **Trial state reuses the gate's own `isTrialExpired`**, so the banner and the refusal cannot disagree. A workspace reading "3 days left" while every request is refused is worse than either message alone.
- Checklist retires itself at 100%, so an established workspace stops seeing it every morning; home then carries plan, seats, trial, and a compliance-attention card (expired or inside 60 days).
- `/dashboard` now forwards to `/dashboard/home`, which redirects client-company recruiters straight on to interviews — one entry point, agency-only content. Login and the proxy's signed-in redirect follow the same path; the proxy test was updated with it.
- Verified: 284 tests (was 273), lint 0 errors, build clean.

## [2026-08-14] feat | Empty states — and a compliance screen that was quietly reassuring
attributed_to: [claude-code]   belongs_to: [tecxwork, design-system]
- Continuing the "polished like Lark/Apollo/ClickUp" pass. New shared `src/components/empty-state.tsx`; wired into the two agency screens that rendered bare tables (clients, compliance). Takes strings rather than i18n keys, so the copy lives beside the rest of each screen's `T` record instead of a second place that can drift.
- **Real bug found, not just cosmetics:** the compliance screen showed **"All valid"** whenever nothing needed attention — including when **zero documents had ever been filed**. A brand-new workspace was told its compliance was fine. `compliance.total` was already on the payload and simply unused; the empty tracker is now its own state ("No documents filed yet" + Add document), and "All valid" is reserved for the case where documents exist and none is expiring. This is the one screen that must never sound confident about paperwork nobody has seen.
- Copy written in both zh and en to match the existing per-view convention.
- Verified: 284 tests, lint 0 errors, build clean.

## [2026-08-14] fix | 404 page, and a pipeline empty state that named the wrong problem
attributed_to: [claude-code]   belongs_to: [tecxwork, design-system]
- **`src/app/not-found.tsx` added.** `error.tsx` and `global-error.tsx` already existed, so a page that *threw* was handled while a page that simply did not exist fell through to Next's unbranded default. The two now read the same way: say what happened, don't blame the person, offer somewhere to go. `/dashboard` is deliberately not offered — a signed-out visitor would hit a second dead end at the login redirect.
- **Second instance of the same bug class as the compliance one.** The pipeline board rendered "No candidates in the pipeline yet" whenever `pipelineBoard.jobs.length === 0` — the condition is *no job openings*, not *no candidates*. A new workspace was told to find candidates when what it needed was an opening to put them in. Now names the actual state and links to Post an opening.
- Both are the same failure: a message describing a state the code was not actually testing, which sends people to the wrong fix. Worth watching for elsewhere.
- Pre-existing lint warnings in `recruiter-dashboard.tsx` (3 unused lucide imports left by main's rail refactor) confirmed present on main and deliberately left — cleaning them would churn work someone else may still have in flight.
- Verified: 284 tests, lint 0 errors, build clean, `/_not-found` in the route manifest.

## [2026-08-14] feat | `npm run db:doctor` — the migration question is now one command
attributed_to: [claude-code]   belongs_to: [tecxwork, saas-strategy]
- I had twice told niko the migration blocker was unresolvable from this session (no production credentials) and twice asked someone else to answer it. Better to make answering it trivial than to keep asking.
- `src/lib/db/doctor.ts` + `npm run db:doctor`: **strictly read-only** — every statement is a SELECT against `information_schema` or a COUNT — so it is safe to point at production, which is the whole point. Prints the **host only**, never the connection string, and flags when the host looks like a prod one.
- Reports: which of the 8 core ATS tables exist; whether each saas-tenancy column is present; org/membership/invite counts; `event_config` rows including how many are platform-default (warns above 1); then a **verdict** naming the next step.
- Three verdicts, each **verified against a real database** rather than reasoned about: fully migrated (`tecxwork_test`) → "Ready"; ATS present with columns dropped (`unmigrated_check`) → "tenancy migration outstanding, run db:update:saas-tenancy"; ATS entirely absent (`no_ats_check`) → "the agency product cannot run here … agency routes are already failing on current main, independently of this work."
- That third verdict is the one that matters: it is the hypothesis raised by 21 migration scripts refusing prod, and it is now checkable in ten seconds instead of being an open question blocking a deploy.
- `docs/handoff-codex.md` updated to lead with the command instead of `\d orgs`.

## [2026-08-16] refactor | Actor decoupling — the data layer stops reading the request
attributed_to: [niko, claude-code]   belongs_to: [tecxwork, agent-connectors]
- niko picked this over polish. It is Phase 0 of the connector path recorded in `topics/agent-connectors.md`, and the reason the rest of that path is now reachable.
- `getAgencyCrm()` and `getPipelineBoard()` each read the session cookie, resolved the recruiter, and only then did their real work — callable from exactly one place (a browser request) and untestable without mocking `next/headers`.
- New `src/lib/actor.ts`: a `RecruiterActor` value plus `resolveRecruiterActor()`, now **the only session-reading function in the data path**. `getPipelineBoard(actor)` takes it; `getAgencyCrm(orgId)` takes just the org, matching the convention already set by `provisioning.ts` and `members.ts`. `source: "session" | "token"` is on the actor so an audit row can record *how* a caller authenticated, not only who they were.
- The four call sites now resolve the actor at the edge and pass it down. In the three agency pages the CRM fetch moved out of the `Promise.all` and after the actor guard — deliberately sequenced, because the org is the tenant boundary and has to be established before anything is read.
- **Tests assert the actual property:** every case runs after `clearSession()`. Before the refactor each call returned null on its first line for want of a cookie. One test also pins the tenant boundary — `getAgencyCrm(mine)` cannot see another org's clients.
- **Two domain facts the tests taught me**, both worth recording because both look like bugs: the board returns null when an org has **no job openings** (not "no candidates" — the same mislabel fixed in the UI earlier), and for an agency actor it lists openings belonging to **client-company** recruiters in the same org, excluding the agency's own (`ne(clientKind, "agency")`) — an agency places *into* clients.
- Verified: 288 tests (was 284), lint 0 errors, build clean.

## [2026-08-16] feat | Audit trail becomes readable — `audit:read`, `/dashboard/audit`
attributed_to: [niko, claude-code]   belongs_to: [tecxwork, taiwan-compliance, data-privacy]
- `audit_log` has been written on every mutation since the ATS tenancy migration and read by **nothing**. A trail nobody can open is not a control, it is storage — and for a product whose moat is the compliance clock, "who moved this candidate, and when" is part of what is being sold.
- New capability **`audit:read`, held by `admin` and `viewer` and by nobody in between.** Oversight, not operations: letting the people being audited read the audit is how a trail stops being one. A viewer's documented job is reporting and oversight, and this grants no candidate access — the table stores field NAMES and metadata, never values.
- `src/lib/audit-log.ts` (actor-free, takes an orgId): filters by action, record type, actor and date; distinct filter options are drawn from the org's own history so a new action appears in the dropdown the first time it is recorded. **Left join to `users`, not inner** — a cron or system actor has no user row, and those are the entries an inspection asks about most.
- `/api/org/audit` is **GET only, deliberately**. `audit_log` has no update or delete path anywhere in the codebase and this route does not add one: an audit editable through the API that writes it is not evidence.
- Tests assert the properties, not the plumbing: the matrix AND the route both refuse a recruiter; entries are org-scoped; system-actor rows survive; pagination has no overlap (id tiebreak in the ordering); and a serialised event containing the field name `email` contains no `@` — the property that makes it safe to show a viewer.
- Verified: 297 tests (was 288), lint 0 errors, build clean; `/dashboard/audit` + `/api/org/audit` in the manifest.

## [2026-08-16] feat | Machine auth — `api_keys` and a bearer path through the one gate
attributed_to: [niko, claude-code]   belongs_to: [tecxwork, agent-connectors]
- The blocker named in the original connector audit — "there is no machine auth anywhere; the only bearer token in the codebase is `CRON_SECRET`" — is closed. This is Phase 1 of the recorded path; only the MCP transport and OAuth remain.
- **A key borrows a person's authority rather than standing alone** (`owner_user_id`), narrowed by its own scopes. That choice is the whole design: every ownership rule, capability check and audit row keeps working unchanged, and "who did this" still names a human. A standalone robot identity would have needed a second authorisation path beside the human one — the kind of door that outlives the reason it was cut.
- **Scopes are intersected at REQUEST time, not creation time.** Demote the owner and the key narrows with them; remove their membership and it stops working. Otherwise a key is a way to keep authority you have formally lost. Both are tested (`admin` → `coordinator` drops `invoice:write` but keeps `candidate:read`; deleting the membership returns null).
- The org is re-read per request, so a **suspended tenant or a lapsed trial refuses machine traffic exactly as it refuses a browser**, and `api_access` (a `scale`-plan feature declared back in the plans work) is the monetisation hook — both tested.
- **Wired through `headers()` rather than by taking the request as an argument**, so all 84 existing agency routes gained machine access with no signature change. Both paths converge on the same `AgencyActor`, which is what stops "can a token do this?" becoming a second, divergent authorisation story.
- Only the SHA-256 is stored; `prefix` is kept in clear so a list identifies a key without the secret. Every resolution failure returns one message — distinguishing "unknown" from "revoked" tells an attacker whether they guessed a real key.
- Minting is gated on `member:invite`: letting something that is not a person act inside the workspace is an administrative decision of the same weight as adding a colleague.
- Migration `db:update:api-keys` (additive, idempotent); `api_keys` added to the test truncate list.
- Verified: 309 tests (was 297), lint 0 errors, build clean.
- **Not done:** no UI to mint a key yet (API only), and per-key rate limiting still rides the per-IP, non-atomic limiter — recorded in the audit as needing an atomic store before real agent traffic.
