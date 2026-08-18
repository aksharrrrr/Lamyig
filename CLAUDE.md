# Working in this repo

## Git workflow

`main` is protected and auto-deploys to production (www.lamyig.in) on every push.

- GitHub branch protection on `main`: PR required (0 required approvals currently), no force-push, no branch deletion. `enforce_admins` is **off**, so an admin token can still push directly - don't use that shortcut.
- Never push directly to `main`. Work on a branch and open a PR. Naming convention (see [`CONTRIBUTING.md`](CONTRIBUTING.md)): `feat/`, `fix/`, `docs/`, `chore/` prefix + kebab-case description; `daily/YYYY-MM-DD` is reserved for the maintainer's own end-of-day batches.
- Commit small, logical chunks with real messages - not one giant end-of-day diff.
- Never commit secrets - `.env`/`.env.local` stay gitignored, `.env.example` keeps empty placeholders.
- A pre-commit hook (husky + lint-staged, `.husky/pre-commit`) runs `oxlint` on staged `.ts`/`.tsx` files and blocks the commit on error. Runs automatically after `npm install` (`prepare` script) - don't bypass with `--no-verify`.

### Maintainer-directed development sessions

When the maintainer asks to work continuously on the product, use the persistent `dev` branch for all fixes and additions instead of creating a branch per change. Do not commit or push during the session until the maintainer explicitly asks. At handoff, make small logical commits, push `dev`, and merge it through one PR. Do not delete `dev` after merging; it is the continuing development branch. These instructions override the normal per-change branch and post-merge deletion guidance below for maintainer-directed sessions only.

## UI consistency gate

- The map is the persistent product canvas. Every in-app page that is panel-like UI or supporting information—including Profile, Info/Vision, Feedback, authentication, offline maps, regions, Privacy, and Terms—must open in the shared `Overlay` component with Home still mounted behind it, including cold/direct URLs.
- Do not introduce a standalone card-on-blank-background page when the same content can use the established desktop modal/mobile bottom-sheet pattern.
- Reuse existing tokens, typography, spacing, button treatments, copy voice, and interaction patterns before adding a new one. Any new route or visible state must be checked on desktop and mobile for consistency with neighboring screens.
- A direct/shared URL may still be represented in the address bar, but closing its overlay must return safely to the map rather than leaving the site.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full contributor-facing version of this, and [`docs/14-decision-log.md`](docs/14-decision-log.md) before any change that seems to contradict existing product decisions.
