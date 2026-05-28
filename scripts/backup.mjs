#!/usr/bin/env node
/**
 * Local disaster-recovery backup for TECXWORK.
 *
 * Each run:
 *   1. pg_dump the Neon database  -> $BACKUP_DIR/db/tecxwork_<ts>.sql.gz
 *      (prunes to the newest DB_RETENTION dumps)
 *   2. Mirror all Vercel Blob objects -> $BACKUP_DIR/blob/<pathname>
 *      (incremental: skips files already present with the same size)
 *
 * Credentials are read from .env.local (or the real environment, which wins).
 *
 * Config via env:
 *   BACKUP_DIR     where backups live          (default: ~/tecxwork-backups)
 *   DB_RETENTION   how many DB dumps to keep    (default: 48)
 *   PG_DUMP        path to pg_dump              (default: auto-detect)
 *
 * Exit code is non-zero if the DB dump fails, so a scheduler can alert.
 */

import { spawn } from "node:child_process";
import { createGzip } from "node:zlib";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BACKUP_DIR =
  process.env.BACKUP_DIR || path.join(os.homedir(), "tecxwork-backups");
const DB_DIR = path.join(BACKUP_DIR, "db");
const BLOB_DIR = path.join(BACKUP_DIR, "blob");
const DB_RETENTION = Number(process.env.DB_RETENTION || 48);

const PG_DUMP_CANDIDATES = [
  process.env.PG_DUMP,
  "pg_dump",
  "/opt/homebrew/opt/libpq/bin/pg_dump",
  "/usr/local/opt/libpq/bin/pg_dump",
  "/opt/homebrew/bin/pg_dump",
].filter(Boolean);

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
}

/** Minimal .env parser — real process.env values take precedence. */
async function loadEnv() {
  const envPath = path.join(REPO_ROOT, ".env.local");
  let text = "";
  try {
    text = await fs.readFile(envPath, "utf8");
  } catch {
    log(`No .env.local at ${envPath}; relying on process.env`);
  }
  const fromFile = {};
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    fromFile[key] = val;
  }
  return { ...fromFile, ...process.env };
}

async function resolvePgDump() {
  for (const candidate of PG_DUMP_CANDIDATES) {
    const ok = await new Promise((resolve) => {
      const p = spawn(candidate, ["--version"], { stdio: "ignore" });
      p.on("error", () => resolve(false));
      p.on("close", (code) => resolve(code === 0));
    });
    if (ok) return candidate;
  }
  return null;
}

/** Neon's pooled host carries a "-pooler" segment; pg_dump needs the direct host. */
function toDirectConnection(url) {
  return url.replace(/-pooler\./, ".");
}

async function dumpDatabase(env) {
  // Derive the direct (unpooled) connection from the canonical DATABASE_URL.
  // We intentionally do NOT trust DATABASE_URL_UNPOOLED — in this project it has
  // been observed pointing at a stale/empty Neon endpoint. Set BACKUP_DATABASE_URL
  // to override explicitly.
  const raw = env.BACKUP_DATABASE_URL || env.DATABASE_URL || env.POSTGRES_URL;
  if (!raw) throw new Error("No database connection string in env");
  const conn = toDirectConnection(raw);

  const pgDump = await resolvePgDump();
  if (!pgDump) {
    throw new Error(
      "pg_dump not found. Install with `brew install libpq` or set PG_DUMP=/path/to/pg_dump"
    );
  }

  await fs.mkdir(DB_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const finalPath = path.join(DB_DIR, `tecxwork_${ts}.sql.gz`);
  const partPath = `${finalPath}.part`;

  log(`DB dump starting (${pgDump}) -> ${finalPath}`);

  const args = ["--no-owner", "--no-privileges", "--clean", "--if-exists", conn];
  const proc = spawn(pgDump, args, { stdio: ["ignore", "pipe", "pipe"] });

  let stderr = "";
  proc.stderr.on("data", (d) => {
    stderr += d.toString();
  });

  const gzip = createGzip({ level: 9 });
  const out = createWriteStream(partPath);

  try {
    await Promise.all([
      pipeline(proc.stdout, gzip, out),
      new Promise((resolve, reject) => {
        proc.on("error", reject);
        proc.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`pg_dump exited ${code}: ${stderr.trim()}`));
        });
      }),
    ]);
  } catch (err) {
    await fs.rm(partPath, { force: true });
    throw err;
  }

  await fs.rename(partPath, finalPath);
  const { size } = await fs.stat(finalPath);
  log(`DB dump done: ${(size / 1024 / 1024).toFixed(2)} MB`);
}

async function pruneDumps() {
  let entries = [];
  try {
    entries = await fs.readdir(DB_DIR);
  } catch {
    return;
  }
  const dumps = entries
    .filter((f) => /^tecxwork_.*\.sql\.gz$/.test(f))
    .sort()
    .reverse(); // newest first (ISO timestamp sorts lexically)
  const stale = dumps.slice(DB_RETENTION);
  for (const f of stale) {
    await fs.rm(path.join(DB_DIR, f), { force: true });
  }
  if (stale.length) log(`Pruned ${stale.length} old DB dump(s)`);
}

async function mirrorBlob(env) {
  const token = env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    log("No BLOB_READ_WRITE_TOKEN — skipping Blob mirror");
    return;
  }
  const { list } = await import("@vercel/blob");
  await fs.mkdir(BLOB_DIR, { recursive: true });

  let cursor;
  let total = 0;
  let downloaded = 0;
  let skipped = 0;

  do {
    const res = await list({ token, cursor, limit: 1000 });
    for (const blob of res.blobs) {
      total += 1;
      const dest = path.join(BLOB_DIR, blob.pathname);
      try {
        const st = await fs.stat(dest);
        if (st.size === blob.size) {
          skipped += 1;
          continue;
        }
      } catch {
        // not present yet
      }
      await fs.mkdir(path.dirname(dest), { recursive: true });
      const part = `${dest}.part`;
      const r = await fetch(blob.url);
      if (!r.ok || !r.body) {
        log(`  ! failed to fetch ${blob.pathname} (${r.status})`);
        continue;
      }
      await pipeline(Readable.fromWeb(r.body), createWriteStream(part));
      await fs.rename(part, dest);
      downloaded += 1;
    }
    cursor = res.cursor;
  } while (cursor);

  log(`Blob mirror done: ${total} objects, ${downloaded} downloaded, ${skipped} unchanged`);
}

async function main() {
  log(`Backup run -> ${BACKUP_DIR}`);
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const env = await loadEnv();

  let dbOk = true;
  try {
    await dumpDatabase(env);
    await pruneDumps();
  } catch (err) {
    dbOk = false;
    log(`DB BACKUP FAILED: ${err.message}`);
  }

  try {
    await mirrorBlob(env);
  } catch (err) {
    log(`BLOB MIRROR FAILED: ${err.message}`);
  }

  log("Backup run complete");
  if (!dbOk) process.exit(1);
}

main().catch((err) => {
  log(`FATAL: ${err.stack || err.message}`);
  process.exit(1);
});
