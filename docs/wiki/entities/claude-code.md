---
title: Claude Code (Opus 4.7, 1M context)
type: entity
slug: claude-code
role: agent
date: 2026-05-04
updated: 2026-05-04
source: chat
status: active
tags: [agent, llm]
related: []
---

## Role
Primary engineering agent for this repository. Implements changes, audits time-related and other latent bugs, and maintains this wiki per `AGENTS.md`.

## Operating notes
- Reads `AGENTS.md` and `docs/wiki/llm-wiki-guide.md` at the start of each session.
- Commits with `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.
- Defers to Niko on scope decisions; pushes back on overcomplication per the global Karpathy-style guidelines.
