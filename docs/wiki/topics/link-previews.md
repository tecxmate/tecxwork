---
title: Link previews (OG / Meta / iMessage)
type: topic
slug: link-previews
role: area
date: 2026-05-28
updated: 2026-05-28
source: code
status: active
tags: [area, marketing, og, social]
related: [public-homepage, tecxwork]
---

## Scope
How `work.tecxmate.com` links render as thumbnails on Instagram DMs, Facebook Messenger, Facebook feed, iMessage, and other unfurlers. Lives in `src/app/opengraph-image.tsx` (image generator) and `src/app/layout.tsx` (`generateMetadata`).

## How it works today
- `src/app/opengraph-image.tsx` is a Next.js App Router special file that builds the OG PNG on the server with `next/og`'s `ImageResponse`. Output is a cursive "tecxwork" wordmark on white, Instrument Serif italic, color `#8C52FF`. Font binary is fetched from Google Fonts at build time and passed in via the `fonts:` option (Satori needs the binary, not a CSS family).
- The route is built statically at deploy time (no `force-dynamic`) and served from Vercel's CDN, so Meta's scraper sees a fast `x-vercel-cache: HIT`.
- Response includes `cache-control: public, max-age=31536000, immutable` (set explicitly via `ImageResponse`'s `headers` option) — required for Messenger's image proxy (see lesson below).
- `generateMetadata()` in `layout.tsx` explicitly sets `openGraph.images` and `twitter.images` pointing at `/opengraph-image`, plus `og:url`, dimensions, and `image/png` type. `metadataBase` falls back to `https://work.tecxmate.com` when `NEXT_PUBLIC_SITE_URL` isn't set.

## Lessons learned (the order we discovered them, 2026-05-28 debug session)

### 1. `dynamic = "force-dynamic"` kills Meta previews
Meta's scraper has a ~5s budget. The OG route originally had `export const dynamic = "force-dynamic"` and fetched Google Fonts on every request, which made the image flaky enough that Meta dropped to the textual-only card (title + description, no thumbnail). The wordmark output is identical every request, so static generation is both safer and free.

### 2. Without explicit `images`, scrapers sometimes pick the wrong image
Next auto-detects `opengraph-image.tsx`, but explicit `openGraph.images: [{ url, width, height, type }]` and `twitter.images` are more reliable. Without them, the Sharing Debugger once showed `og:image: .../icon.svg` (Meta doesn't render SVG thumbnails at all).

### 3. `metadataBase` fallback must match the live host
`NEXT_PUBLIC_SITE_URL` was unset in Vercel env, so `og:image` resolved against the hardcoded fallback `https://tecxwork.com`. Meta scraped `work.tecxmate.com` but tried to fetch the image from a different domain, which failed → Meta fell back to the favicon. Fix: hardcoded fallback is now `https://work.tecxmate.com`. Long-term, set `NEXT_PUBLIC_SITE_URL` env var in Vercel.

### 4. **Messenger requires cacheable headers** (this was the last gotcha)
After Instagram and Facebook's Sharing Debugger were both rendering the thumbnail correctly, **Facebook Messenger still showed an empty preview** — including when the URL was cache-busted with `?v=2`. Root cause: by default `next/og` returns `cache-control: public, max-age=0, must-revalidate`. Messenger's image proxy (`external.xx.fbcdn.net`) treats `max-age=0, must-revalidate` as non-cacheable and silently skips fetching the image entirely. Instagram and the desktop FB scraper are more permissive.

Fix: pass `headers: { "cache-control": "public, max-age=31536000, immutable" }` to `ImageResponse`. Safe because Next.js appends a content hash to the OG image URL (`?<hash>`), so changing the design changes the URL.

## Each surface has its own cache
- **Instagram DM** — caches per-app; updates within a few minutes of a Sharing Debugger re-scrape.
- **Sharing Debugger** — the canonical source of truth, but only for Facebook's own scrape. Hit "Scrape Again" after any deploy that touches OG.
- **Messenger** — has a *separate* image-proxy cache from the rest of Facebook. May lag the Sharing Debugger by hours. To force a fresh fetch, append a new query param (`?v=3`) to the URL when pasting into a chat.
- **iMessage** — uses Apple's preview service; caches per-device. Send the link to yourself from a new thread to bypass local cache.

## Debug recipe
1. Curl the OG endpoint directly: `curl -sI -A "facebookexternalhit/1.1" https://work.tecxmate.com/opengraph-image` — confirm `200`, `image/png`, `< ~2s`, and **cacheable** headers (not `max-age=0`).
2. Curl the page itself with the FB user-agent and grep for `og:`/`twitter:` tags. Confirm `og:image` URL matches the live host (not a stale fallback) and resolves to a real PNG.
3. Run Meta Sharing Debugger → confirm "Time Scraped" is fresh and "Link Preview" renders the thumbnail.
4. If Messenger still empty: try a new `?v=N` query param. If that renders, the bare URL is just cache-locked and will catch up.

## Env vars
- `NEXT_PUBLIC_SITE_URL` — should be `https://work.tecxmate.com` in Vercel for prod/preview. Currently unset; the layout's fallback covers it but setting it is the right move.
