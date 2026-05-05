---
title: CV sharing hint — "Anyone with the link" instead of per-recruiter share
type: decision
slug: 2026-05-05-cv-anyone-with-link
date: 2026-05-05
attributed_to: [niko]
belongs_to: [recruitment-workflows, data-privacy]
source: chat
status: active
tags: [student-ux, cv, google-drive]
related: [recruitment-workflows, data-privacy]
---

## Context
Student booking form requires a Google Drive CV link on each application. The previous on-form hint (`cvShareOnly`) instructed students to share the file privately with the recruiter's email. Recruiters cannot browse student CVs proactively — they only see a CV after the student applies. Niko flagged that the per-application private-share step is friction: students often skip it, recruiters hit "request access" on the link, and interview chances drop.

## Decision
Change the on-form hint to instruct students to set the Drive link to **"Anyone with the link" (Viewer)** so recruiters can open the CV immediately without an access request. Updated in `en`, `vi`, `zh-TW` student message bundles. No change to the apply-only visibility model on the recruiter side.

## Rationale
- Removes the access-request failure mode that silently kills applications.
- The link itself is still only revealed at apply time, so DN-side gating ("no browsing CVs") is preserved.
- Drive share-link URLs are unguessable in practice; the marginal exposure risk is low compared to the application-drop-off risk.
- Alternatives considered: (a) keep both options in the hint, (b) move to direct upload on the platform (Vercel Blob). Both deferred — option 1 is a one-line copy change with the highest ROI for current event.

## Consequences
- Student-side hint copy updated in three locales.
- PIPA/consent text unchanged (sharing scope is still student-initiated).
- Future work may revisit direct upload if link-leak incidents occur.

## Provenance
- Discussed 2026-05-05 between [niko] (owner) and [claude-code] (agent).
- Files touched: `src/messages/student/en.ts`, `src/messages/student/vi.ts`, `src/messages/student/zh-TW.ts`.
