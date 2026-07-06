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

## Notes for whoever's picking the result

- The current in-app placeholder is a plain purple square with a white "L" (matches header nav) — anything meaningfully better than that clears the bar.
- `public/favicon.svg` already has an abstract purple/blue blob-mountain mark from the original design import — worth comparing any new result against it; it may already be close to usable as-is with a cleanup pass instead of a full regen.
- Whatever's chosen needs to work at: 16×16 favicon, app icon (192/512, plus a maskable/safe-zone variant), and the small 28px mark in the header nav (`src/pages/Home.tsx`).
