---
title: Local Backup & Disaster Recovery
type: topic
slug: backup-dr
date: 2026-05-29
updated: 2026-05-29
attributed_to: [niko]
belongs_to: [tecxwork, architecture-overview]
source: chat
status: active
tags: [backup, disaster-recovery, neon, vercel-blob, pg_dump, launchd, ops]
related: [architecture-overview, data-privacy, stale-unpooled-db-url]
---

Off-platform disaster-recovery: a script keeps a local copy of all hosted data (Neon Postgres + Vercel Blob) on a personal machine, so the project survives loss of the hosted services. Motivation: niko wants a guaranteed local copy in case anything happens to Neon or Vercel.

## What it does

`scripts/backup.mjs` (run via `pnpm backup`, or hourly via launchd) does two things per run:

1. **Database** — `pg_dump` of the Neon Postgres DB → `~/tecxwork-backups/db/tecxwork_<ts>.sql.gz`. Keeps the newest 48 dumps (`DB_RETENTION` env-tunable).
2. **Blob** — mirrors every Vercel Blob object → `~/tecxwork-backups/blob/<pathname>`. Incremental: skips files already present with the same size.

Config via env: `BACKUP_DIR` (default `~/tecxwork-backups`), `DB_RETENTION` (default 48), `PG_DUMP` (path override), `BACKUP_DATABASE_URL` (explicit DB override).

### Key implementation detail — direct vs pooled connection
`pg_dump` cannot run through Neon's connection pooler. The script derives the **direct** host by stripping `-pooler` from the canonical `DATABASE_URL`. It deliberately does NOT use `DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING`, which in this project are stale and point at a different, EMPTY Neon endpoint — see [[stale-unpooled-db-url]]. The first backup test mirrored that empty DB before this was fixed.

### Verified
Real run captured production data (128 users, 34 recruiters, 93 applicants, 88 bookings, 107 jobs, 405 slots, 503 external_jobs, …), 0.28 MB gzipped; Blob mirror = 155 objects / 106 MB with incremental skip confirmed. `pg_dump` is v18.2 at `/opt/homebrew/opt/libpq/bin/pg_dump` (forward-compatible with Neon's PG; already present, no `brew install` was needed).

## Scheduling (primary Mac — already installed)
`scripts/com.tecxwork.backup.plist` is a launchd job (`StartInterval 3600` = hourly, `RunAtLoad`). Installed on niko's main Mac:
```
cp scripts/com.tecxwork.backup.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.tecxwork.backup.plist
launchctl list | grep tecxwork   # verify; 2nd column is last exit code
```
Stop / uninstall: `launchctl unload ~/Library/LaunchAgents/com.tecxwork.backup.plist`. Change frequency: edit `StartInterval` (seconds). Logs: `~/tecxwork-backups/launchd.out.log` / `launchd.err.log`.

## Setting up on a second machine

The script is portable; only the **plist has machine-specific paths**. On a new Mac:

1. **Clone + deps:** `git clone … && cd tecxwork && pnpm install`
2. **Install pg_dump:** `brew install libpq` (Apple Silicon: `/opt/homebrew/opt/libpq/bin/pg_dump`; Intel: `/usr/local/opt/libpq/bin/pg_dump`). The script auto-checks both, so usually no config needed.
3. **Create `.env.local`** (gitignored — secrets never leave the machines, so copy them over). Only two keys are required:
   ```
   DATABASE_URL="postgresql://…ep-lingering-sun-an5htstv-pooler…/neondb?sslmode=require"
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_…"
   ```
   Source from Vercel → Project → Settings → Environment Variables, or `vercel env pull .env.local`.
4. **Test:** `pnpm backup`, then confirm `~/tecxwork-backups/db/*.sql.gz` has data and `~/tecxwork-backups/blob/` fills up.
5. **Schedule:** `cp scripts/com.tecxwork.backup.plist ~/Library/LaunchAgents/`, then in that copied file update the 4 machine-specific paths:
   - node binary (`which node`)
   - `scripts/backup.mjs` absolute path
   - `WorkingDirectory` (repo path)
   - the two `launchd.*.log` paths (home dir)

   Then `launchctl load ~/Library/LaunchAgents/com.tecxwork.backup.plist`.

Both machines keep independent local copies (no conflict — each mirrors the same source), which is the intended redundancy.

### Non-macOS second machine
The script itself runs anywhere with Node (`node scripts/backup.mjs`); only the scheduler differs:
- **Linux:** cron — `0 * * * * cd /path/to/tecxwork && /usr/bin/node scripts/backup.mjs`
- **Windows:** Task Scheduler running the same command hourly.

## Restoring
Database: `gunzip -c tecxwork_<ts>.sql.gz | psql "<direct DATABASE_URL>"` (the dump uses `--clean --if-exists`, so it drops and recreates objects). Blob: re-upload files from `~/tecxwork-backups/blob/<pathname>` as needed.
