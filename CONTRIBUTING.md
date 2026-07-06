# Contributing to Lamyig

Two very different ways to contribute, and both matter equally — most won't be code at all.

## Contribute data (no code required)

The map only works if travellers and locals actually add and verify places. This is the main way most people will contribute.

- **Add a place** — sign in at [lamyig.vercel.app](https://lamyig.vercel.app) and use **+ Add a place**.
- **Verify something's still accurate** — tap "Still accurate" on any place you can personally confirm.
- **Fix something wrong** — any signed-in user can edit any place (wiki-style — see D-012 in [`docs/14-decision-log.md`](docs/14-decision-log.md)). Just fix it directly.
- **Flag spam or bad content** — use "Report." It's reviewed manually for now; there's no automated takedown.

### The rule that matters most: no self-promotion

Lamyig documents what's actually there — it isn't advertising space. If you run a homestay, a mechanic shop, anything — you're welcome to add factual information about it (location, what it offers, price range). You're not welcome to write it like an ad, add it more than once, or use Community Notes to promote rather than inform. This is a travel-community knowledge base first; places that read like marketing get reported and removed.

## Contribute code

```bash
git clone https://github.com/aksharrrrr/Lamyig.git
cd Lamyig
npm install
cp .env.example .env   # fill in your own Supabase project's URL + anon key
npm run dev
```

- **Read [`docs/14-decision-log.md`](docs/14-decision-log.md) before a change that seems to contradict something.** Most "why didn't they just..." questions are already answered there, with the reasoning and alternatives considered.
- **The full product spec is in [`docs/`](docs)** — start with [`docs/00-executive-summary.md`](docs/00-executive-summary.md) if you want the whole picture.
- **Database changes go in `supabase/migrations/`** as a new numbered file. Never edit an already-committed migration — if something needs fixing, that's a new migration.
- **Small, focused PRs** against `main` beat one large one.
- **Match what's already there** before introducing a new pattern — this codebase is still small enough that consistency matters more than any one file being "more correct."

By contributing code, you agree it's licensed under this repo's [MIT License](LICENSE).

## Have a question or an idea that isn't a PR yet?

Open a GitHub issue. Use the `limitation` label for free-tier constraints of a service we depend on, `vision` for long-term direction, or no label if neither fits.
