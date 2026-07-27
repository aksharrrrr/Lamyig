-- Single-row table holding the GitHub contributor count shown in the vision
-- popup. Updated once a day by a scheduled GitHub Action (excludes bot
-- accounts) using the service-role key, never the anon key - so no insert/
-- update policy exists for anon/authenticated, only a public read policy.
-- The app treats this as informational only, never as an access-control
-- signal, so read-only public access is the correct and only policy needed.
create table repo_stats (
  id boolean primary key default true,
  contributor_count integer not null,
  updated_at timestamptz not null default now(),
  constraint repo_stats_single_row check (id)
);

alter table repo_stats enable row level security;

create policy "anyone can read repo stats" on repo_stats
  for select using (true);
