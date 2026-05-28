---
name: capacity-analytics
description: Admin Overview capacity chart — per-company slot supply vs booking-request demand, status buckets, and the query behind it.
attributed_to: niko
belongs_to: [admin-panel, recruitment-workflows]
source: chat 2026-05-29
date: 2026-05-29
---

# Capacity analytics (admin Overview)

The admin **Overview** tab has a per-company chart that answers "how many interview slots does each company have, and how full are they?" plus "what does the booking pipeline look like?"

Data lives on `AdminAnalytics.capacity` (built in `src/app/admin/admin-data.ts`); the chart is `CapacityChart` in `src/components/overview-charts.tsx`.

## Two axes, two bars — why they don't sum

Each company gets **two horizontal bars**:

1. **Slots (supply)** — `Booked` + `Available` = total slot capacity. Sourced from `slots.status` (`booked` vs the rest); `Available = total − booked`.
2. **Requests (demand)** — `Accepted` + `Unconfirmed` + `Rejected` = all booking rows for that recruiter.

They are deliberately **not** one stacked bar because slots and bookings are different units:
- Many booking requests can target the same slot (one slot, several hopefuls).
- Rejected / cancelled requests release their slot back to Available.

So the two bars are parallel, with a caption stating they don't add up.

**Consistency check this enables:** `Accepted` ≈ `Booked` in a healthy state (an accepted booking occupies a slot). Divergence is a red flag. "High Unconfirmed, zero Booked" flags a company sitting on un-actioned requests.

## Status buckets (reused project-wide convention)

Mirrors the daily booking chart in the same file / `getAnalytics`:
- **Accepted** = `accepted`
- **Unconfirmed** = `pending` + `waitlisted` + `reschedule_proposed`
- **Rejected** = `rejected` + `cancelled`

Slot status enum: `available | booked | blocked` (blocked is not currently charted).

## The query

One row per recruiter, LEFT JOINing two grouped subqueries (slots, bookings) so a company with slots-but-no-requests (or vice-versa) still appears. Filtered to recruiters with at least one slot OR one request; ordered by total slots desc. Uses Postgres `COUNT(*) FILTER (WHERE …)`. Validated against the live DB.

## Rendering notes

- `layout="vertical"` BarChart (horizontal bars), two `stackId`s (`cap`, `req`) → two bars per company band.
- Y-axis label column is 200px wide so company names (incl. CJK) don't wrap; ~46px per company row inside a `max-h-[560px]` scroll container.
- Colors: Booked = purple `#8C52FF`, Available = light purple `#C4A6FF`, Accepted = green, Unconfirmed = amber, Rejected = red.

## Open ideas

- If 30+ companies feel too dense, split into two side-by-side charts or add a supply/demand toggle.
- Could switch "Booked" to count accepted-bookings instead of slot status if state drift becomes a concern (currently uses slot status). See [[recruitment-workflows]].
