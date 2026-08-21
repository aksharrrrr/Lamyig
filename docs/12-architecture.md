# architecture

**Status:** Implemented - see D-010 in [`14-decision-log.md`](14-decision-log.md).

## Frontend
React, TypeScript, Vite, Tailwind.

## Maps
OpenStreetMap data, MapLibre GL for rendering. See D-006 - Lamyig never builds a mapping engine.

Map presentation configuration is shared through `src/lib/constants.ts`. The same renderer in `src/components/Map.tsx` serves live OpenFreeMap styles and downloaded regional PMTiles, which keeps labels and cartography consistent online and offline.

Offline regional packs live in IndexedDB and are independent of the service-worker application shell. `src/lib/offlineConfig.ts` is the source of truth for region bounds, archive sizes, schema version, and per-region map artifact versions; `src/lib/offlinePack.ts` handles storage and downloads. Replacing an archive requires incrementing its `mapVersion`; database revisions separately signal newer community places, notes, and photos.

## Backend
Supabase (free tier) - database, storage.

## Authentication
Supabase Auth.

## Hosting
Cloudflare Pages or Vercel (free tier).

## Storage
Supabase Storage.

## Cost objective
Keep monthly operating cost close to zero while validating the idea - every component above has a genuine free tier at MVP scale.
