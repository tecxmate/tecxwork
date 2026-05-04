# LLM Wiki — Master Plan

A pattern for building a persistent, LLM-curated knowledge base for a software project. This file is **both** the abstract pattern (copy-paste to new projects) and the concrete schema this project uses.

> **Origin.** The abstract pattern is adapted from the public "LLM Wiki" idea (RAG → persistent compounding wiki). The concrete schema, stakeholder tagging, and agent workflow below were instantiated for this project; copy them into a new project and adjust the entity taxonomy to fit.

---

## Part 1 — The pattern (portable, copy-paste)

Most LLM+document setups look like RAG: chunks are retrieved at query time and the LLM rediscovers the knowledge from scratch on every question. Nothing accumulates.

This wiki is different: the LLM **incrementally builds and maintains a persistent wiki** — a structured, interlinked collection of markdown files between you and the raw sources/conversations. Every chat that produces a decision, a stakeholder input, or a new fact gets folded into the wiki. The cross-references are already there; the contradictions are flagged; the synthesis already reflects everything.

You curate sources, ask questions, and direct the analysis. The LLM does the bookkeeping.

**Three layers:**

- **Raw sources** — chat transcripts, documents, screenshots, external messages, code. Immutable; the LLM reads but does not modify.
- **The wiki** (`docs/wiki/`) — LLM-generated markdown. Decisions, entities (people/orgs), topics, an index, a log.
- **The schema** — this file plus the wiki rules in `AGENTS.md`. Tells every LLM agent how to maintain the wiki.

**Three operations:**

- **Ingest** — every meaningful turn (decision, scope change, stakeholder input, bug-fix rationale, environment quirk) is folded into the wiki: log entry + page create/update + index update.
- **Query** — read `index.md` first, then drill into pages. File good answers back into `topics/` so explorations compound.
- **Lint** — periodically flag contradictions, stale claims, orphan pages, missing entities, and gaps to fill.

---

## Part 2 — Concrete project schema

### Directory layout

```
docs/wiki/
├── llm-wiki-guide.md         # this file (schema + portable pattern)
├── index.md                  # catalog of every wiki page (one-liners)
├── log.md                    # append-only chronological log
├── entities/                 # one page per stakeholder (person, team, org, agent)
│   └── <slug>.md
├── decisions/                # decision records (one per decision)
│   └── YYYY-MM-DD-<slug>.md
└── topics/                   # feature / area / concept pages
    └── <slug>.md
```

### Page frontmatter

Every page in `entities/`, `decisions/`, `topics/` starts with YAML frontmatter so the LLM and tooling can reason about provenance and ownership.

```yaml
---
title: <human title>
type: entity | decision | topic
slug: <kebab-case>
date: YYYY-MM-DD               # creation or decision date
updated: YYYY-MM-DD             # last meaningful update
attributed_to: [<entity-slug>]  # who said / proposed / authored this
belongs_to: [<entity-slug>]     # whose domain / responsibility this is
source: chat | meeting | email | slack | document | code | observation
status: active | superseded | proposed | rejected
tags: [<short-tag>, ...]
related: [<page-slug>, ...]
---
```

Notes:
- `attributed_to` and `belongs_to` reference entity slugs in `entities/`. If the entity doesn't exist yet, create the page in the same turn.
- Multiple values are allowed (mixed teams, joint decisions, shared ownership).
- For decisions arising from a chat, `attributed_to` is the person who proposed it; `source: chat` is fine — link the conversation date in the body.

### Stakeholder taxonomy (entity types)

Organize `entities/` by role, not just by name. Every entity page has a `role` field:

- `owner` — the project owner / decision maker (this is usually "you" in a 1:1 with the agent).
- `internal` — internal team members.
- `client` — paying or sponsoring stakeholder.
- `external` — outside collaborators, advisors, vendors.
- `agent` — LLM agents (Claude Code, GPT-4, sub-agents). One entity per agent identity.
- `automation` — bots / CI / hooks that produce input.

Each entity page captures: role, contact (if relevant), areas of responsibility, and a running list of contributions (linked decisions/topics).

### Decision record template

```markdown
---
title: <decision title>
type: decision
slug: <YYYY-MM-DD-slug>
date: YYYY-MM-DD
attributed_to: [<who-proposed>]
belongs_to: [<area-or-team>]
source: chat
status: active
tags: [<area>]
related: [<topic-slugs>]
---

## Context
What was happening and why this came up.

## Decision
The decision itself, in one paragraph.

## Rationale
Why we picked this over alternatives. Cite stakeholder input with `[entity-slug]` tags.

## Consequences
What changes in the codebase / process / commitments.

## Provenance
- Discussed on YYYY-MM-DD between [entity-slug] (owner) and [entity-slug] (agent).
- Implementing commits: `<hash>`, `<hash>`.
```

### Topic page template

```markdown
---
title: <topic title>
type: topic
slug: <slug>
date: YYYY-MM-DD
updated: YYYY-MM-DD
belongs_to: [<area-or-team>]
source: synthesis
status: active
tags: [<area>]
related: [<decision-or-topic-slugs>]
---

## Summary
One-paragraph overview.

## Current state
What exists today (point to code paths, schema fields, etc.).

## Open questions
What's unresolved.

## History
Bulleted list of changes with dates and links to decision pages.
```

### `index.md`

A flat catalog grouped by section (`Entities`, `Decisions`, `Topics`). One line per page: `- [Title](path) — one-line hook (tags)`. Update on every page create or rename.

### `log.md`

Append-only, chronological. Each entry uses a fixed prefix so it's grep-able:

```
## [YYYY-MM-DD] <kind> | <subject>
attributed_to: [<entity-slug>]   belongs_to: [<entity-slug>]
- bullet of what happened
- link(s) to created/updated pages
```

`<kind>` is one of: `ingest`, `decision`, `chat`, `lint`, `external`. Keep entries to <10 lines.

Quick recent log: `grep "^## \[" docs/wiki/log.md | tail -10`.

---

## Part 3 — Agent workflow (every meaningful turn)

When acting as the agent in a session for this project:

1. **Recognize a wiki-worthy turn.** Anything that fits one of these is wiki-worthy:
   - A design decision (now or in the past, surfaced for the first time).
   - A scope change, deferral, or commitment to an external party.
   - A bug whose root cause or fix rationale isn't obvious from the diff.
   - Stakeholder input (client, internal, external) that constrains future work.
   - An environment / infra quirk that future-you would re-learn.
   - A clarification of who owns or decides something.

2. **Identify the entities.** Who proposed it (`attributed_to`)? Whose domain is it (`belongs_to`)? If the entity doesn't have a page, create one first.

3. **Write or update the page.** Decision pages are usually new. Topic and entity pages are usually updates. Keep prose tight — the wiki is a reference, not an essay.

4. **Update `index.md`** if a page was created or renamed.

5. **Append to `log.md`** with the standard prefix.

6. **Cite in commits when relevant.** When a commit implements a documented decision, reference the decision slug in the commit body (`see docs/wiki/decisions/<slug>.md`).

When a turn is not wiki-worthy (trivial typo fix, request for status, throw-away exploration), skip the wiki and just answer.

---

## Part 4 — Linting (periodic)

Trigger when the user says "lint the wiki" or whenever you notice rot. Checklist:

- Pages with `status: superseded` should be linked from the page that replaced them.
- Decisions older than 90 days with `status: active` — confirm still active or mark superseded.
- Orphan pages (no inbound links). Either link them in or archive.
- Entities with no contributions in 6+ months — keep but consider archiving.
- Contradictions between pages — flag in `log.md` under `lint`.
- Missing entities (any `attributed_to`/`belongs_to` slug that has no entity page).

---

## Part 5 — Portability

To copy this pattern to another project:

1. Copy `docs/wiki/llm-wiki-guide.md` (this file) and the empty skeleton (`index.md`, `log.md`, empty `entities/`, `decisions/`, `topics/`).
2. Copy the `BEGIN:project-wiki-rules` block from `AGENTS.md` (or your equivalent agent-rules file).
3. Replace the stakeholder taxonomy in **Part 2** with the new project's roles. Keep the `attributed_to`/`belongs_to` convention — it's the load-bearing part.
4. Seed `entities/` with the people and agents you expect to interact with the project.

Everything else (templates, log format, frontmatter) is intentionally generic. Adjust as needed; document changes here so future agents follow them.
