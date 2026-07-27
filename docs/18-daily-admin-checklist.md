# Daily / periodic admin checklist

A practical, recurring companion to [`17-admin-runbook.md`](17-admin-runbook.md) (which explains *how* to grant admin and *what* admin access does). This doc is *what to actually check, how often, and what to do about it* - meant to be sufficient on its own for whoever is acting as sole admin post-launch. Everything here runs from the Supabase dashboard (Table Editor or SQL Editor) - no CLI or service-role key needed.

## Cadence

| Frequency | What |
|---|---|
| Daily (first 2-4 weeks post-launch, or during/after any Reddit post) | Place reports, feedback, new signups, Resend/email health |
| Weekly (once traffic is low/steady) | Everything above, plus wiki-edit spot-check, storage/DB usage |
| Monthly | Dependabot PRs review, full account/villages sanity pass |

Drop to weekly once daily checks have gone a few days with nothing to act on - this list exists to catch problems early post-launch, not to be a permanent daily chore.

## Daily (or after any traffic spike)

**1. Place reports** - anything reported since last check:
```sql
select pr.id, pr.reason, pr.note, pr.created_at, p.name as place_name, p.id as place_id
from place_reports pr join places p on p.id = pr.place_id
order by pr.created_at desc
limit 20;
```
For each: fix the place directly (wiki-edit, same as any user) if it's a correctable error; delete the place if it's genuine spam/duplicate/permanently closed. Delete the report row once handled - there's no `resolved` flag, so "still present" means "still open."

**2. General feedback:**
```sql
select * from feedback order by created_at desc limit 20;
```
Delete once read/actioned, same model as reports.

**3. New signups** - sanity check for bulk/bot signups (email confirmation is on, but doesn't stop someone from confirming many throwaway addresses):
```sql
select id, email, created_at, email_confirmed_at from auth.users order by created_at desc limit 20;
```
Look for: many accounts from the same minute/pattern, obviously fake addresses, confirmed-but-zero-activity accounts. Nothing to do by default - just watch for a pattern that suggests abuse before it becomes one.

**4. Resend / email health** - [Resend dashboard](https://resend.com) → Logs:
- Any `bounced` or `complained` status? Investigate the specific address/cause.
- Confirm domain (`lamyig.in`) still shows verified (a DNS record change elsewhere, or registrar issue, could silently break this).
- Delivery landing in spam is expected early on for a new sending domain - not an action item by itself, just something that improves over the following weeks as the domain builds sending reputation.

## Weekly

**5. Wiki-edit spot-check** - there's no edit history (only `last_edited_by`/`updated_at`), so a bad edit silently overwrites the previous value with no diff to compare against:
```sql
select id, name, last_edited_by, updated_at from places order by updated_at desc limit 30;
```
Spot-check a handful, especially any place edited multiple times in a short window, or edited right after a report was filed on it.

**6. New villages created** - wiki-style place-adding can silently spin up a new `villages` row via typos or near-duplicates (e.g. "Kaza" vs "kaza " vs "Kaza Village"):
```sql
select v.id, v.name, v.slug, v.region_id, r.name as region_name, v.created_at
from villages v join regions r on r.id = v.region_id
order by v.created_at desc limit 20;
```
Merge/rename obvious duplicates by updating affected `places.village_id` rows, then delete the duplicate village row.

**7. Supabase project usage** - Dashboard → Usage tab (no SQL query, plan-level): DB size, bandwidth, monthly active users, storage. Free-tier limits are generous at current scale, but worth a glance so a limit isn't hit without warning.

**8. `place-photos` storage bucket** - Dashboard → Storage → `place-photos`: total size against free-tier storage limit. Per-file type/size limits are already enforced at upload time (migration `0014`), this is just aggregate usage.

## Monthly

**9. Dependabot PRs** - repo's Pull Requests tab, filter by `dependabot`. For each: confirm CI (`build-and-lint`) is green, skim the changelog for anything breaking, merge. Patch/minor bumps are usually safe to merge on sight; major version bumps (e.g. a framework major) are worth a `npm run build` + quick manual click-through locally first.

**10. Full account sanity pass** - broader version of the daily signup check:
```sql
select p.id, p.display_name, u.email, u.created_at, p.is_admin,
  (select count(*) from places where added_by = p.id) as places_added
from profiles p join auth.users u on u.id = p.id
order by u.created_at desc;
```
Look for: accounts that should probably be cleaned up (test/throwaway accounts, same pattern as the cleanup done pre-launch), unexpected `is_admin = true` rows (should only ever be set manually, per `17-admin-runbook.md` - a stray `true` here would mean something bypassed the column-lockdown, worth investigating immediately, not waiting for the next monthly pass).

## Not covered here (already documented elsewhere)

- **Granting/understanding admin access** - [`17-admin-runbook.md`](17-admin-runbook.md).
- **Security posture, accepted tradeoffs** - [`../SECURITY.md`](../SECURITY.md) and [`16-security-assessment-2026-07-17.md`](16-security-assessment-2026-07-17.md).
- **Why there's no edit history, no review queue, no self-serve delete** - [`14-decision-log.md`](14-decision-log.md), D-012.
