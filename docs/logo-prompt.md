# Logo generation prompt

The original icon-mark and wordmark prompts used to generate the current live logo (`docs/brand/logo-source.png`) have been removed — they've served their purpose. What's left below is a newer, story-driven prompt that hasn't been tried yet, for anyone who wants to explore an alternate direction.

## Context to give the tool

**Name:** Lamyig (ལམ་ཡིག), Tibetan. "Lam" = road/path. "Yig" = letter/script/text. Together: literally "road-book" — historically the term for Tibetan guide-texts written for travelers and pilgrims, recording routes, landmarks, water sources, places to rest, what to expect ahead.

**Title:** Lamyig: the open road-book for remote India.

**The story behind it** (see `docs/01-founder-story.md`): the founder rode a motorcycle solo through Spiti. In tourist towns, online-listed rooms ran ₹3,000–5,000/night. In Shego, a village before Kaza, a family took him in for ₹800 with home-cooked meals, found only because he stopped to rest and they noticed him — same in Losar, Gue, Shichling. None of those homestays were on any map or booking site, not because they weren't good, but because their hosts had no way into an online economy built on commission, and often no reliable signal to try anyway. Then a puncture near Reckong Peo, no signboard, no listing, nothing — and the realization that you need a room once a day but *information* twenty times a day: fuel, mechanics, network coverage, clean water, road conditions. That knowledge already exists — in tea-stall conversations, in what the last rider who passed through knows — it just isn't written down anywhere searchable.

**The vision:** not a booking platform, not another map, not a review site. A wiki-style factual record — homestays, mechanics, fuel, toilets, camping — kept accurate by the travelers and locals who actually know, facts over star ratings, free and open-source, offline-tolerant by design. The digital-era version of the old Tibetan *lamyig*: a hand-written road-book carrying a route's practical truth from the people who'd walked it to the people about to.

## Story-driven prompt (for Fable)

```
A logo for "Lamyig" (Tibetan: ལམ་ཡིག, "road-book"), an open-source community travel guide for remote India. Ground the concept in a specific true story, not generic travel iconography: a lone motorcycle traveler in the Himalaya finding real hospitality and real help — a homestay, a puncture repair, a tea-stall's worth of local knowledge — not through any app or listing, but through people who'd already been down the road. The mark should feel like something handed down, not looked up: a single road or trail that folds into the shape of an open page or a hand-written line, evoking a route recorded by whoever walked it before you. Avoid: a literal motorcycle, a literal teacup, anything that reads as a specific vehicle or scene — keep it to the essential shapes (road, page, peak) so it stays a mark, not an illustration. Style: warm, handmade, confident — like a waymark stone or a trail signpost carved by someone who's actually been there, not a startup app icon. Flat, simple, geometric enough to survive at 16px. Palette: warm rust/terracotta and aged-paper tan (#B39F85, #C1694F), warm off-white/stone background (#e9e7e2), dark charcoal-ink (#201f23) for any linework or type — no purple, no cool blues, no tech-startup gradient. No text unless doing a full wordmark lockup; if lockup, pair the mark with "Lamyig" set in a clean, warm, unpretentious sans-serif, not a display/script font trying to look "adventurous." Should look at home stamped on a trail signpost or a t-shirt, not on a SaaS landing page.
```

## Notes for whoever's picking the result

- A real logo already exists and is live (mountain/river/open-book mark, tan/rust palette) — see `docs/brand/logo-source.png` and `public/pwa-512x512.png`. Anything generated from this prompt needs to be a genuine improvement or a deliberate alternate direction, not a random re-roll.
- Current brand palette: `#B39F85` (primary tan/rust) plus per-category colors (terracotta, slate, amber, sage, plum — see `src/lib/categories.ts`). No purple anywhere in the app.
- Whatever's chosen needs to work at: 16×16 favicon, app icon (192/512, plus a maskable/safe-zone variant), and the small header-nav mark (`src/pages/Home.tsx`, `src/assets/header-mark.png`).
