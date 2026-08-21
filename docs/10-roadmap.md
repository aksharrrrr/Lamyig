# roadmap

Only validated launch work belongs in the MVP. The following ideas remain a
post-MVP backlog until traveller behaviour demonstrates which problem is worth
solving. See [`14-decision-log.md`](14-decision-log.md) for approved decisions.

## Outdoor knowledge layers

**Status:** Backlog — not required for MVP launch.

Lamyig remains centred on homestays and factual community travel knowledge.
Outdoor layers may later add independently selectable terrain, roads and
vehicle tracks, walking trails, natural features, travel essentials, warnings,
and community-recorded routes without turning Lamyig into a navigation app.

Possible future scope:

- Optional layer groups and lightweight map presets
- Contours, hillshade, and elevation from an open regional dataset
- GPX upload for trails actually travelled by contributors
- Trail provenance, freshness, corrections, reports, and privacy trimming
- Selective outdoor data in offline packs with size estimates
- Map-correction proposals that remain separate from direct OSM editing

Explicitly later: in-app background GPS recording, live location, routing,
3D terrain, weather or avalanche feeds, and automatic writes to OpenStreetMap.

Any implementation must load optional data only when selected, avoid
continuous GPS during browsing, simplify route geometry, preserve the existing
offline failure protections, and stay within validated free-tier limits.
