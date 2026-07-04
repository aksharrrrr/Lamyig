# Product Decision Log

Every major decision, its reasoning, and the alternatives considered. New contributors should read this before proposing changes — most "why didn't you just…" questions are answered here.

Format: **Decision · Date · Status (Final / Provisional) · Reasoning · Alternatives considered**

---

## D-001 — The project is named Lamyig

**Date:** 2026-07-03 · **Status:** Final

**Decision:** The project is named **Lamyig** (ལམ་ཡིག), the Tibetan word for a handwritten route guidebook — literally "road writing."

**Reasoning:** Evaluated against four naming criteria:

1. *Meaning* — a lamyig is historically the exact artifact we are building: a book of routes, stops, water sources, and dangers for Himalayan travellers. Guides to hidden valleys (beyul) were written as lamyigs. The name encodes the mission without metaphor.
2. *Distinctiveness* — search found essentially no collisions (one dormant webpage). GitHub org, app-store name, and domain are ownable.
3. *Usability* — six letters, two syllables ("lum-yig"), spellable after hearing it once.
4. *Extensibility* — a road-book contains everything on the road, so adding mechanics, water points, campsites, and new regions never breaks the name.

**Alternatives considered:** *Atlas* (working codename — generic, unownable), *Beyul* (perfect meaning, but heavily colliding: a Nepali trekking company, a travel-tech firm at beyul.com, others), *Terma* (hidden treasure — good metaphor, multiple collisions), *Satra* (Tibetan for "map" — strong runner-up, less story), *Néyig* (pilgrimage guidebook — spelling/pronunciation friction).

---

## D-002 — Lamyig is a knowledge map, not a booking platform

**Date:** 2026-07-03 · **Status:** Final

**Decision:** Lamyig documents and helps discover places and travel knowledge. It does not process bookings, payments, or commissions.

**Reasoning:** The founding insight is that a traveller in remote India needs a room once a day but information twenty times a day. Booking is the most-served slice of the problem (and the one commercial platforms already fight over); knowledge is the unserved 95%. Staying out of transactions also keeps hosts' economics untouched — no 15–25% commission pressure — which is why they'd want to be listed at all.

**Alternatives considered:** Homestay booking platform (original idea); hybrid directory-plus-booking (scope trap, and re-creates the commission problem).

---

## D-003 — V1 covers Spiti only

**Date:** 2026-07-03 · **Status:** Superseded by D-009 (2026-07-03)

**Decision:** Version 1 covers Spiti Valley. Expansion order: Spiti → Spiti + Zanskar → Himachal → Ladakh → India, each step gated on data quality.

**Reasoning:** The competitive advantage is verified quality, not coverage. 400 incredible verified places beat 40,000 poor listings. Spiti is where the founder has firsthand field knowledge, which makes seed data and verification credible.

**Alternatives considered:** Launch India-wide (rejected: quality collapses, verification impossible, classic scope-death).

---

## D-004 — Structured facts + Community Notes instead of star ratings

**Date:** 2026-07-03 · **Status:** Final

**Decision:** Places carry structured, verifiable facts (open hours, services, "cash only," "last verified May 2026 by 14 riders") and free-text community notes. No star ratings, no likes.

**Reasoning:** Ratings measure popularity and optimise for whoever manages their listing hardest — exactly the game remote hosts can't play. Facts decay gracefully (a "last verified" date tells you how much to trust them); a 4.2-star average tells you nothing in a village with three reviews. Facts also serve the emergency use case (is the mechanic open now?) that ratings never can.

**Alternatives considered:** Star ratings + reviews (rejected as above); ratings-later (deferred to the roadmap discussion — logged here so we remember why we resisted).

---

## D-005 — Offline-first is a product requirement, not a feature

**Date:** 2026-07-03 · **Status:** Final

**Decision:** Every core experience — map, places, search within a downloaded region — must work with zero connectivity. A traveller downloads a region pack (e.g., "Spiti, ~130 MB") and the product is fully useful from then on.

**Reasoning:** The places Lamyig serves best are precisely the places without network (Baatal: no network, no nearby village). An online-first product would fail exactly where it matters most. This constraint drives architecture, so it is decided at the product level.

**Alternatives considered:** Online-first with cached tiles (fails the founding use case).

---

## D-006 — Build on the OpenStreetMap ecosystem; never build a mapping engine

**Date:** 2026-07-03 · **Status:** Final

**Decision:** Lamyig uses existing open mapping technology (OpenStreetMap data, open map rendering libraries). Our energy goes exclusively into the layer nobody else has: curated, verified, community-maintained travel knowledge.

**Reasoning:** A mapping engine is a decade of work that already exists in open source. The differentiation is the data, not the tiles.

**Alternatives considered:** Custom mapping stack (rejected: scope-death), Google Maps SDK (rejected: cost at scale, licensing restricts open data).

---

## D-007 — Documentation lives in Markdown on GitHub, and is written before code

**Date:** 2026-07-03 · **Status:** Final

**Decision:** The product handbook is version-controlled Markdown in this repository. It is the source of truth; PDF/DOCX are exports. The handbook is written in present tense, as if Lamyig exists ("Lamyig organises…", not "we should build…"). Plain text, no visual design.

**Reasoning:** The project is open source; product decisions should be reviewable and pull-requestable exactly like code. Present tense forces decisions instead of speculation. The document contains only decisions actually made — no invented user research, no fabricated metrics.

**Alternatives considered:** Word/Google Docs source of truth (not version-controllable alongside code); generating a 50-page document up front (rejected: it would require inventing research that hasn't happened).

---

## D-008 — Tech direction: PWA, React, MapLibre, Supabase

**Date:** 2026-07-03 · **Status:** Superseded by D-010 (2026-07-03)

**Decision (provisional):** Progressive Web App built in React, MapLibre GL for rendering, OpenStreetMap data, Supabase (free tier) for database/auth/storage, free-tier static hosting.

**Reasoning:** Zero-budget constraint; single builder; PWA avoids app-store friction and enables offline caching; every component has a genuinely free tier at MVP scale. Held provisional because offline sync and tile hosting need real technical evaluation before we commit in writing.

---

## D-009 — Lamyig is India-wide; knowledge is organised India → State → Region → Village → Place; the map is one interface, not the product

**Date:** 2026-07-03 · **Status:** Final

**Decision:** Lamyig's scope is India, not Spiti alone — this supersedes D-003. Spiti, Ladakh, Zanskar, Sikkim, and major treks are the founder-seeded, featured starting regions, surfaced as "Popular destinations" on the homepage — they are entry points, not the product boundary. All knowledge is organised in a fixed geographic hierarchy: India → State → Region → Village → Place. Every searchable thing (homestay, mechanic, fuel stop, toilet, water point, viewpoint, etc.) is a **Place** — the category varies, the underlying object doesn't.

Lamyig is fundamentally a knowledge platform, not a mapping product. The map is one interface for exploring the knowledge (via the homepage's "Community map" section and each Region/Village page's "Open Map"), not the product itself.

On first open, the app shows a live map of India with no forced setup; if location permission is granted, the map centers on the user. A search bar resolves Region, Village, or Place by name (e.g. "Spiti," "Losar," "Dorje Homestay") — natural-language search is explicitly out of scope for V1. Selecting a region opens a **Region Page** (description, offline download, popular villages, community stats, "Open Map") rather than jumping straight to the map, and every village gets its own page as a local information hub. See [`07-information-architecture.md`](07-information-architecture.md).

**Reasoning:** The founder's original idea came from a Spiti/Zanskar trip, which is why early framing (D-003) scoped V1 to Spiti — but the underlying problem (fragmented travel knowledge, invisible local services) is not Spiti-specific, it's true of remote India generally. Scoping the *product* to Spiti would have limited the Reddit/community-driven growth loop to a single valley; scoping the *seed data* to Spiti (where the founder has firsthand verified knowledge) keeps launch quality high without limiting the product's addressable audience. Region/Village pages before the map give context (why this place matters, what's known about it) instead of dropping a traveller onto a bare pin.

**Alternatives considered:** Spiti-only V1 with staged geographic rollout (original D-003 — rejected: unnecessarily constrains the community-growth loop the launch plan depends on); map-first homepage with no Region/Village pages (rejected: loses the "knowledge platform, not a map" positioning, and gives no context before exploration).

---

## D-010 — Tech stack: React + TypeScript + Vite + Tailwind, MapLibre + OpenStreetMap, Supabase, Cloudflare Pages/Vercel

**Date:** 2026-07-03 · **Status:** Final

**Decision:** Frontend is React, TypeScript, Vite, and Tailwind. Maps use OpenStreetMap data rendered with MapLibre GL (per D-006 — no custom mapping engine). Backend is Supabase (database + storage), with Supabase Auth for authentication. Hosting is Cloudflare Pages or Vercel, both free tier. This finalizes D-008, adding TypeScript, Vite, and Tailwind to the stack and removing "provisional" status.

**Reasoning:** Same zero-budget, single-builder constraint as D-008 — every layer of this stack has a genuine free tier at MVP scale. TypeScript/Vite/Tailwind is a standard, low-friction combination for a single builder to move fast in.

**Alternatives considered:** See D-008 and D-006.

---

## D-011 — No comments, no gamification; browsing is open, contributing requires an account

**Date:** 2026-07-03 · **Status:** Final

**Decision:** Beyond no star ratings (D-004), Lamyig also excludes general comment/discussion threads and all gamification (points, coins, badges, leaderboards, streaks). Browsing requires no account; contributing (via the "+" → select Place type → fill details → upload 3+ photos → submit flow) requires one.

**Reasoning:** Comment threads add moderation burden without adding structured, reusable information — a Community Note already covers the "useful observation" case. Gamification optimizes for engagement metrics, not contribution quality, and cuts against Facts Over Ratings (D-004) and Information Over Features (see [`06-product-philosophy.md`](06-product-philosophy.md)). Open browsing keeps the product useful to a traveller with zero setup (see D-009); requiring an account only to contribute keeps data attributable without gating the core use case.

**Alternatives considered:** Light gamification to drive contribution volume (rejected: past experience with review platforms shows this games the system rather than improving data quality); account-gated browsing (rejected: directly contradicts the zero-friction, open-on-first-launch experience in D-009).

---

## D-012 — Auto-publish, wiki-style editing, one-tap verification

**Date:** 2026-07-03 · **Status:** Final

**Decision (provisional):** A submitted Place goes live immediately, no review queue. Any logged-in user can edit any Place afterward (wiki-style) — the Place's "last updated"/"added by" fields track the most recent editor, not just the original contributor. A Place's "last verified" date and verifier count (e.g. "verified May 2026 by 14 riders," per D-004) update via a one-tap "Still accurate" button — no re-submission required. Every Place also carries a lightweight "Report" action (reason: spam / incorrect / closed / duplicate) that writes a record for the founder to review manually — no automated hide/takedown in V1, since auto-hiding on flag count is itself abusable and a moderation dashboard is out of scope for V1 (see Out of scope, below).

**Reasoning:** Matches the OSM/Wikipedia model already committed to in D-006, and directly serves Keep It Simple + Community First (`docs/06-product-philosophy.md`). A review queue would make the solo founder a bottleneck the moment the Reddit launch drives a spike in submissions — the opposite of the community-growth loop D-009's launch plan depends on. One-tap verify keeps the "few seconds while travelling" behavior that field research (`03-field-research.md`) validated; a full re-submission would kill it.

**Alternatives considered:** Review queue before publish (rejected: founder bottleneck, contradicts zero-team constraint); edit restricted to original contributor (rejected: guarantees stale data whenever the original adder doesn't return, undermines "last verified" trust signal); automated flag-count takedown (rejected: new attack surface — coordinated false-flagging could remove real, correct places).

---

## D-013 — Auth: email/password + Google OAuth only

**Date:** 2026-07-03 · **Status:** Final

**Decision (provisional):** Contributing requires signing in via Supabase Auth, using either email/password or Google OAuth. No phone/OTP login in V1.

**Reasoning:** Both methods are free at Supabase's tier, matching the zero-cost objective in D-010. Google OAuth is near-zero-friction for most travellers. Phone OTP costs money per SMS at scale and is least reliable exactly where Lamyig matters most — poor-signal remote regions — so it would fail its own use case.

**Alternatives considered:** Add phone/OTP (rejected for V1: cost + reliability, both discussed above; can revisit once there's usage data to justify the SMS spend).

---

## Open questions

- **Licensing:** code license (MIT? Apache 2.0?) and — more importantly — data license. OpenStreetMap uses ODbL for data; we should study whether Lamyig data should be ODbL-compatible so it can flow back into OSM.
- **Governance:** who can merge data changes once contributors arrive?
- **Verification mechanics:** what exactly counts as "verified," and by whom?
- **Top bar contents:** exact contents of the top navigation bar (beyond featuring Spiti/Ladakh/treks) still to be decided.
- **Where does "Treks" fit the Region model?** India → State → Region → Village → Place assumes every popular destination is a place in that hierarchy. Spiti/Ladakh/Zanskar/Sikkim fit as Regions; "Treks" (docs/07-information-architecture.md's fifth popular destination) doesn't — a trek crosses villages and regions. Left unseeded in `supabase/seed.sql` pending a decision: is it a tag/collection over existing Places, its own entity, or something else?
