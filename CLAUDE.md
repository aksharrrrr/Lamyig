# Working in this repo

## Git workflow

`main` is protected and auto-deploys to production (www.lamyig.in) on every push.

- GitHub branch protection on `main`: PR required (0 required approvals currently), no force-push, no branch deletion. `enforce_admins` is **off**, so an admin token can still push directly — don't use that shortcut.
- Never push directly to `main`. Work on a branch and open a PR. Naming convention (see [`CONTRIBUTING.md`](CONTRIBUTING.md)): `feat/`, `fix/`, `docs/`, `chore/` prefix + kebab-case description; `daily/YYYY-MM-DD` is reserved for the maintainer's own end-of-day batches.
- Commit small, logical chunks with real messages — not one giant end-of-day diff.
- Never commit secrets — `.env`/`.env.local` stay gitignored, `.env.example` keeps empty placeholders.
- A pre-commit hook (husky + lint-staged, `.husky/pre-commit`) runs `oxlint` on staged `.ts`/`.tsx` files and blocks the commit on error. Runs automatically after `npm install` (`prepare` script) — don't bypass with `--no-verify`.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full contributor-facing version of this, and [`docs/14-decision-log.md`](docs/14-decision-log.md) before any change that seems to contradict existing product decisions.
