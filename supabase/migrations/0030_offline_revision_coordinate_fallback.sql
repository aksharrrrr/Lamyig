-- A place can have a missing or incorrect region_id. Offline freshness must
-- therefore use its coordinates as an automatic safety net instead of relying
-- only on the region selected when the place was contributed.

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
       offline_west is not null and offline_south is not null
       and offline_east is not null and offline_north is not null
       and p_lng between offline_west and offline_east
       and p_lat between offline_south and offline_north
     );
$$;

revoke all on function bump_offline_regions_for_place(uuid, double precision, double precision) from public;
