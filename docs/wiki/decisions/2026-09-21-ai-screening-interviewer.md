---
title: The AI interviewer defeats coaching by asking what the coach cannot answer, not by detecting it
type: decision
slug: 2026-09-21-ai-screening-interviewer
date: 2026-09-21
updated: 2026-09-21
attributed_to: [niko, claude-code]
belongs_to: [ai-interviewer, tecxwork]
source: chat
status: active
tags: [ats, screening, ai, anti-cheat, anthropic, pipa, demo]
related: [ai-interviewer, recruitment-workflows, data-privacy, taiwan-compliance]
---

## Context

[niko], 2026-09-21, asked for a text-only AI interviewer in tecxwork that decides
whether an applicant suits a job description, is strict, and examines them
against their CV — "make sure they r not lying" — and then named the part that
makes it a real problem:

> Many people have made interview bots before, but also the applicants can outsmart
> it by many ways such as opening a new website or a new AI to counter that in real
> time. Even if we do TTS very quickly, they might have another TTS on their side to
> listen to everything and help them answer just reading the script. So probably
> need to get more creative with the questions and answers.

He is right that this is the whole problem, and right that voice does not solve
it. A TTS relay is the same attack with more latency. That is the argument for
the demo staying text: the interesting work is identical, and the voice layer
would only have made the shortfall harder to see.

## The decision

**Treat coaching as an information problem, not a detection problem.**

A detection-first design ends up ranking candidates by how suspicious their
typing looked, which punishes a phone keyboard and a Vietnamese input method more
reliably than it catches anyone. So detection is the last line here, not the
first. The first line is that the question itself is unanswerable without
something the helper does not have:

| The helper lacks | The mechanism |
|---|---|
| The CV | Every question is built from this candidate's own fields. A generic question is banned outright in the doctrine — "tell me about a time you showed leadership" is the most machine-answerable question in the genre |
| The earlier transcript | A **claim ledger**: each assertion is logged, then re-probed from a new angle 5+ turns later. Answering needs the whole conversation, re-pasted, every turn, against a clock |
| A constraint we just invented | Micro-scenarios with invented, deliberately awkward numbers (17 operators, 3.4% scrap), and constraint-recall questions that depend on something the interviewer said four questions ago |
| The candidate's own judgement | Self-critique: "what part of your answer to Q6 would you take back?" |

Three supporting mechanisms:

- **Short word caps, enforced in code.** 25–60 words for a drill. Not brevity for
  its own sake: an honest answer to "one number and the assumption under it"
  takes fifteen seconds, while a relayed one still has to be read, trimmed and
  retyped. It also makes length informative, because verbosity is the one habit a
  language model will not drop when told to. The cap is clamped in `clampProbe()`
  rather than left to the model, so a persuasive candidate cannot talk the
  interviewer into a generous one.
- **Number, basis, witness, plus one concrete checkable detail** on every claim.
  Invented specifics collapse on the third part.
- **A visible per-question clock**, with the follow-up firing the instant they
  submit. This detects nothing; it makes every other cheat cost more time than it
  buys.

**False premises, bounded.** The interviewer may state a plausible-but-wrong
detail — "in the Oracle WMS rollout you led…" when the CV says SAP and says they
were a user — at most twice, never before question four, and only from a discrete
field the candidate wrote themselves. Two, because the technique works by being
unexpected: a candidate who has met three stops trusting the interviewer and
hedges everything, destroying the signal in every *other* question.

**Telemetry is a flag for a human, never a verdict.** Time to first keystroke,
typing cadence, paste events, tab-hidden time, and a sustained-rate measure. Each
signal states the measurement, not a conclusion, and the caveat travels with the
score so it cannot be quoted without it. The thresholds carry the human baseline
they were set from (a fast typist composing in a second language runs 6–7
chars/s; 13 sustained is not composition).

**The verdict ladder escalates on the second high-severity flag, not the first.**
One flag means "read that question", which a recruiter can act on. Calling a
whole interview unreliable on one event would fire on every candidate who pasted
a term they had looked up, and a verdict that fires constantly is one nobody
reads.

## Why deterministic, not model-scored, for the integrity half

`telemetry.ts`, `claims.ts` and `register.ts` are pure functions with no model in
them. Two reasons. An integrity flag a model produced could not be explained to a
candidate who disputes it, and bookkeeping a model does is bookkeeping nobody can
audit — if the ledger's "which claim is due" logic drifts, the interview quietly
stops checking anything and the report still looks the same. The model writes the
question; code decides which claim it is about.

## What this deliberately does not claim

It does not verify anything against a document. It tests internal consistency and
specificity, which is a different and weaker claim, and the report says so. The
recommendation is always paired with `followUpForHuman` — what a person should
press on next — because the bot is a filter and a human decides. The grader is
told not to touch the composition measurements at all, so a slow connection
cannot read as a character finding.

## Consequences

- New tables `ai_interviews` / `ai_interview_turns`; `npm run db:update:ai-interviews`.
- New dependency `@anthropic-ai/sdk`, and `ANTHROPIC_API_KEY` in the environment.
  Absent, every route answers 503 and the recruiter panel says the interviewer is
  not configured — it never falls open.
- `applications.ai_score`, until now a seeded placeholder for the demo badge, is
  overwritten by a real fit score when an interview completes. The kanban badge
  now means something on those rows and not on others.
- First AI provider in this repo. Anthropic, `claude-opus-5`, chosen by [niko]
  over mirroring tecxmate's OpenAI chatbot: the adversarial reasoning — holding a
  claim ledger across twelve turns and spotting evasion — is the hard part, and
  it is the part the model does rather than the code.
