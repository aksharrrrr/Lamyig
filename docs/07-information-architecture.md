# information-architecture

## Knowledge, not a map

Lamyig is fundamentally a knowledge platform, not a mapping product. The map is one interface for viewing the knowledge — not the product itself. See D-009 in [`14-decision-log.md`](14-decision-log.md).

## Geographic hierarchy

Every piece of information belongs somewhere in this hierarchy:

```
India → State → Region → Village → Place
```

## The Place model

Everything a traveller might search for is a **Place** — a homestay, campsite, mechanic, fuel station, toilet, drinking water point, medical facility, restaurant, or viewpoint. The category changes; the underlying object is always a Place.

### Place information

Required on every Place:
- Name
- Category
- GPS coordinates
- Village
- Region
- Minimum three photographs
- Description
- Last updated
- Added by

Optional:
- Phone number
- WhatsApp
- Price range
- Community notes

Category-specific fields are added depending on Place type.

### Community Notes

Community Notes replace traditional reviews — free-text factual observations instead of star ratings, e.g.:

> Stayed June 2026. Meals included. Family-run. Cash only. Road becomes steep during the last 500 metres. BSNL works. Airtel does not.

See D-004 in [`14-decision-log.md`](14-decision-log.md).

## Homepage

Four sections, nothing more:
- Search bar
- Popular destinations
- Community map
- Category filters

## Search

Search covers exactly three entities: **Region**, **Village**, **Place** (e.g. "Spiti," "Losar," "Dorje Homestay"). Natural-language search is intentionally out of scope for V1.

## Popular destinations

Frequently visited regions surfaced directly on the homepage as quick entry points: Spiti, Ladakh, Zanskar, Sikkim, Treks. These are the founder-seeded starting regions (see D-009), not the product's scope boundary — Lamyig covers India.

## Region flow

Searching or selecting a region (e.g. Spiti) does not open the map directly. It opens a **Region Page**:
- Region description
- Offline download
- Popular villages
- Community statistics
- "Open Map" button

This gives context before exploration.

## Village flow

Every village gets its own page (e.g. Losar, Gue, Tabo) — the central information hub for that location:
- Village information
- Available categories
- Community updates
- "Open Map"

## Place flow

Selecting a Place on the map opens a small popup with essential information, and a "More Details" button opens the full Place page. This intentionally mirrors the Google Maps interaction pattern travellers already know.

## Categories (V1)

Homestays, mechanics, fuel, food, drinking water, toilets, medical, camping, mobile network, viewpoints. New categories can be added without changing the underlying Place model.
