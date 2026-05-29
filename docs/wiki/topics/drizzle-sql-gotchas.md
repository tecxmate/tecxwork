---
name: drizzle-sql-gotchas
description: Drizzle/Postgres query pitfalls hit in this repo and the patterns that avoid them (raw db.execute for grouped aggregates, no all-parameter CASE).
attributed_to: niko
belongs_to: [tecxwork, admin-panel]
source: chat 2026-05-29
date: 2026-05-29
---

# Drizzle + Postgres gotchas (and the fixes that stuck)

Two production-breaking query bugs surfaced while building the admin Overview analytics + company pinning. Both passed `tsc` and `next build` (the queries only run at request time on dynamic routes), then threw 500s in prod. Patterns below are the ones that actually work against the live Neon DB.

## 1. Don't reuse a raw `sql()` expression in `.select()` **and** `.groupBy()`
**Symptom:** `Cannot read properties of undefined (reading 'Symbol(drizzle:IsAlias)')` at SSR — crashed *every* admin page (the analytics ran inside `getAdminDashboardData`, shared by all sections).

**Bad:**
```ts
const day = sql<string>`to_char((created_at AT TIME ZONE 'Asia/Taipei')::date,'YYYY-MM-DD')`;
db.select({ d: day, n: count() }).from(t).groupBy(day); // boom
```
Reusing the same `sql` chunk object in select + groupBy trips drizzle's alias handling.

**Fix — raw `db.execute` for grouped aggregates:**
```ts
const res = (await db.execute(sql`
  SELECT to_char((created_at AT TIME ZONE 'Asia/Taipei')::date,'YYYY-MM-DD') AS d,
         COUNT(*)::int AS n
  FROM applicant_profiles GROUP BY 1
`)) as unknown as { rows?: { d: string; n: number }[] };
const rows = res.rows ?? [];
```
For the Pool-based `neon-serverless` driver, `db.execute()` returns a pg-style result — read `.rows`. (neon-http returns the array directly, so guard with `res.rows ?? res`.)

## 2. Don't build an all-parameter SQL `CASE`
**Symptom:** `Failed query: ... set "pinned_rank" = case "id" when $1 then $2 ... end` → 500 on `PUT /api/admin/recruiters/pin`. Postgres can't infer the result type of a `CASE` when **every** `THEN` is a bind parameter.

**Bad:**
```ts
const cases = sql.join(ids.map((id, i) => sql`when ${id} then ${i}`), sql` `);
tx.update(recruiters).set({ pinnedRank: sql`case ${recruiters.id} ${cases} end` })...
```

**Fix — one typed UPDATE per id inside the transaction** (fine for small sets like pinned sponsors):
```ts
await tx.update(recruiters).set({ pinnedRank: null }).where(notInArray(recruiters.id, ids));
for (let i = 0; i < ids.length; i += 1) {
  await tx.update(recruiters).set({ pinnedRank: i }).where(eq(recruiters.id, ids[i]));
}
```
`pinnedRank: i` binds as a typed int against the int column — nothing to infer. (If a single statement were ever needed, casting the THEN — `then ${i}::int` — also resolves the type, but the loop is clearer.)

## 3. `::date` comes back as a Date that slices to the wrong day
Casting `created_at::date` returns a JS `Date`; `toISOString().slice(0,10)` gives the **previous** calendar day for Taipei-midnight values (Taipei = UTC+8). Select the day as **TEXT** instead: `to_char((created_at AT TIME ZONE 'Asia/Taipei')::date,'YYYY-MM-DD')`. See [[link-previews]]-style "verify against the live DB" habit — these were all caught by replicating the query through the app's own `db.execute` with a tsx script + `.env.local`.

## Testing habit that caught these
A throwaway tsx script that loads `.env.local` into `process.env`, then `await import("./src/lib/db/index.ts")` and runs the **exact** query via `db.execute` — reproduces prod behavior locally (importing `* as schema` standalone did NOT work; use the app's `db`). Always reset any test mutations (`UPDATE ... SET pinned_rank = NULL`).
