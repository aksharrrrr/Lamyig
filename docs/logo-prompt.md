# Logo generation prompt

For use with an AI image tool (Midjourney, DALL·E, Ideogram, etc). Two variants below: icon mark (for app icon/favicon) and full wordmark lockup.

## Context to give the tool

**Name:** Lamyig (ལམ་ཡིག), Tibetan. "Lam" = road/path. "Yig" = letter/script/text. Together: literally "road-book" — historically the term for Tibetan guide-texts written for travelers and pilgrims, recording routes, landmarks, water sources, places to rest, what to expect ahead. Written and passed on by people who had actually walked the path, for people about to walk it.

**Project:** Lamyig is the modern version of that same idea — an open-source, community-maintained travel knowledge base for remote India, starting with the Himalaya (Spiti, Ladakh, Zanskar, Sikkim). Not a booking platform, not a star-ratings app. A living, wiki-style record of real places (homestays, mechanics, fuel, toilets, camping spots) kept accurate by travelers and locals who've actually been there. The goal: become the same kind of trusted, community-passed-down guide the old lamyig texts were, for a new generation of travelers, digital instead of paper, but with the same spirit — practical, honest, written by the road, not by advertisers.

## Icon mark prompt (for app icon / favicon)

```
A minimalist vector app icon logo for "Lamyig," a Himalayan travel guide app. Concept: fuse the idea of a mountain path/trail with the idea of a written page or open book, since "Lamyig" means "road-book" in Tibetan — a travel guide literally written along the road. Show a single, simplified switchback mountain trail or road that folds/creases like a page or an open book, or a trail that becomes a subtle line of script/text as it winds upward toward a peak. Flat geometric style, single continuous line or simple bold shapes, no photorealism, no gradients-heavy skeuomorphism, no fine detail that would break at 16px. Must read clearly as a small square icon. Color palette: deep violet-purple (#863bff) as the dominant/background color, white or off-white (#fdfdfc) for the mark itself, optional small accent of rusty, aged-paper tan (#B39F85) — like the color of an old book page. Warm, confident, trustworthy feeling — like a trail marker or a waymark stone, not a corporate tech logo. No text, no letters, no border decoration. Centered, generous padding, works equally well as a circle-masked (Android adaptive icon) and square icon.
```

## Full wordmark / brand lockup prompt

```
A logo lockup for "Lamyig," an open-source community travel guide for the Himalaya and remote India. "Lamyig" (Tibetan: ལམ་ཡིག) means "road-book" — lam (road/path) + yig (letter/script) — the traditional term for a hand-written pilgrim's guide recording a route: what's ahead, where to rest, where to find water, written by those who walked it before. Design a mark that pairs a simple geometric symbol with the wordmark "Lamyig." The symbol should suggest a mountain trail folding into the shape of a page, or a winding path that resolves into a single brushstroke reminiscent of Tibetan script, without literally rendering Tibetan characters. Typography: clean, warm, modern sans-serif, confident but not corporate — should feel handmade/trustworthy, like something stamped on a trail signpost, not a startup SaaS logo. Palette: deep violet-purple (#863bff) as primary, dark charcoal-ink (#201f23) for text on light backgrounds, warm off-white/stone background (#e9e7e2), optional rusty aged-paper tan accent (#B39F85, like an old book page) used sparingly — fitting, given "yig" means script/page. Mood: grounded, practical, well-traveled, community-made — not flashy, not luxury-travel, not adventure-extreme-sports. Should look equally at home on a phone app icon, a printed trail sign, and a t-shirt. No stock mountain clipart, no generic compass/globe icons, no gradients that won't survive being printed in one color.
```

## Story-driven prompt (for Fable)

The two prompts above are generic — this one is built directly from the actual founder story, the vision, and the current title, for a richer/more specific take rather than a generic "mountain travel app" brief.

**Title:** Lamyig: the open road-book for remote India.

**The story behind it** (see `docs/01-founder-story.md`): the founder rode a motorcycle solo through Spiti. In tourist towns, online-listed rooms ran ₹3,000–5,000/night. In Shego, a village before Kaza, a family took him in for ₹800 with home-cooked meals, found only because he stopped to rest and they noticed him — same in Losar, Gue, Shichling. None of those homestays were on any map or booking site, not because they weren't good, but because their hosts had no way into an online economy built on commission, and often no reliable signal to try anyway. Then a puncture near Reckong Peo, no signboard, no listing, nothing — and the realization that you need a room once a day but *information* twenty times a day: fuel, mechanics, network coverage, clean water, road conditions. That knowledge already exists — in tea-stall conversations, in what the last rider who passed through knows — it just isn't written down anywhere searchable.

**The vision:** not a booking platform, not another map, not a review site. A wiki-style factual record — homestays, mechanics, fuel, toilets, camping — kept accurate by the travelers and locals who actually know, facts over star ratings, free and open-source, offline-tolerant by design. The digital-era version of the old Tibetan *lamyig*: a hand-written road-book carrying a route's practical truth from the people who'd walked it to the people about to.

```
A logo for "Lamyig" (Tibetan: ལམ་ཡིག, "road-book"), an open-source community travel guide for remote India. Ground the concept in a specific true story, not generic travel iconography: a lone motorcycle traveler in the Himalaya finding real hospitality and real help — a homestay, a puncture repair, a tea-stall's worth of local knowledge — not through any app or listing, but through people who'd already been down the road. The mark should feel like something handed down, not looked up: a single road or trail that folds into the shape of an open page or a hand-written line, evoking a route recorded by whoever walked it before you. Avoid: a literal motorcycle, a literal teacup, anything that reads as a specific vehicle or scene — keep it to the essential shapes (road, page, peak) so it stays a mark, not an illustration. Style: warm, handmade, confident — like a waymark stone or a trail signpost carved by someone who's actually been there, not a startup app icon. Flat, simple, geometric enough to survive at 16px. Palette: warm rust/terracotta and aged-paper tan (#B39F85, #C1694F), warm off-white/stone background (#e9e7e2), dark charcoal-ink (#201f23) for any linework or type — no purple, no cool blues, no tech-startup gradient. No text unless doing a full wordmark lockup; if lockup, pair the mark with "Lamyig" set in a clean, warm, unpretentious sans-serif, not a display/script font trying to look "adventurous." Should look at home stamped on a trail signpost or a t-shirt, not on a SaaS landing page.
```

## Notes for whoever's picking the result

- A real logo already exists and is live (mountain/river/open-book mark, tan/rust palette) — see `docs/brand/logo-source.png` and `public/pwa-512x512.png`. Anything generated from these prompts should be judged against that, not against an empty slate — it needs to be a genuine improvement or a deliberate alternate direction, not a random re-roll.
- Current brand palette: `#B39F85` (primary tan/rust, used for the accent color, map pins default, and the logo background) plus per-category colors (terracotta, slate, amber, sage, plum — see `src/lib/categories.ts`). No purple anywhere in the app anymore.
- Whatever's chosen needs to work at: 16×16 favicon, app icon (192/512, plus a maskable/safe-zone variant), and the small header-nav mark (`src/pages/Home.tsx`, `src/assets/header-mark.png`).
