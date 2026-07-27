# Security

## Reporting a vulnerability

Open a GitHub issue, or if it's sensitive enough that it shouldn't be public until fixed, email the address listed on the maintainer's GitHub profile. There's no bug bounty - this is a solo-maintained community project - but real reports are taken seriously and fixed promptly.

## The security model, in short

Lamyig's backend is entirely Supabase (Postgres + PostgREST). There is no custom API server - the browser talks directly to Supabase using the public `anon` key, and **Postgres Row Level Security (RLS) is the only access control layer**. There's no separate application-level auth check anywhere; if RLS gets it wrong, that's the whole security boundary failing, not one of several layers.

This was verified live against the deployed app on 2026-07-06 and re-verified on 2026-07-07 after later changes (Auth overlay rework, the `feedback` table), not just assumed from the migration files that define it (`supabase/migrations/`):

| Attempted action | Actor | Result |
|---|---|---|
| Read regions/villages/places | anonymous (no login) | Allowed - browsing is intentionally open (D-011) |
| Insert a region or village | anonymous | Blocked |
| Insert a place | anonymous | Blocked |
| Read `place_reports` | anonymous | Blocked - reports are maintainer-only, by design (D-012) |
| Update another user's profile | anonymous | Blocked |
| Insert a `place_verifications` row claiming to be a *different* signed-in user (impersonation) | authenticated attacker | Blocked |
| Delete any place | authenticated attacker | Blocked - no delete policy exists for any table, for anyone, including the place's own author |
| Update a *different* real user's profile | authenticated attacker | Blocked |

No raw SQL execution path exists anywhere in the client (`grep -rn ".rpc(\|raw(\|\.sql(" src/` turns up nothing) - every query goes through `supabase-js`'s parameterized query builder, so classic SQL injection isn't a realistic vector here.

## Known, accepted tradeoffs - not bugs

- **`feedback` accepts fully anonymous inserts, no account required** (migration 0010/0011). Every other write path in the schema (adding a place, verifying, reporting, community notes) requires a signed-in account, which is at least some deterrent against automated abuse even with email confirmation off. Feedback has none - deliberately, since feedback from someone who hasn't signed up yet is still worth having. Mitigated with a 5000-character length cap (migration 0011) so a spam script can't burn meaningful storage per request; there's still no rate limit on request count. The table has no public read policy, so spam here is maintainer-side noise to clear, never traveler-visible content.
- **Email confirmation is currently off** (Supabase Auth → Providers → Email). This means anyone can create an account instantly with no verification. Combined with wiki-style auto-publish editing (any signed-in user can add or edit any place, D-012) and no per-account rate limiting, **the realistic attack here is content spam/vandalism, not data theft** - RLS stops someone from reading/writing what they shouldn't, but it doesn't stop a determined person from mass-creating accounts and mass-editing real content. Turning email confirmation back on is a one-click fix in the Supabase dashboard whenever that risk starts to matter more than the friction it adds - deliberately left off for now by the maintainer's own call, revisit before real growth in traffic.
- **No delete capability for anyone, including a place's own author.** If something needs removing (spam, a genuine mistake), it currently requires the maintainer to do it manually via the Supabase dashboard. See `docs/08-mvp.md`'s "Out of scope for V1" - a moderation dashboard and automated takedown were both explicitly deferred.
- **No rate limiting on writes.** Nothing stops one account from adding hundreds of places in a burst beyond Supabase's own infra-level protections. Not a problem at current traffic; would need addressing before any real growth.

See `docs/14-decision-log.md` for the full reasoning behind these calls, and `docs/11-risks-and-open-questions.md` for what's still open.
