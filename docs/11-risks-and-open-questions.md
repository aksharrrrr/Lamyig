# risks-and-open-questions

## UX direction — noted, not yet decided

Raw ideas from live testing (2026-07-04), explicitly not locked in yet. Captured here so they aren't lost before being finalized; do not treat any of this as decided the way `14-decision-log.md` entries are.

- **Verified-count display** — "Last verified [date]" no longer shows "by N riders" in the UI (done). The underlying count (`places.verified_count`) is still tracked in the database either way; only the display changed.
- **Pin interaction** — clicking a map pin should open an overlay *on top of the map* with only the essential details (exact field set still to be decided), not the current small MapLibre popup-plus-link-to-a-separate-page pattern.
- **Add Place as an overlay, not a page** — clicking "+ Add place" (while signed in) should open a form centered on top of the homepage, not navigate away. Vertical layout, sized to avoid scrolling, back button top-left, closing by clicking outside. Conceptually a stack of layers over the homepage (add form, profile, pin details) rather than separate routes.
- **Profile as an overlay too** — same pattern as Add Place: a smaller popup over the homepage, not a full page.
- **Post-submit flow** — after submitting a new place, land back on the map with a toast ("Place added" / error message) instead of the current behavior (navigating to the new Place's detail page).
- **Toasts generally** — success/error feedback across the app should move toward toast notifications rather than inline status text, where that reads better.
- **Per-category map icons** — each category should get a distinct pin icon instead of every place using the same default MapLibre marker.
- **Responsive layout** — needs to work across phone sizes, not just desktop. Nothing has been explicitly tested on mobile viewports yet.
- **Community guideline** — "no self-promotion, this is travel-community utility" should become an explicit, visible rule somewhere (contribution guidelines / community notes policy), not just an implicit norm.
- **Light gamification** — deliberately deferred until after core MVP ships, and even then framed as "light" — this doesn't reopen D-011 (no points/badges/leaderboards for V1), it's a note for a possible post-MVP phase.
- **Roles (e.g. admin/approver)** — not needed yet at zero/low volume. Once there are active users, introduce a role that can approve places; today nothing is gated behind approval (matches D-012 — auto-publish, no review queue).
- **Spam handling** — will need real handling as volume grows, beyond today's manual "Report" review (D-012). No mechanism designed yet.

## Confirmed (not just noted) from the same session

- **Public, no-login map browsing has no cost downside** — Supabase bills auth by monthly *authenticated* users; anonymous reads (which is how browsing already works, per D-011/D-013) don't count toward that. The only cost driver is total database egress/request volume, which scales with traffic regardless of login state. There's no cheaper alternative that doesn't also break "no login to browse."

## Open-source readiness

Repo is going public as the user's first open-source project — treat "don't expose anything that shouldn't be public" as an ongoing constraint on every change, not a one-time audit:
- `.env` is gitignored, `.env.example` ships with empty placeholder values only (already true as of D-010/D-013-era commits).
- No API keys, tokens, or credentials get hardcoded anywhere — env vars only.
- Anon key is meant to be public (it's RLS-gated, not a secret) — the real risk is a *missing or wrong* RLS policy exposing more than intended, not the key itself being visible.
- Before any future commit, double-check nothing sensitive (real user data dumps, personal credentials, service-role keys) is staged.

## Other open questions (pre-existing)

- **Licensing:** code license (MIT? Apache 2.0?) and — more importantly — data license. OpenStreetMap uses ODbL for data; we should study whether Lamyig data should be ODbL-compatible so it can flow back into OSM.
- **Governance:** who can merge data changes once contributors arrive?
- **Verification mechanics:** what exactly counts as "verified," and by whom?
- **Top bar contents:** exact contents of the top navigation bar (beyond featuring Spiti/Ladakh/treks) still to be decided.
- **Where does "Treks" fit the Region model?** India → State → Region → Village → Place assumes every popular destination is a place in that hierarchy. Spiti/Ladakh/Zanskar/Sikkim fit as Regions; "Treks" doesn't — a trek crosses villages and regions. Left unseeded in `supabase/seed.sql` pending a decision: is it a tag/collection over existing Places, its own entity, or something else?
