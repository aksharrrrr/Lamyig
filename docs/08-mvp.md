# mvp

## Screens

1. **Home** - live India map, search bar, popular destinations, category filters. See [`07-information-architecture.md`](07-information-architecture.md).
2. **Region page** - Spiti, Ladakh, and Zanskar share the offline download and "Open Map" flow. Other Region pages are lightweight placeholders in the current beta.
3. **Village page** - placeholder in the current beta.
4. **Place popup** - map-pin tap, essential info, "More Details."
5. **Place detail page** - full Place record: all fields, photos, Community Notes, "Report," "Edit."
6. **Add Place** - "+" → select category → fill form → upload photos → submit.
7. **Edit Place** - same form as Add Place, pre-filled with current values. Any logged-in user can open it from a Place detail page.
8. **Sign in / sign up** - email+password. Triggered when a browsing user tries to contribute, edit, or report.
9. **Profile** - account email, privacy/terms links, sign out, and permanent account deletion.

Nothing beyond this list is in V1 - see Out of scope below.

## Contribution flow

Browsing requires no account. Contributing does.

1. Tap "+"
2. Select Place category
3. Fill in required fields (base fields + category-specific fields, below)
4. Upload photos - minimum depends on category (see below), max 6, compressed client-side before upload
5. Submit → **goes live immediately**, no review queue

See D-012 and D-020 in [`14-decision-log.md`](14-decision-log.md) for why publish is instant and how editing and reporting work.

Region and Village are currently optional and hidden in the contribution form. Coordinates drive map visibility; geographic classification returns when Region/Village pages expand beyond the current beta. Regions remain centrally curated.

## Data model

### Base fields (every Place)

Required: Name, Category, GPS coordinates (auto-filled from device location at add-time, editable), Village, Region, Description, Last updated, Added by.

Optional: Phone number (validated as a plausible phone number, not free text), WhatsApp (same), Price range, Community notes (free text), photographs (minimum count varies by category, see below).

### Category-specific fields

Each category also sets its own **minimum photo count** - a homestay needs to show itself off, but a toilet or mechanic pin is a quick "this exists here" note and shouldn't be gated behind photos nobody wants to take.

| Category | Min photos | Extra fields |
|---|---|---|
| Homestay | 3 | Host name, price/night, meals included, bike/car parking, cash-only |
| Mechanic | 0 | Services (puncture / general repair / spare parts), vehicle types serviced |
| Fuel | 0 | Fuel types available, informal (jerry-can) vs pump |
| Food | 0 | Meal times, cash-only |
| Drinking water | 0 | Potable, free/paid |
| Toilet | 0 | Clean (self-reported), free/paid, Indian/Western |
| Medical | 0 | Type (clinic / pharmacy / hospital), emergency-capable |
| Camping | 0 | Tent pitch allowed, nearby toilet/water |
| Mobile network | 0 | Operators with signal, signal strength note |
| Viewpoint | 0 | Best time of day |

This table is the starting point for V1, not final - categories can gain or lose fields without changing the underlying Place model (see [`07-information-architecture.md`](07-information-architecture.md)).

### Community Notes

Free-text factual observations, replacing reviews - see D-004 in [`14-decision-log.md`](14-decision-log.md).

## Trust mechanics

- **Editing** - any logged-in user can edit any Place. "Last updated"/"added by" reflect the latest editor.
- **Reporting** - "Report" on a Place (reason: spam / incorrect / closed / duplicate) logs a record for manual review. No automated hide in V1.

See D-012 in [`14-decision-log.md`](14-decision-log.md).

## Authentication

Email/password via Supabase Auth. Google OAuth and phone/OTP are not in the current beta. Sign-in is only prompted when a browsing user tries to contribute, edit, or report - never on entry.

## Offline

Users can download **Spiti, Ladakh, and Zanskar** from the shared Offline Maps panel. Each opt-in browser-stored package contains its regional vector basemap plus a dated snapshot of every matching place, its structured details, photographs, and Community Notes. Packs can be opened while online, used without signal, updated independently, or removed by the user. See D-005, D-017, and D-021 in [`14-decision-log.md`](14-decision-log.md).

**Not yet implemented:** offline contributions do not queue or sync. Adding, editing, reporting, and refreshing a region pack require connectivity. This is stated explicitly so offline browsing is not confused with offline writing.

Built on OpenStreetMap + MapLibre, not a proprietary stack - see D-006 and [`12-architecture.md`](12-architecture.md).

## Launch data

A small verified core of places (starting with Spiti - see [`01-founder-story.md`](01-founder-story.md) for how that initial knowledge was gathered) is seeded before public launch, so the first travellers arriving from the community push don't land on an empty map. The community - starting with solo travellers reached via Reddit - adds and verifies from there.

## Out of scope for V1

Explicitly deferred, not forgotten:

- Star ratings, comments/discussion threads, gamification - permanently excluded, see D-004 and D-011.
- Moderation dashboard / automated flag-based takedown - manual review of "Report" records only (see Trust mechanics, above).
- Edit history / rollback UI - if wiki-style editing is abused, corrected directly in Supabase for now.
- Saved/favourite places, trip planning, notifications, multi-language, recommendations, advanced/natural-language search.
- Phone/OTP login (see D-013).

## Ratings, comments, gamification

None of these are in the MVP, and none are planned for V1. See [`06-product-philosophy.md`](06-product-philosophy.md).
