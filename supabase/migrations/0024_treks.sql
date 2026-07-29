-- Resolves the open question in docs/14-decision-log.md ("Where does Treks
-- fit the Region model?") - a trek crosses villages/regions, so it's its
-- own entity rather than forcing it into the Region/Village hierarchy.
-- A place can now optionally attach to a trek (independent of its
-- region/village) so trekkers can find homestays, campsites, and toilets
-- along a specific trek, not just whatever's nearby on the map.
create table treks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  center_lat double precision,
  center_lng double precision,
  created_at timestamptz not null default now()
);

alter table treks enable row level security;

create policy "treks are publicly readable" on treks
  for select using (true);

alter table places add column trek_id uuid references treks(id) on delete set null;
create index places_trek_id_idx on places(trek_id);
