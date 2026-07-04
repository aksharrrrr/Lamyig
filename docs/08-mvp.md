# mvp

## Screens

1. **Home** — live India map, search bar, popular destinations, category filters. See [`07-information-architecture.md`](07-information-architecture.md).
2. **Region page** — description, offline download, popular villages, community stats, "Open Map."
3. **Village page** — village info, available categories, community updates, "Open Map."
4. **Place popup** — map-pin tap, essential info, "More Details."
5. **Place detail page** — full Place record: all fields, photos, Community Notes, "Still accurate" verify button, "Report," "Edit."
6. **Add Place** — "+" → select category → fill form → upload photos → submit.
7. **Edit Place** — same form as Add Place, pre-filled with current values. Any logged-in user can open it from a Place detail page.
8. **Sign in / sign up** — email+password or Google OAuth. Triggered the first time a browsing user taps "+," "Edit," "Still accurate," or "Report."
9. **Profile** — minimal: name, contributed-places count, "downloaded regions" list, sign out.

Nothing beyond this list is in V1 — see Out of scope below.

## Contribution flow

Browsing requires no account. Contributing does.

1. Tap "+"
2. Select Place category
3. Fill in required fields (base fields + category-specific fields, below)
4. Upload photos — minimum depends on category (see below), max 6, compressed client-side before upload
5. Submit → **goes live immediately**, no review queue

See D-012 in [`14-decision-log.md`](14-decision-log.md) for why publish is instant rather than queued, and how editing, verification, and reporting work on top of that.

Region and Village are both required, but the Village picker isn't limited to a pre-seeded list — "+ Add a village not on this list…" lets a contributor add one inline (same auto-publish trust model as places). Regions stay founder-curated for now — the top-level geography is a bigger structural call than adding one more village.

## Data model

### Base fields (every Place)

Required: Name, Category, GPS coordinates (auto-filled from device location at add-time, editable), Village, Region, Description, Last updated, Added by.

Optional: Phone number (validated as a plausible phone number, not free text), WhatsApp (same), Price range, Community notes (free text), photographs (minimum count varies by category, see below).

### Category-specific fields

Each category also sets its own **minimum photo count** — a homestay needs to show itself off, but a toilet or mechanic pin is a quick "this exists here" note and shouldn't be gated behind photos nobody wants to take.

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

This table is the starting point for V1, not final — categories can gain or lose fields without changing the underlying Place model (see [`07-information-architecture.md`](07-information-architecture.md)).

### Community Notes

Free-text factual observations, replacing reviews — see D-004 in [`14-decision-log.md`](14-decision-log.md).

## Trust mechanics

- **Editing** — any logged-in user can edit any Place. "Last updated"/"added by" reflect the latest editor.
- **Verification** — one-tap "Still accurate" button updates the last-verified date and increments verifier count (e.g. "verified May 2026 by 14 riders"). Adding a Place counts as verifying it — you just personally confirmed it exists — so a new Place starts at "verified today by 1 rider" instead of "not yet verified." One verification per person per Place; the button reads "You verified this" and disables once you've used it.
- **Reporting** — "Report" on a Place (reason: spam / incorrect / closed / duplicate) logs a record for manual founder review. No automated hide in V1.

See D-012 in [`14-decision-log.md`](14-decision-log.md).

## Authentication

Email/password or Google OAuth via Supabase Auth. No phone/OTP in V1 — see D-013 in [`14-decision-log.md`](14-decision-log.md). Sign-in is only prompted at the point a browsing user tries to contribute, edit, verify, or report — never on entry.

## Offline

Users download a **region** (e.g. "Download Spiti") from that region's page — not the whole country. The package includes the region's map tiles, places, photographs, and community information. Opt-in, not a gate on first use — the app is usable online (map, search, browsing) the moment it's opened. See D-005 and D-009 in [`14-decision-log.md`](14-decision-log.md).

**Offline contribution:** if a user adds, edits, or verifies a Place while offline, the action queues locally and syncs automatically once connectivity returns — it does not silently fail. This matters directly for Lamyig's core scenario (see the puncture story in [`01-founder-story.md`](01-founder-story.md)): the traveller most likely to have something to report is the one with no signal right now.

Built on OpenStreetMap + MapLibre, not a proprietary stack — see D-006 and [`12-architecture.md`](12-architecture.md).

## Launch data

The founder seeds a small verified core of places (starting with Spiti, drawing on firsthand knowledge — see [`01-founder-story.md`](01-founder-story.md)) before public launch, so the first travellers arriving from the community push don't land on an empty map. The community — starting with solo travellers reached via Reddit — adds and verifies from there.

## Out of scope for V1

Explicitly deferred, not forgotten:

- Star ratings, comments/discussion threads, gamification — permanently excluded, see D-004 and D-011.
- Moderation dashboard / automated flag-based takedown — manual review of "Report" records only (see Trust mechanics, above).
- Edit history / rollback UI — if wiki-style editing is abused, founder corrects directly in Supabase for now.
- Saved/favourite places, trip planning, notifications, multi-language, recommendations, advanced/natural-language search.
- Phone/OTP login (see D-013).

## Ratings, comments, gamification

None of these are in the MVP, and none are planned for V1. See [`06-product-philosophy.md`](06-product-philosophy.md).
