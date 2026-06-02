---
name: DB Schema Extras
description: Non-obvious columns added beyond the base schema for SOLOS+
---

## announcements
- `image_url` (nullable text) — Supabase Storage URL or external URL
- `link_url` (nullable text) — clickable link attached to announcement
- `link_label` (nullable text) — label for the link button

## scrims
- `image_url` (nullable text) — scrim banner/poster image
- `link_url` (nullable text) — e.g. tournament registration page
- `link_label` (nullable text) — label for link button
- `result_image_url` (nullable text) — screenshot of match result

## events
- `link_url` (nullable text) — registration or info link
- `link_label` (nullable text) — label for the link button
- `image_url` already existed before this session

## members
- `avatar_url` already existed; set via Profile.tsx file upload or URL paste

**Why:** Owner can attach images and external links to announcements, events, and scrims through the Owner Panel without needing to host media externally first.
