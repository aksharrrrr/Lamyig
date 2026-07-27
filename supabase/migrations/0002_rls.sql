-- Browsing is open to everyone; contributing requires auth - D-011.

alter table regions enable row level security;
alter table villages enable row level security;
alter table places enable row level security;
alter table place_photos enable row level security;
alter table community_notes enable row level security;
alter table place_verifications enable row level security;
alter table place_reports enable row level security;
alter table profiles enable row level security;

create policy "regions are publicly readable" on regions
  for select using (true);

create policy "villages are publicly readable" on villages
  for select using (true);

create policy "places are publicly readable" on places
  for select using (true);

create policy "authenticated users can add places" on places
  for insert to authenticated with check (added_by = auth.uid() and last_edited_by = auth.uid());

-- Wiki-style editing: any authenticated user may edit any place - D-012.
create policy "authenticated users can edit any place" on places
  for update to authenticated using (true);

create policy "place photos are publicly readable" on place_photos
  for select using (true);

create policy "authenticated users can add photos" on place_photos
  for insert to authenticated with check (uploaded_by = auth.uid());

create policy "community notes are publicly readable" on community_notes
  for select using (true);

create policy "authenticated users can add community notes" on community_notes
  for insert to authenticated with check (author_id = auth.uid());

create policy "verification counts are publicly readable" on place_verifications
  for select using (true);

create policy "authenticated users can verify a place" on place_verifications
  for insert to authenticated with check (verified_by = auth.uid());

-- Reports are not publicly readable - manual maintainer review only, via the
-- Supabase dashboard/service role. No end-user policy grants select.
create policy "authenticated users can file a report" on place_reports
  for insert to authenticated with check (reporter_id = auth.uid());

create policy "profiles are publicly readable" on profiles
  for select using (true);

create policy "users manage their own profile" on profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Auto-create a profile row when someone signs up.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
