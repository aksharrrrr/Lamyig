# Contributing to Lamyig

Two very different ways to contribute, and both matter equally — most won't be code at all.

## Contribute data (no code required)

The map only works if travellers and locals actually add and verify places. This is the main way most people will contribute.

- **Add a place** — sign in at [www.lamyig.in](https://www.lamyig.in) and use **+ Add a place**.
- **Verify something's still accurate** — tap "Still accurate" on any place you can personally confirm.
- **Fix something wrong** — any signed-in user can edit any place (wiki-style — see D-012 in [`docs/14-decision-log.md`](docs/14-decision-log.md)). Just fix it directly.
- **Flag spam or bad content** — use "Report." It's reviewed manually for now; there's no automated takedown.

### The rule that matters most: no self-promotion

Lamyig documents what's actually there — it isn't advertising space. If you run a homestay, a mechanic shop, anything — you're welcome to add factual information about it (location, what it offers, price range). You're not welcome to write it like an ad, add it more than once, or use Community Notes to promote rather than inform. This is a travel-community knowledge base first; places that read like marketing get reported and removed.

## Contribute code

### Local setup

You'll need your own free Supabase project — Lamyig never shares production credentials with contributors. Your local copy talks to your own test project; production (`www.lamyig.in`) stays on the maintainer's account and only gets updated when a PR is merged to `main`.

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run every file in [`supabase/migrations/`](supabase/migrations) **in filename order** (`0001_...` through the latest), then run [`supabase/seed.sql`](supabase/seed.sql). This gives you the same schema, RLS policies, and starter regions as production.
3. Get a free [LocationIQ](https://locationiq.com) token (used for map search/geocoding).
4. Clone and configure:

   ```bash
   git clone https://github.com/aksharrrrr/Lamyig.git
   cd Lamyig
   npm install
   cp .env.example .env   # fill in your own Supabase project's URL + anon key, and your LocationIQ token
   npm run dev
   ```

Your `.env` stays local and gitignored — never commit it, and never open a PR containing real keys.

- **Read [`docs/14-decision-log.md`](docs/14-decision-log.md) before a change that seems to contradict something.** Most "why didn't they just..." questions are already answered there, with the reasoning and alternatives considered.
- **The full product spec is in [`docs/`](docs)** — start with [`docs/00-executive-summary.md`](docs/00-executive-summary.md) if you want the whole picture.
- **Database changes go in `supabase/migrations/`** as a new numbered file. Never edit an already-committed migration — if something needs fixing, that's a new migration.
- **Small, focused PRs** against `main` beat one large one.
- **Match what's already there** before introducing a new pattern — this codebase is still small enough that consistency matters more than any one file being "more correct."
- **A pre-commit hook lints staged files automatically** (`npm install` sets it up via husky) — commits with an `oxlint` error are rejected. Fix the error rather than reaching for `--no-verify`.

By contributing code, you agree it's licensed under this repo's [MIT License](LICENSE).

### Open an issue before a PR

**Open an issue first, before raising a pull request.** This keeps design discussion and proposed approaches in one place instead of scattered across PR reviews. A PR with no linked issue will be closed without review — reopen it once there's an issue to point to.

Exception: trivial fixes (typos, broken links, obvious docs corrections) can go straight to a PR.

### Branching & review

`main` is protected and auto-deploys straight to production (www.lamyig.in) on every push, so it isn't a free-for-all:

1. Open an issue describing the bug or proposed change, if you haven't already (see above).
2. Branch off `main`, named `<type>/short-description` (kebab-case description):
   - `feat/` — new functionality
   - `fix/` — bug fix
   - `docs/` — documentation only
   - `chore/` — tooling, deps, cleanup, no user-facing change
   - `daily/YYYY-MM-DD` — reserved for the maintainer's own end-of-day batches, not for external contributions

   e.g. `git checkout -b fix/geolocate-button-overlap`
3. Open a pull request against `main` instead of pushing directly, linking the issue from step 1. GitHub branch protection enforces the no-direct-push part for anyone without admin rights on the repo.
4. Describe what changed and why in the PR body — link the relevant `docs/14-decision-log.md` entry if the change touches something already decided.
5. Get it reviewed before merging. Right now that's the maintainer signing off; as more regular contributors join, this moves to requiring at least one approval from someone other than the author.
6. Squash-merge once approved. Delete the branch after.

Force-pushes and branch deletion are disabled on `main` at the repo level — that's not a suggestion, GitHub blocks it outright.

## Have a question or an idea that isn't a PR yet?

Open a GitHub issue. Use the `limitation` label for free-tier constraints of a service we depend on, `vision` for long-term direction, or no label if neither fits.
