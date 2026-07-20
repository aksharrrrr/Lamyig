# Admin runbook

There is no in-app admin panel. Admin work happens in the Supabase dashboard/SQL editor, guided by this doc. See [`14-decision-log.md`](14-decision-log.md) (D-012) and [`../SECURITY.md`](../SECURITY.md) for why: a review queue or moderation dashboard was explicitly deferred out of V1 scope, and building one now would be ahead of actual need at current traffic.

## Granting admin

`profiles.is_admin` (migration `0016_admin_role.sql`) controls admin access. It cannot be set through the app by anyone, including an existing admin — that's deliberate, so promoting someone to admin is always a manual, dashboard-side act:

```sql
update profiles set is_admin = true where id = '<user-uuid>';
```

Find the UUID via Auth → Users, or:

```sql
select id, display_name from profiles where display_name ilike '%<name>%';
```

## What admin access enables

Signed in as an admin (via the app's normal login, not the dashboard), a user can now:
- Read `place_reports` and `feedback` — nobody else can, not even the reporter re-reading their own report
- Delete a place, a place report, or a feedback row — nobody else can delete anything, not even a place's own author

Everything else (adding/editing places, verifying) works the same as any other signed-in user — admin doesn't change those.

## Periodic checks

Nothing below is automated or notified — check on whatever cadence makes sense as traffic grows (weekly is reasonable at low volume).

**Place reports** (spam / incorrect / closed / duplicate):
```sql
select pr.id, pr.reason, pr.note, pr.created_at, p.name as place_name, p.id as place_id
from place_reports pr join places p on p.id = pr.place_id
order by pr.created_at desc;
```
Fix the place directly (wiki-style edit, same as any user) if it's a correctable error. Delete the place if the report is legitimate spam/duplicate/permanently-closed. Delete the report row once handled — there's no `resolved` flag, so a cleared report is one that's been deleted.

**General feedback:**
```sql
select * from feedback order by created_at desc;
```
Delete rows once read/actioned, same "delete = handled" model as reports.

**Wiki-edit vandalism** — there's no edit history, only `last_edited_by`/`updated_at`, so a bad edit silently overwrites the previous value with no diff to review. No query catches this reliably; spot-check places that look off, or cross-reference `updated_at` against recent report activity in the same area/timeframe:
```sql
select id, name, last_edited_by, updated_at from places order by updated_at desc limit 30;
```

**Suspicious account creation** — email confirmation is off by design (`SECURITY.md`), so watch for bulk signups if vandalism starts showing up:
```sql
select id, email, created_at from auth.users order by created_at desc limit 30;
```

**Supabase free-tier usage** — DB size, bandwidth, storage. Check the project's Usage tab in the dashboard; no SQL query for this, it's plan-level.

**`place-photos` storage bucket usage** — size/mime-type limits are enforced at upload time (migration `0014_storage_bucket_limits.sql`), but total usage against the free tier isn't watched anywhere. Check via Storage → `place-photos` in the dashboard.
