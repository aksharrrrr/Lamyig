-- Give each downloadable region a cheap, authoritative freshness signal.
-- The bounds mirror the static PMTiles extracts and let unclassified places
-- (region_id IS NULL) invalidate the same pack that includes them by GPS.

alter table regions
  add column offline_west double precision,
  add column offline_south double precision,
  add column offline_east double precision,
  add column offline_north double precision,
  add column offline_revision bigint not null default 1;

update regions set
  offline_west = 77.3, offline_south = 31.55,
  offline_east = 78.75, offline_north = 33.2
where slug = 'spiti';

update regions set
  offline_west = 75.6, offline_south = 32.2,
  offline_east = 80.0, offline_north = 35.8
where slug = 'ladakh';

update regions set
  offline_west = 76.2, offline_south = 32.6,
  offline_east = 77.8, offline_north = 34.2
where slug = 'zanskar';

create or replace function bump_offline_regions_for_place(
  p_region_id uuid,
  p_lat double precision,
  p_lng double precision
)
returns void
language sql
security definer
set search_path = public
as $$
  update regions
  set offline_revision = offline_revision + 1
  where id = p_region_id
     or (
       p_region_id is null
       and offline_west is not null and offline_south is not null
       and offline_east is not null and offline_north is not null
       and p_lng between offline_west and offline_east
       and p_lat between offline_south and offline_north
     );
$$;

create or replace function bump_offline_revision_from_place()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform bump_offline_regions_for_place(old.region_id, old.lat, old.lng);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform bump_offline_regions_for_place(new.region_id, new.lat, new.lng);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger places_bump_offline_revision
  after insert or update or delete on places
  for each row execute function bump_offline_revision_from_place();

create or replace function bump_offline_revision_from_place_child()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_place_id uuid := coalesce(new.place_id, old.place_id);
  target_place places%rowtype;
begin
  select * into target_place from places where id = target_place_id;
  if found then
    perform bump_offline_regions_for_place(target_place.region_id, target_place.lat, target_place.lng);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger place_photos_bump_offline_revision
  after insert or update or delete on place_photos
  for each row execute function bump_offline_revision_from_place_child();

create trigger community_notes_bump_offline_revision
  after insert or update or delete on community_notes
  for each row execute function bump_offline_revision_from_place_child();

create or replace function bump_offline_revision_from_region_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.offline_revision = old.offline_revision + 1;
  return new;
end;
$$;

create trigger regions_bump_offline_revision
  before update of name, state, description, featured, center_lat, center_lng,
    default_zoom, offline_west, offline_south, offline_east, offline_north
  on regions
  for each row execute function bump_offline_revision_from_region_metadata();

revoke all on function bump_offline_regions_for_place(uuid, double precision, double precision) from public;
revoke all on function bump_offline_revision_from_place() from public;
revoke all on function bump_offline_revision_from_place_child() from public;
revoke all on function bump_offline_revision_from_region_metadata() from public;
