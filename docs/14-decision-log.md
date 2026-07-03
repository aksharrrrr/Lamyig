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

**Date:** 2026-07-03 · **Status:** Final

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

**Date:** 2026-07-03 · **Status:** Provisional — to be confirmed in the engineering section

**Decision (provisional):** Progressive Web App built in React, MapLibre GL for rendering, OpenStreetMap data, Supabase (free tier) for database/auth/storage, free-tier static hosting.

**Reasoning:** Zero-budget constraint; single builder; PWA avoids app-store friction and enables offline caching; every component has a genuinely free tier at MVP scale. Held provisional because offline sync and tile hosting need real technical evaluation before we commit in writing.

---

## Open questions

- **Licensing:** code license (MIT? Apache 2.0?) and — more importantly — data license. OpenStreetMap uses ODbL for data; we should study whether Lamyig data should be ODbL-compatible so it can flow back into OSM.
- **Ratings, forever-no or not-yet?** D-004 rejects ratings for V1; whether that is a permanent philosophy ("Things Lamyig Will Never Become") needs an explicit call.
- **Governance:** who can merge data changes once contributors arrive?
- **Verification mechanics:** what exactly counts as "verified," and by whom?
