# risks-and-open-questions

## UX direction — noted, not yet decided

Raw ideas from live testing (2026-07-04), explicitly not locked in yet. Captured here so they aren't lost before being finalized; do not treat any of this as decided the way `14-decision-log.md` entries are.

- ~~Verified-count display~~ — done: "Last verified [date]" no longer shows "by N riders."
- ~~Pin interaction~~ — done: clicking a map pin opens an overlay (Place detail) on top of the map, styled consistently with the rest of the app.
- ~~Add Place as an overlay~~ — done, via React Router's background-location pattern. Centered modal on desktop, bottom sheet on mobile.
- ~~Profile as an overlay~~ — done, same pattern.
- ~~Post-submit flow~~ — done: successful add shows a toast and returns to the map instead of navigating to the new Place's page.
- ~~Toasts generally~~ — a real toast system exists (`lib/useToast.tsx`) and is used for add-success, locate, and the "no map location yet" fallback. Verify/report/community-note feedback still use inline status text, not toasts — could move over later, not urgent.
- ~~Per-category map icons~~ — done: pins and the category filter cluster both use real per-category icons.
- **Responsive layout** — still not explicitly tested on real mobile viewports (only desktop-width automated checks so far). The bottom-sheet vs. modal split in `Overlay.tsx` is breakpoint-based (`useIsMobile`, <700px) but hasn't been verified on an actual phone-sized screen yet.
- ~~Community guideline~~ — done: the no-self-promotion rule is now written down explicitly in `CONTRIBUTING.md`, not just an implicit norm.
- **Light gamification** — deliberately deferred until after core MVP ships, and even then framed as "light" — this doesn't reopen D-011 (no points/badges/leaderboards for V1), it's a note for a possible post-MVP phase.
- **Roles (e.g. admin/approver)** — not needed yet at zero/low volume. Once there are active users, introduce a role that can approve places; today nothing is gated behind approval (matches D-012 — auto-publish, no review queue).
- **Spam handling** — will need real handling as volume grows, beyond today's manual "Report" review (D-012). No mechanism designed yet.
- **Itinerary + best-time-to-visit per region** — idea floated 2026-07-05, explicitly "in future," not this sprint. Would live on the (still-unbuilt) Region page rather than the map itself. No design yet.
- ~~Search beyond regions~~ — regions and villages are both wired now (D-014's later work), plus a free OpenStreetMap geocoding fallback for anything not in our own data. Matching individual Places by name is still unbuilt.
- ~~Map style toggle~~ — done: Liberty/Positron/Dark cycle via the utility-stack "layers" button, matching the original design reference's voyager/light/dark toggle.
- **Region dropdown on hover** — floated 2026-07-05 alongside the region fly-to work, explicitly deferred: for now clicking a region chip just flies the map there, no hover dropdown with sub-content (villages, stats, etc.). Revisit once there's a concrete idea of what belongs in it.

## Confirmed (not just noted) from the same session

- **Public, no-login map browsing has no cost downside** — Supabase bills auth by monthly *authenticated* users; anonymous reads (which is how browsing already works, per D-011/D-013) don't count toward that. The only cost driver is total database egress/request volume, which scales with traffic regardless of login state. There's no cheaper alternative that doesn't also break "no login to browse."

## Open-source readiness

Repo is going public as the user's first open-source project — treat "don't expose anything that shouldn't be public" as an ongoing constraint on every change, not a one-time audit:
- `.env` is gitignored, `.env.example` ships with empty placeholder values only (already true as of D-010/D-013-era commits).
- No API keys, tokens, or credentials get hardcoded anywhere — env vars only.
- Anon key is meant to be public (it's RLS-gated, not a secret) — the real risk is a *missing or wrong* RLS policy exposing more than intended, not the key itself being visible.
- Before any future commit, double-check nothing sensitive (real user data dumps, personal credentials, service-role keys) is staged.
- ~~Security posture~~ — done: RLS boundaries verified live against prod (D-016, `SECURITY.md`), no holes found. Accepted open tradeoff: email confirmation off → spam/vandalism risk, not data-theft risk.

## Other open questions (pre-existing)

- ~~Code licensing~~ — resolved, MIT (see D-015 in `14-decision-log.md`). Data license (ODbL-compatibility with OpenStreetMap) is still open — separate question.
- **Governance:** who can merge data changes once contributors arrive?
- **Verification mechanics:** what exactly counts as "verified," and by whom?
- **Top bar contents:** exact contents of the top navigation bar (beyond featuring Spiti/Ladakh/treks) still to be decided.
- **Where does "Treks" fit the Region model?** India → State → Region → Village → Place assumes every popular destination is a place in that hierarchy. Spiti/Ladakh/Zanskar/Sikkim fit as Regions; "Treks" doesn't — a trek crosses villages and regions. Left unseeded in `supabase/seed.sql` pending a decision: is it a tag/collection over existing Places, its own entity, or something else?
