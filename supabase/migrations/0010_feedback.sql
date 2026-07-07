-- General product feedback (bugs, suggestions, anything not tied to a
-- specific place - place_reports already covers that). Manual founder
-- review only, same as place_reports - no public read policy.
create table feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  email text,
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

-- Open to everyone, signed in or not - feedback from someone who hasn't
-- made an account yet is still worth having, and this table carries no
-- public content, so the abuse surface is limited to noise a founder can
-- clear from the dashboard, not anything travellers ever see.
create policy "anyone can submit feedback" on feedback
  for insert with check (true);
