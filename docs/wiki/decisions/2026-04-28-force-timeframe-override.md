---
title: Slot Release on Timeframe Override
type: decision
slug: 2026-04-28-force-timeframe-override
date: 2026-04-28
attributed_to: [niko]
belongs_to: [admin-panel, tecxwork]
source: document
status: active
tags: [bug-fix, slots]
related: [event-time-config]
---

## Context
When an admin force-overrode the event timeframe, existing bookings were cancelled but the underlying `slots` and `applicantSlots` were not released, leading to orphaned unavailable blocks in the new timeframe.

## Decision
Updated `PUT /api/admin/timeframe` to explicitly release all linked slots before regenerating the new slot set.

## Implementation
- Added cleanup logic to delete/release slots associated with force-cancelled bookings before the regeneration loop begins.
