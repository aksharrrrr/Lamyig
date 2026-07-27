# Product Decision Log

Every major decision, its reasoning, and the alternatives considered. New contributors should read this before proposing changes - most "why didn't you just…" questions are answered here.

Format: **Decision · Date · Status (Final / Provisional) · Reasoning · Alternatives considered**

---

## D-001 - The project is named Lamyig

**Date:** 2026-07-03 · **Status:** Final

**Decision:** The project is named **Lamyig** (ལམ་ཡིག), the Tibetan word for a handwritten route guidebook - literally "road writing."

**Reasoning:** Evaluated against four naming criteria:

1. *Meaning* - a lamyig is historically the exact artifact we are building: a book of routes, stops, water sources, and dangers for Himalayan travellers. Guides to hidden valleys (beyul) were written as lamyigs. The name encodes the mission without metaphor.
2. *Distinctiveness* - search found essentially no collisions (one dormant webpage). GitHub org, app-store name, and domain are ownable.
3. *Usability* - six letters, two syllables ("lum-yig"), spellable after hearing it once.
4. *Extensibility* - a road-book contains everything on the road, so adding mechanics, water points, campsites, and new regions never breaks the name.

**Alternatives considered:** *Atlas* (working codename - generic, unownable), *Beyul* (perfect meaning, but heavily colliding: a Nepali trekking company, a travel-tech firm at beyul.com, others), *Terma* (hidden treasure - good metaphor, multiple collisions), *Satra* (Tibetan for "map" - strong runner-up, less story), *Néyig* (pilgrimage guidebook - spelling/pronunciation friction).

---

## D-002 - Lamyig is a knowledge map, not a booking platform

**Date:** 2026-07-03 · **Status:** Final

**Decision:** Lamyig documents and helps discover places and travel knowledge. It does not process bookings, payments, or commissions.

**Reasoning:** The founding insight is that a traveller in remote India needs a room once a day but information twenty times a day. Booking is the most-served slice of the problem (and the one commercial platforms already fight over); knowledge is the unserved 95%. Staying out of transactions also keeps hosts' economics untouched - no 15–25% commission pressure - which is why they'd want to be listed at all.

**Alternatives considered:** Homestay booking platform (original idea); hybrid directory-plus-booking (scope trap, and re-creates the commission problem).

---

## D-003 - V1 covers Spiti only

**Date:** 2026-07-03 · **Status:** Superseded by D-009 (2026-07-03)

**Decision:** Version 1 covers Spiti Valley. Expansion order: Spiti → Spiti + Zanskar → Himachal → Ladakh → India, each step gated on data quality.

**Reasoning:** The competitive advantage is verified quality, not coverage. 400 incredible verified places beat 40,000 poor listings. Spiti is where the founder has firsthand field knowledge, which makes seed data and verification credible.

**Alternatives considered:** Launch India-wide (rejected: quality collapses, verification impossible, classic scope-death).

---

## D-004 - Structured facts + Community Notes instead of star ratings

**Date:** 2026-07-03 · **Status:** Final

**Decision:** Places carry structured, verifiable facts (open hours, services, "cash only," "last verified May 2026 by 14 riders") and free-text community notes. No star ratings, no likes.

**Reasoning:** Ratings measure popularity and optimise for whoever manages their listing hardest - exactly the game remote hosts can't play. Facts decay gracefully (a "last verified" date tells you how much to trust them); a 4.2-star average tells you nothing in a village with three reviews. Facts also serve the emergency use case (is the mechanic open now?) that ratings never can.

**Alternatives considered:** Star ratings + reviews (rejected as above); ratings-later (deferred to the roadmap discussion - logged here so we remember why we resisted).

---

## D-005 - Offline-first is a product requirement, not a feature

**Date:** 2026-07-03 · **Status:** Final

**Decision:** Every core experience - map, places, search within a downloaded region - must work with zero connectivity. A traveller downloads a region pack (e.g., "Spiti, ~130 MB") and the product is fully useful from then on.

**Reasoning:** The places Lamyig serves best are precisely the places without network (Baatal: no network, no nearby village). An online-first product would fail exactly where it matters most. This constraint drives architecture, so it is decided at the product level.

**Alternatives considered:** Online-first with cached tiles (fails the founding use case).

---

## D-006 - Build on the OpenStreetMap ecosystem; never build a mapping engine

**Date:** 2026-07-03 · **Status:** Final

**Decision:** Lamyig uses existing open mapping technology (OpenStreetMap data, open map rendering libraries). Our energy goes exclusively into the layer nobody else has: curated, verified, community-maintained travel knowledge.

**Reasoning:** A mapping engine is a decade of work that already exists in open source. The differentiation is the data, not the tiles.

**Alternatives considered:** Custom mapping stack (rejected: scope-death), Google Maps SDK (rejected: cost at scale, licensing restricts open data).

---

## D-007 - Documentation lives in Markdown on GitHub, and is written before code

**Date:** 2026-07-03 · **Status:** Final

**Decision:** The product handbook is version-controlled Markdown in this repository. It is the source of truth; PDF/DOCX are exports. The handbook is written in present tense, as if Lamyig exists ("Lamyig organises…", not "we should build…"). Plain text, no visual design.

**Reasoning:** The project is open source; product decisions should be reviewable and pull-requestable exactly like code. Present tense forces decisions instead of speculation. The document contains only decisions actually made - no invented user research, no fabricated metrics.

**Alternatives considered:** Word/Google Docs source of truth (not version-controllable alongside code); generating a 50-page document up front (rejected: it would require inventing research that hasn't happened).

---

## D-008 - Tech direction: PWA, React, MapLibre, Supabase

**Date:** 2026-07-03 · **Status:** Superseded by D-010 (2026-07-03)

**Decision (provisional):** Progressive Web App built in React, MapLibre GL for rendering, OpenStreetMap data, Supabase (free tier) for database/auth/storage, free-tier static hosting.

**Reasoning:** Zero-budget constraint; single builder; PWA avoids app-store friction and enables offline caching; every component has a genuinely free tier at MVP scale. Held provisional because offline sync and tile hosting need real technical evaluation before we commit in writing.

---

## D-009 - Lamyig is India-wide; knowledge is organised India → State → Region → Village → Place; the map is one interface, not the product

**Date:** 2026-07-03 · **Status:** Final

**Decision:** Lamyig's scope is India, not Spiti alone - this supersedes D-003. Spiti, Ladakh, Zanskar, Sikkim, and major treks are the founder-seeded, featured starting regions, surfaced as "Popular destinations" on the homepage - they are entry points, not the product boundary. All knowledge is organised in a fixed geographic hierarchy: India → State → Region → Village → Place. Every searchable thing (homestay, mechanic, fuel stop, toilet, water point, viewpoint, etc.) is a **Place** - the category varies, the underlying object doesn't.

Lamyig is fundamentally a knowledge platform, not a mapping product. The map is one interface for exploring the knowledge (via the homepage's "Community map" section and each Region/Village page's "Open Map"), not the product itself.

On first open, the app shows a live map of India with no forced setup; if location permission is granted, the map centers on the user. A search bar resolves Region, Village, or Place by name (e.g. "Spiti," "Losar," "Dorje Homestay") - natural-language search is explicitly out of scope for V1. Selecting a region opens a **Region Page** (description, offline download, popular villages, community stats, "Open Map") rather than jumping straight to the map, and every village gets its own page as a local information hub. See [`07-information-architecture.md`](07-information-architecture.md).

**Reasoning:** The founder's original idea came from a Spiti/Zanskar trip, which is why early framing (D-003) scoped V1 to Spiti - but the underlying problem (fragmented travel knowledge, invisible local services) is not Spiti-specific, it's true of remote India generally. Scoping the *product* to Spiti would have limited the Reddit/community-driven growth loop to a single valley; scoping the *seed data* to Spiti (where the founder has firsthand verified knowledge) keeps launch quality high without limiting the product's addressable audience. Region/Village pages before the map give context (why this place matters, what's known about it) instead of dropping a traveller onto a bare pin.

**Alternatives considered:** Spiti-only V1 with staged geographic rollout (original D-003 - rejected: unnecessarily constrains the community-growth loop the launch plan depends on); map-first homepage with no Region/Village pages (rejected: loses the "knowledge platform, not a map" positioning, and gives no context before exploration).

---

## D-010 - Tech stack: React + TypeScript + Vite + Tailwind, MapLibre + OpenStreetMap, Supabase, Cloudflare Pages/Vercel

**Date:** 2026-07-03 · **Status:** Final

**Decision:** Frontend is React, TypeScript, Vite, and Tailwind. Maps use OpenStreetMap data rendered with MapLibre GL (per D-006 - no custom mapping engine). Backend is Supabase (database + storage), with Supabase Auth for authentication. Hosting is Cloudflare Pages or Vercel, both free tier. This finalizes D-008, adding TypeScript, Vite, and Tailwind to the stack and removing "provisional" status.

**Reasoning:** Same zero-budget, single-builder constraint as D-008 - every layer of this stack has a genuine free tier at MVP scale. TypeScript/Vite/Tailwind is a standard, low-friction combination for a single builder to move fast in.

**Alternatives considered:** See D-008 and D-006.

---

## D-011 - No comments, no gamification; browsing is open, contributing requires an account

**Date:** 2026-07-03 · **Status:** Final

**Decision:** Beyond no star ratings (D-004), Lamyig also excludes general comment/discussion threads and all gamification (points, coins, badges, leaderboards, streaks). Browsing requires no account; contributing (via the "+" → select Place type → fill details → upload 3+ photos → submit flow) requires one.

**Reasoning:** Comment threads add moderation burden without adding structured, reusable information - a Community Note already covers the "useful observation" case. Gamification optimizes for engagement metrics, not contribution quality, and cuts against Facts Over Ratings (D-004) and Information Over Features (see [`06-product-philosophy.md`](06-product-philosophy.md)). Open browsing keeps the product useful to a traveller with zero setup (see D-009); requiring an account only to contribute keeps data attributable without gating the core use case.

**Alternatives considered:** Light gamification to drive contribution volume (rejected: past experience with review platforms shows this games the system rather than improving data quality); account-gated browsing (rejected: directly contradicts the zero-friction, open-on-first-launch experience in D-009).

---

## D-012 - Auto-publish, wiki-style editing, one-tap verification

**Date:** 2026-07-03 · **Status:** Final

**Decision (provisional):** A submitted Place goes live immediately, no review queue. Any logged-in user can edit any Place afterward (wiki-style) - the Place's "last updated"/"added by" fields track the most recent editor, not just the original contributor. A Place's "last verified" date and verifier count (e.g. "verified May 2026 by 14 riders," per D-004) update via a one-tap "Still accurate" button - no re-submission required. Every Place also carries a lightweight "Report" action (reason: spam / incorrect / closed / duplicate) that writes a record for the founder to review manually - no automated hide/takedown in V1, since auto-hiding on flag count is itself abusable and a moderation dashboard is out of scope for V1 (see Out of scope, below).

**Reasoning:** Matches the OSM/Wikipedia model already committed to in D-006, and directly serves Keep It Simple + Community First (`docs/06-product-philosophy.md`). A review queue would make the solo founder a bottleneck the moment the Reddit launch drives a spike in submissions - the opposite of the community-growth loop D-009's launch plan depends on. One-tap verify keeps the "few seconds while travelling" behavior that field research (`03-field-research.md`) validated; a full re-submission would kill it.

**Alternatives considered:** Review queue before publish (rejected: founder bottleneck, contradicts zero-team constraint); edit restricted to original contributor (rejected: guarantees stale data whenever the original adder doesn't return, undermines "last verified" trust signal); automated flag-count takedown (rejected: new attack surface - coordinated false-flagging could remove real, correct places).

---

## D-013 - Auth: email/password + Google OAuth only

**Date:** 2026-07-03 · **Status:** Final (Google OAuth launch deferred, see update below)

**Decision (provisional):** Contributing requires signing in via Supabase Auth, using either email/password or Google OAuth. No phone/OTP login in V1.

**Reasoning:** Both methods are free at Supabase's tier, matching the zero-cost objective in D-010. Google OAuth is near-zero-friction for most travellers. Phone OTP costs money per SMS at scale and is least reliable exactly where Lamyig matters most - poor-signal remote regions - so it would fail its own use case.

**Update 2026-07-04:** Shipping with email/password only for now - Google OAuth needs a Google Cloud Console OAuth client set up first (free, but a setup step not yet done). The "Continue with Google" button is pulled from the UI rather than left in as a dead button. Google OAuth stays on the roadmap and slots back in once that setup happens; this isn't a reversal of the decision, just a sequencing choice.

---

## D-014 - Region "fly to" is a separate feature from offline download, and ships first

**Date:** 2026-07-05 · **Status:** Final

**Decision:** Clicking a region chip, or matching one via search, flies the map camera to that region (MapLibre `flyTo`, using new `center_lat`/`center_lng`/`default_zoom` columns on `regions`). This ships now, independently of the offline-download work described in D-005.

**Reasoning:** The two got floated together ("downloading seems a very big task, is it possible to just show the area selected instead") but they solve different problems. D-005's offline requirement is about the app working with *zero connectivity* - that's a multi-week build (service worker, tile caching, photo caching, sync-on-reconnect) that doesn't get smaller by scoping it down; a region without cached tiles/data still doesn't work offline no matter how the UI presents it. "Fly to region" is a navigation convenience that requires network the whole time - it doesn't satisfy the offline requirement and was never going to. Decoupling them means the fast, real value (better map navigation) ships now instead of waiting on or being confused with the much larger offline effort.

**Alternatives considered:** Building a lightweight "highlighted area" as a stand-in for real offline support (rejected: would look like offline support was implemented when it wasn't - misleading, and doesn't reduce the actual remaining offline work by a single line of code). Reversing/downgrading D-005 to drop the offline requirement entirely (rejected: not proposed by the user, who asked how to reduce near-term scope, not whether the requirement itself should go away; D-005's founding reasoning - Baatal, zero network - hasn't changed).

---

## D-015 - Code license: MIT

**Date:** 2026-07-06 · **Status:** Final

**Decision:** The code is MIT licensed (see `LICENSE`). The *data* license (whether Place/Region/Village content should be ODbL-compatible so it can flow back into OpenStreetMap) is a separate question and stays open - MIT covers the software only.

**Reasoning:** MIT is the simplest permissive license and the most common default for a project actively trying to attract outside contributors with as little friction as possible - no patent-grant language to read (unlike Apache 2.0), no copyleft obligations (unlike GPL) that could scare off casual contributors or make the tech stack's other dependencies awkward to reason about. Nothing about this project's shape (no patent-sensitive IP, no desire to force downstream contributions back) calls for anything more complex.

**Alternatives considered:** Apache 2.0 (rejected: the extra patent-grant/termination clauses solve a problem - patent disputes - this project has no exposure to; adds reading burden for contributors with no corresponding benefit here). No license / all-rights-reserved (rejected: directly contradicts D-007's and the README's "open source" framing - without a license, nobody has explicit legal permission to use or contribute to the code at all, regardless of the repo being public).

---

## D-016 - Security posture reviewed live against prod; email confirmation stays off despite the tradeoff

**Date:** 2026-07-06 · **Status:** Final

**Decision:** After a live probe of the deployed app's RLS policies (see `SECURITY.md` for the full table), no real security hole was found - every anon/authenticated write-boundary and cross-user access attempt tried was correctly blocked, and no raw-SQL injection surface exists in the client. Email confirmation stays off (per the earlier standing instruction not to re-enable it), accepted explicitly as trading data-theft risk (near zero, RLS handles that) for content-spam/vandalism risk (real - trivial mass account creation combined with D-012's auto-publish wiki-editing).

**Reasoning:** RLS is the *only* access-control layer here (no app server in front of Supabase), so it needed verifying against the real deployed DB with the real anon key, not just read off the migration files. It held. The one thing testing can't fix is the auth-friction tradeoff itself - that's a product call, not a bug, and was already made deliberately. Writing it into `SECURITY.md` (rather than leaving it as tribal knowledge) means the tradeoff is visible and revisitable rather than silently forgotten.

**Alternatives considered:** Re-enabling email confirmation now (rejected: directly contradicts the explicit standing instruction; also premature at near-zero traffic - the friction cost is real today and the abuse cost isn't yet). Adding app-level rate limiting immediately (rejected: no server to put it on without adding real infra cost/complexity, which fails D-010's zero-cost constraint; noted in `SECURITY.md` as a "before real growth" item instead of blocking on it now).

---

## D-017 - PWA basics via vite-plugin-pwa; offline map data is still a separate, unbuilt feature

**Date:** 2026-07-06 · **Status:** Final

**Decision:** Lamyig is installable as a PWA (manifest + auto-updating service worker via `vite-plugin-pwa`, `vite.config.ts`) - "Add to Home Screen" on mobile, standalone window on desktop. The service worker precaches the app shell (JS/CSS/HTML/icons) for fast repeat loads and offline-tolerant boot. It does **not** cache map tiles, place data, or photos - those still require a live connection, same as before. App icon is a placeholder: the same purple-square "L" mark already used in the header, not a final logo.

**Reasoning:** Installability and fast reloads are cheap to add (one dev dependency, zero ongoing cost - fits D-010) and give a real "feels like an app" improvement immediately. Conflating this with true offline support would misrepresent what shipped - D-005's offline-map requirement (Baatal, zero network, real data available with no signal) needs a much larger build (tile caching strategy, place/photo sync, cache invalidation) that this doesn't replace or shrink, exactly as D-014 already drew this line for "fly to region" vs. offline download.

**Alternatives considered:** Hand-rolled service worker (rejected: `vite-plugin-pwa` wraps Workbox, which is the standard, well-tested approach - no reason to hand-roll cache logic for an app-shell-only PWA). Waiting for the real logo before adding icons (rejected: blocks a cheap, independent win on an unrelated, harder task; icon file is trivially swappable later, matching how the header's own "L" mark is already an acknowledged placeholder).

---

## D-018 - General feedback button, separate from place reports

**Date:** 2026-07-07 · **Status:** Final

**Decision:** Added a "Send feedback" button next to Add Place, opening the same overlay pattern used everywhere else. Backed by a new `feedback` table (migration 0010), open to anonymous and signed-in submitters alike, with manual founder review only - no public read policy, same shape as `place_reports` (D-012).

**Reasoning:** `place_reports` exists for problems with a specific place, and requires auth. General product feedback (bugs, ideas, "this is confusing") doesn't fit that model and has real value from people who haven't signed up yet - restricting it to authenticated users would lose most of it. Mirrors an existing, already-reviewed RLS pattern instead of inventing a new one, keeps the founder as the single reviewer (matches D-012's manual-review-only stance), and needs no new infrastructure (D-010).

**Alternatives considered:** Routing feedback to a GitHub issue form (rejected: most travellers using Lamyig won't have GitHub accounts - this is a general-audience product, not a dev tool). A `mailto:` link (rejected: unreliable on mobile web/PWA where no email client may be configured, and gives up structured storage for zero benefit).

---

## D-019 - Second security pass after Auth/Feedback changes; fixed a broken (not exploitable) feedback insert policy

**Date:** 2026-07-07 · **Status:** Final

**Decision:** Re-ran the live RLS checks from D-016 after the Auth overlay rework and the new `feedback` table - all core boundaries (anon can't write places/regions, can't read reports, can't touch other profiles) still held, no regression. Found and fixed one real bug: the `feedback` insert policy from migration 0010 wasn't actually letting anonymous inserts through in production (verified live - RLS violation on every anon insert attempt), the opposite of the intended "anyone can submit" behavior. Migration 0011 re-creates the policy explicit about `to anon, authenticated` instead of relying on the implicit `PUBLIC` default, and adds a 5000-character cap on `message` since feedback is the only fully zero-friction (no-account-required) write path in the schema.

**Reasoning:** "Check security" should mean re-verifying live, not re-reading old findings - RLS is the only access-control layer here (SECURITY.md), so any schema change is worth a fresh check rather than assuming last time's result still holds. The broken policy was a functional bug, not a security hole (it was too restrictive, not too permissive), but it meant the feature shipped silently non-functional - worth catching before real users hit it.

**Alternatives considered:** Requiring auth for feedback too, closing the gap instead of capping it (rejected: loses feedback from people who haven't signed up, which was the whole point of not reusing `place_reports`' auth-gated model - see D-018).

---

## Open questions

- **Data license:** should Lamyig's place/region/village data be ODbL-compatible so it can flow back into OpenStreetMap? Separate from D-015's code license.
- **Governance:** who can merge data changes once contributors arrive?
- **Verification mechanics:** what exactly counts as "verified," and by whom?
- **Top bar contents:** exact contents of the top navigation bar (beyond featuring Spiti/Ladakh/treks) still to be decided.
- **Where does "Treks" fit the Region model?** India → State → Region → Village → Place assumes every popular destination is a place in that hierarchy. Spiti/Ladakh/Zanskar/Sikkim fit as Regions; "Treks" (docs/07-information-architecture.md's fifth popular destination) doesn't - a trek crosses villages and regions. Left unseeded in `supabase/seed.sql` pending a decision: is it a tag/collection over existing Places, its own entity, or something else?
