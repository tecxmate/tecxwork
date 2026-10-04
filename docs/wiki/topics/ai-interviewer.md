---
title: AI screening interviewer
type: topic
slug: ai-interviewer
date: 2026-09-21
updated: 2026-09-21
attributed_to: [claude-code]
belongs_to: [tecxwork, yang-luck]
source: code
status: active
tags: [ats, screening, ai, anthropic, anti-cheat, pipa, demo]
related: [2026-09-21-ai-screening-interviewer, recruitment-workflows, data-privacy, taiwan-compliance, architecture-overview]
---

## What it is

A text-only AI interviewer that screens an applicant against one job opening and
hands the recruiter evidence rather than an impression. Demo scope: no voice, no
video. Built 2026-09-21 on [niko]'s brief.

The recruiter opens a candidate in the Pipeline drawer, presses **Create
interview link**, and sends the candidate a `/interview/<token>` URL. The
candidate needs no account. Twelve questions later the report lands back on the
same application, next to the human scorecards.

## Where the code is

| Piece | Path |
|---|---|
| Client-safe types + the consent disclosures | `src/lib/interview/types.ts` |
| Integrity scoring (deterministic, model-free) | `src/lib/interview/telemetry.ts` |
| Claim ledger (which claim to re-probe, and when) | `src/lib/interview/claims.ts` |
| Writing-register drift | `src/lib/interview/register.ts` |
| Interviewer doctrine and prompts | `src/lib/interview/prompts.ts` |
| The three Claude calls | `src/lib/interview/engine.ts` |
| DB glue, the candidate allow-list, grading | `src/lib/interview/service.ts` |
| Candidate UI + telemetry capture | `src/app/interview/[token]/` |
| Recruiter report | `src/components/ai-interview-panel.tsx` |
| Tables | `ai_interviews`, `ai_interview_turns` |

`npm run db:update:ai-interviews` applies the schema. `ANTHROPIC_API_KEY` is
required; without it every route answers 503 and the panel says so rather than
failing open.

Model is `claude-opus-5` throughout. Planning and grading run at `high` effort,
the per-turn call at `medium` — the per-turn call is the one on the candidate's
clock, and the follow-up has to arrive while their answer is still warm. Both are
env-overridable (`INTERVIEW_EFFORT_OFFLINE`, `INTERVIEW_EFFORT_TURN`).

## The problem it is actually solving

[niko], 2026-09-21:

> Many people have made interview bots before, but also the applicants can outsmart
> it by many ways such as opening a new website or a new AI to counter that in real
> time. Even if we do TTS very quickly, they might have another TTS on their side to
> listen to everything and help them answer just reading the script. So probably
> need to get more creative with the questions and answers.

That reframes the product. The interesting problem is not scoring an answer — it
is that a generic question has a generic answer, and a language model on a second
screen produces a better one than the candidate would. Voice does not fix it; a
TTS relay is the same attack with more latency, which is why the demo staying
text-only costs nothing.

The answer is not detection. It is **asking questions whose answers require
something the helper does not have.** Four things qualify:

1. **The CV.** The helper has not read it. Every question is built from this
   candidate's own fields — named employers, dates, numbers, systems.
2. **The earlier transcript.** The helper has no memory of this conversation.
   Pasting enough of it to answer a consistency probe means pasting the whole
   thing, every turn, against a clock.
3. **A constraint we invented thirty seconds ago** and stated only here.
4. **The candidate's own judgement about their own past mistake.**

See the decision page for the mechanisms that follow from this, and for the
honest limits of the telemetry.

## The boundary that matters most

`lookingFor` (what a good answer contains), `plantedError` (the detail a
false-premise question deliberately gets wrong) and the claim ledger are stored
on every turn and are **recruiter-only**. Any of them reaching the candidate
turns the interview into an open-book exercise that still produces a confident
score — worse than no screening at all, because the recruiter still believes the
number.

So the candidate-facing shape is an explicit allow-list — `publicQuestion()` in
`service.ts` — and every candidate route returns it. A field added to `Probe`
later is invisible to the candidate until somebody adds it to that function on
purpose. `src/test/interview-ledger.test.ts` asserts the allow-list drops
unknown fields.

## PIPA / 個資法 posture

- Consent is an explicit `{ consent: true }` field, not an implied consequence of
  opening the URL. The typing measurements are personal data and "they loaded the
  page" is not agreement to collect them.
- The disclosure list the candidate actually saw is stored on the row
  (`consent_disclosures`), so changing the wording later cannot rewrite what a
  past candidate agreed to.
- Telemetry is counts and durations only. Never which keys were pressed, never
  clipboard contents, and nothing outside the page — a web page cannot see
  another tab, and the code does not pretend otherwise. What it can see is that
  this tab stopped being visible, which is the honest version of the question.
- The consent screen shows the candidate's first name only. The link may be
  forwarded or screenshotted, and a full name before consent is PII given away
  for nothing.
- `/interview/<token>` is `noindex, nofollow` and renders nothing on the server.
- Issuing a link and reading a report are both written to `audit_log`; the token
  itself never is.

## Unlawful-question guardrails

The doctrine forbids age, marital status, pregnancy, religion, health,
disability, ethnicity and family plans — unlawful in Taiwanese hiring under
就業服務法 — and forbids asking for a national ID, ARC number, bank details or
home address. The grader is told separately not to weigh any of it even if the
candidate volunteers it, because a candidate who mentions a child in passing must
not have it scored.

## Known gaps

- Nothing verifies the CV against a document; the interview tests internal
  consistency and specificity, which is a different claim.
- A candidate who takes the interview on a phone will trip `keystroke_deficit`
  and `away_from_page` more often than one on a laptop. The damping in
  `buildIntegrityReport` softens it; it does not remove it.
- The final answer grades inline (up to ~180s). `GET /api/applications/:id/ai-interview`
  re-grades an interview that finished without a report, which is the timeout net.
- There is no recruiter-side control over the competency list yet; the model
  derives it from the JD on every interview, so two interviews for the same job
  may not be scored on identical axes.
