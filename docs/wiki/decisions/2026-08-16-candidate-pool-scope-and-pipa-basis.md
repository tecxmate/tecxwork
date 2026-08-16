---
title: The candidate pool is org-scoped, and AI matching needs its own consent
type: decision
slug: 2026-08-16-candidate-pool-scope-and-pipa-basis
date: 2026-08-16
updated: 2026-08-16
attributed_to: [niko]
belongs_to: [tecxwork, agent-connectors, data-privacy]
source: chat
status: accepted
tags: [pipa, multi-tenancy, candidates, privacy, connectors, consent]
related: [agent-connectors, 2026-08-16-oauth-for-connectors, data-privacy]
---

## Two questions, both answered

Raised as open items after the connector work. niko settled both.

### 1. The candidate pool is scoped to the workspace

`searchCandidates()` carried **no org filter at all**. Any agency holding `candidate:read`
searched every other agency's candidates, and the export route handed the same set out as a
CSV.

This was not always wrong. With one agency, platform-wide *was* that agency's own pool.
Multi-tenancy — the model chosen on 2026-08-12 — turned it into a cross-tenant PII leak. The
page above it had been claiming the correct behaviour all along:

> The candidate pool is the agency's own asset and is full of PII.

The comment was right. The code never implemented it.

**The rule:** a workspace sees its own worked pipeline — anyone who applied to one of its
jobs — **plus the unclaimed pool**, meaning self-registered candidates no workspace has
picked up yet. Once a candidate applies to Agency A, Agency B stops seeing them.

niko chose this over strict per-org isolation, and the reason is commercial rather than
technical: the public signup funnel is what agencies are paying for. Under strict isolation a
student who registers is invisible to every agency until someone happens to apply on their
behalf, which makes the funnel worthless to the customers funding it. Sourcing survives;
reading a competitor's worked pipeline does not.

A legacy application with a null `org_id` claims nobody. Those rows predate multi-tenancy, so
attributing them would be a guess — and leaving them unclaimed means the existing
single-agency deployment sees exactly what it sees today.

### 2. AI-assisted matching needs its own consent

The question was what lawful basis under PIPA covers sending candidate data to a connector.
The answer is that **the existing consent does not**, and the honest response is to ask
separately rather than to reinterpret.

The signup wording, identical in meaning across all three languages, is:

> visible to **recruiters** for this recruitment event

That covers an agency's staff reading a profile to place someone. It does not cover a
third-party model provider, usually outside Taiwan — a different purpose, a different
recipient, and in practice an international transmission. A consent is exactly as wide as its
words.

So `ai_assisted_matching` is a **separate, optional checkbox** at signup, with its own
plain-language wording in English, Chinese and Vietnamese that says what it means: the profile
may be sent to an AI service provider and processed outside Taiwan, and declining changes
nothing about being found normally.

`search_candidates` is gated twice — the `candidate:read` capability *and* that purpose. It
returns nothing until candidates opt in, which is the mechanism working rather than a defect,
and the connector docs say so plainly so it is not mistaken for a broken tool.

Contact details are withheld even from consented rows. Consent to being *matched* by an
assistant is not consent to having an email and phone number read out by one, and an agent
that can name a candidate can look them up in the workspace to reach them.

## Three things this turned up

- **Two more leaks in the same function.** Facet counts were computed over the whole table, so
  the filter chips disclosed the size and shape of every competitor's pipeline without showing
  a name. And `appliedTo` listed job titles from any org, so a candidate worked by two
  agencies exposed the other's open roles — through the one field whose purpose is to stop
  *this* agency re-sourcing someone.
- **A near-miss.** The signup path never stamped `consent_purpose`; only the Phase 5 backfill
  did. A strict basis check would have hidden **every candidate registered since that
  migration**. `hasLawfulBasis` reads a null purpose as the recruitment consent — which is
  what the backfill's own `COALESCE` already assumed, and what the form actually showed — while
  a null never resolves to the AI purpose. Signup now stamps consent, purpose and an
  18-month retention date directly.
- **A Drizzle trap.** `= ANY(${array})` in a `sql` template binds the array as a single
  parameter and Postgres rejects it as a malformed array literal. `inArray` over the
  `coalesce` expression is the correct spelling.

## Where it lives

`src/lib/pipa.ts` holds both rules, in one file on purpose: the moment "may we show this
candidate?" is answered in three places, two of them drift, and the one that drifts is the one
nobody is looking at when a customer is audited. The in-memory and SQL forms are asserted
against each other across every consent combination, because a silent disagreement would
always resolve in favour of the SQL one.
