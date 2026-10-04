# todo

Open items, newest section first. Tick a box when it is done rather than deleting
the line — a done item with its reason still reads as the record of a decision.

## Database indexes

Found 2026-09-22 while measuring dashboard round trips. Reproduce with:

```sql
-- foreign keys with no index whose leading column is that key
SELECT c.conrelid::regclass, a.attname
FROM pg_constraint c
JOIN unnest(c.conkey) WITH ORDINALITY k(attnum, ord) ON true
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
WHERE c.contype = 'f'
  AND NOT EXISTS (SELECT 1 FROM pg_index i
                  WHERE i.indrelid = c.conrelid AND (i.indkey::int2[])[0] = k.attnum);
```

- [x] **`memberships(user_id)`** — done, in this change. It is the one that could not
      wait: `getMember()` asks "which org is this user in" before any ATS route does
      its own work, and `unique_org_member` cannot answer it because `user_id` is that
      index's *second* column. Everything else below can.

- [ ] **Decide the other 29 against production row counts.** Postgres does not index
      foreign keys automatically; this schema has **65 unindexed FK columns, 30 of
      which a dashboard page load actually filters on** — mostly the tenant-scoping
      columns (`org_id` on `applications`, `clients`, `job_orders`, `placements`,
      `submissions`, `job_openings`; `client_id` on `invoices`, `job_orders`,
      `placements`).

      Deliberately **not** done blind. At demo volume (36 candidates) Postgres
      correctly seq-scans all of them, so nothing here can be measured on the seed
      data, and 30 new indexes is real write amplification on tables the ATS writes
      to on every stage move. Pull the row counts from production first, index the
      tables that are actually large, and measure with `EXPLAIN (ANALYZE, BUFFERS)`
      rather than by counting missing indexes.

## AI screening interviewer

Shipped 2026-09-21 (PR #36). Background: [`docs/wiki/topics/ai-interviewer.md`](docs/wiki/topics/ai-interviewer.md).

- [ ] **Set `ANTHROPIC_API_KEY` in Vercel** — Settings → Environment Variables,
      scoped to **Production** and **Preview**. Nothing about the interviewer works
      without it: every route answers 503 and the recruiter panel says the
      interviewer is not configured. It does not fail open, and it does not break
      anything else in the app, so an unset key is a feature that is simply absent
      rather than a broken deploy.

      Check a deployment in one request — `503` means the key is missing, `401`
      means it is set and the route is just rejecting an unauthenticated call:

      ```bash
      curl -s -o /dev/null -w "%{http_code}\n" -X POST \
        https://<deployment>/api/ai-interviews \
        -H "Content-Type: application/json" -d '{"applicationId":0}'
      ```

- [ ] **Run `npm run db:update:ai-interviews`** against each database that needs it
      (demo and production are separate). CI's `drizzle-kit push` covers the test
      branch only.

- [ ] **Take one interview end to end on a preview deploy.** Nothing in this feature
      has been exercised against the live model — CI proves it compiles, migrates
      and passes its unit tests, not that an interview reads well. Two things to
      watch specifically: whether the false-premise probes land as a natural
      misreading of the file or as obvious trick questions, and whether the word
      caps are tight enough to be answerable without feeling punitive.

- [ ] **Decide what `applications.ai_score` means.** It was a seeded placeholder for
      the demo badge; a completed interview now overwrites it with a real fit score.
      The kanban badge therefore means two different things depending on the row.
      Either give the real score its own column, or clear the placeholders.

- [ ] **Competency drift between interviews for the same job.** The model derives the
      competency list from the JD on every interview, so two candidates for one role
      may not be scored on identical axes. Worth pinning per job opening before
      anyone compares two reports side by side.

- [ ] **Phone candidates trip the integrity signals more often** — `keystroke_deficit`
      and `away_from_page` especially. The repeat damping softens it; it does not
      remove it. Revisit the thresholds once there are real interviews to measure
      against, rather than tuning them on guesses.
