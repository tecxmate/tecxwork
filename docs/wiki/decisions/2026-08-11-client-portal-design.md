---
title: Client portal — design for the compliance clock in the client's hands
type: decision
slug: 2026-08-11-client-portal-design
date: 2026-08-11
updated: 2026-08-11
attributed_to: [claude-code]
belongs_to: [tecxwork, saas-strategy, taiwan-compliance]
source: observation
status: proposed
tags: [design, client-portal, auth, compliance, moat]
related: [2026-07-27-yang-luck-licensee-positioning, taiwan-compliance, recruitment-workflows]
---

## Why this document exists

The 07-27 positioning decision ranks the client portal #1: *"lock-in only materialises when
factory HR logs in and sees their own workers' permit expiries."* It is also the one item too
large to build safely in a single session — a rushed auth surface on a production-deploying
branch is negative value. This is the build-ready design, so the next session starts with
decisions made instead of research. **Status: proposed — niko has not ratified it.**

## The principal problem (why this is not "another role")

Everything in the agency dashboard authenticates a **member of the org** — `memberships`
carries the role, `getAgencyActor()` is the gate, and every capability in `permissions.ts`
is an agency-side seat. A client contact is a different species of principal: they belong to
a `clients` row, not to the org; they must see one client's slice and nothing else; and they
never signed up, so they have no password.

Do **not** model them as a `member_role`. A `hiring_manager` membership already exists for
client-side people the agency chooses to seat *inside* the org (they judge candidates). The
portal principal is outside the org. Mixing the two would give every portal query two
scoping regimes through one gate — the exact ambiguity `getAgencyActor` exists to prevent.

## Auth: magic link, no passwords

Contacts already exist (`contacts`: orgId, clientId, name, email, isPrimary). They were
entered by the agency, which is the trust anchor: **the agency invites, the email proves.**

New tables:

```
portal_invites   id, org_id, client_id, contact_id, token_hash (unique), expires_at,
                 used_at, created_by_user_id, created_at
portal_sessions  id (opaque, like sessions.id), contact_id, org_id, client_id,
                 created_at, expires_at, revoked_at
```

- Agency user with a new `portal:manage` capability (admin, account_manager) sends an invite
  from the client page. Token is random 256-bit, **stored hashed** (same posture as
  password-reset codes), 7-day expiry, single use.
- Clicking the link creates a `portal_sessions` row and sets a **separate cookie**
  (`portal_session`, httpOnly, SameSite=Lax) — never the recruiter JWT. Session 30 days,
  sliding. Revocation is a row update, same revocable-session model the 08-09 auth work
  established for users.
- Login page = "enter your email, we send a fresh link" against contacts with a used invite.
  No passwords ever; nothing to phish, reset, or store.
- Rate-limit by email and IP with the existing `auth` bucket; audit-log every issue and use.

The guard mirrors the agency one:

```ts
requirePortalContact(): { contactId, clientId, orgId } | 401
```

Every portal query is scoped `WHERE org_id = ? AND client_id = ?` — both, always, from the
session row, never from request input. The permissions test suite gets a portal section
asserting a portal session cannot reach another client's rows in the same org (the invariant
that matters most).

## Surface, in build order

**Phase 1 — the compliance clock (read-only, the moat itself):**
- My workers: placements at this client (candidate name, position, start date, status).
- Per worker: ARC / work-permit expiry status from `compliance_documents` — the same
  expired / ≤90 days / valid buckets the agency sees. This is the screen that creates the
  switching cost; everything else is furniture around it.
- Document *bytes* stay behind the agency's proxied route in phase 1. A portal-scoped
  download route (permission check + audit row per read, PIPA position confirmed) is
  phase 2 — the expiry date is the hook, the scan is the escalation.

**Phase 2 — money and documents:**
- Their invoices (`invoices` are already client-scoped): number, status, total, outstanding
  net of credits. Read-only; no payment rails.
- Portal-scoped document download with per-read audit.

**Phase 3 — interaction (only if 1–2 prove used):**
- View their job orders and submission pipeline; comment/request slots. This is where the
  portal starts replacing email, and where scope creep lives — do not start here.

## PIPA position (needs confirmation before phase 1 ships)

The portal shows a client the personal data of workers **placed with that client** — names
and permit status. Basis: performance of the placement contract; the client is the employer
and already lawfully holds this data on paper. That is defensible but **must be confirmed
against the consent text candidates sign** (and recorded here) before launch. Data shown is
the minimum for the compliance function: no CV, no contact details, no other candidates.

## Explicitly not in this design

- Client self-registration (the agency invites; the directory is the product's spine).
- A client-side mobile app, notifications, or SLA dashboards.
- Any write path to compliance or billing data from the portal.
- Genericising the agency dashboard's inline bilingual views first — the portal ships
  trilingual from day one instead (its messages are new files; no legacy to convert).

## Estimate and test surface

Schema (2 tables + 1 capability) ≈ small; invite/login/session routes ≈ the
password-reset surface in size; phase-1 pages are two read-only views over existing
queries re-scoped by client. The test load is the point: invite single-use/expiry,
session revocation, cross-client isolation, cross-org isolation, and the RBAC of
`portal:manage`. Comparable to the offers feature (85303cf) — one focused session with
the suite green throughout, not a side quest.

## Open for niko

1. Ratify the auth model (magic link, agency-invited, no passwords).
2. Confirm the PIPA basis paragraph against the actual consent text.
3. Phase 1 scope: is the worker list + permit clock the right minimum, or must invoices
   (phase 2) ship with it for Yang Luck's clients to log in at all?
