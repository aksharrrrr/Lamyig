-- Admin role. Nobody could read place_reports/feedback through the app at
-- all before this (dashboard-only), and nobody - not even a place's own
-- author - could delete anything (SECURITY.md's deliberate V1 stance).
-- This adds a narrow, admin-gated exception to both, rather than opening
-- either up generally.
--
-- is_admin lives on profiles but is deliberately NOT settable through the
-- app, by anyone, including an existing admin - granting admin is a rare,
-- manual act done via the Supabase dashboard/SQL editor, not a feature.
alter table profiles add column is_admin boolean not null default false;

-- RLS's `with check` can't carve out a single column from the existing
-- "users manage their own profile" policy, so this uses Postgres's own
-- column-level grants instead: revoke the blanket UPDATE grant on profiles
-- and re-grant only the column a user should be able to change on their own
-- row. Without this, any signed-in user could self-promote by just updating
-- their own profile with is_admin = true.
revoke update on profiles from authenticated;
grant update (display_name) on profiles to authenticated;

create policy "admins can read place reports" on place_reports
  for select to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "admins can read feedback" on feedback
  for select to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "admins can delete places" on places
  for delete to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "admins can delete place reports" on place_reports
  for delete to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "admins can delete feedback" on feedback
  for delete to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
