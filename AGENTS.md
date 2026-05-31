<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-wiki-rules -->
# Project wiki — single source of truth

This repo maintains a persistent, LLM-curated wiki at `docs/wiki/`. It captures decisions, stakeholder context, feature notes, and external input across chats — anything we don't want to re-derive on each session.

**You (the agent) own the wiki.** On every meaningful turn — design decisions, scope changes, bug-fix rationales, stakeholder input, environment quirks — you must:

1. Read `docs/wiki/llm-wiki-guide.md` for the schema and frontmatter conventions before writing.
2. Append a one-line entry to `docs/wiki/log.md` with the standard prefix (see guide).
3. Create or update the relevant page(s) under `docs/wiki/decisions/`, `docs/wiki/stakeholders/`, or `docs/wiki/topics/` with proper frontmatter (`attributed_to`, `belongs_to`, `source`, `date`).
4. Update `docs/wiki/index.md` if you added a new page.

**Stakeholders are things that can make decisions** — people, teams, organizations, regulators, LLM agents. They live in `docs/wiki/stakeholders/`. **Topics** (areas of the codebase, products, events, syntheses) live in `docs/wiki/topics/` and don't make decisions. **Tag every claim** with `attributed_to` (must be a stakeholder slug) and `belongs_to` (stakeholder or topic slug). If a referenced stakeholder is missing, create the page in the same turn.

Don't ask permission to maintain the wiki — treat it like committing code. If the user explicitly says "don't write to the wiki," skip it for that turn only.
<!-- END:project-wiki-rules -->

## Imported Claude Cowork project instructions

This is Vietnam-Taiwan Job Platform. You will help with business-related tasks
