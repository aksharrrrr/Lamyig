# architecture

**Status:** Implemented — see D-010 in [`14-decision-log.md`](14-decision-log.md).

## Frontend
React, TypeScript, Vite, Tailwind.

## Maps
OpenStreetMap data, MapLibre GL for rendering. See D-006 — Lamyig never builds a mapping engine.

## Backend
Supabase (free tier) — database, storage.

## Authentication
Supabase Auth.

## Hosting
Cloudflare Pages or Vercel (free tier).

## Storage
Supabase Storage.

## Cost objective
Keep monthly operating cost close to zero while validating the idea — every component above has a genuine free tier at MVP scale.
