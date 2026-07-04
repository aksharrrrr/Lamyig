-- Caught in testing: a place got saved with lat=1231 (outside -90..90) with
-- nothing stopping it, which crashed marker rendering for every place on the
-- map, not just the bad one. The client now enforces min/max on the form,
-- but lat/lng are plain numeric columns - there's no reason not to have
-- Postgres enforce the real-world bound too.

-- Adding the constraint below will fail while any existing row violates it
-- (Postgres validates current rows on ALTER). This deletes rows already out
-- of bounds first - at this stage that's only test data from today's
-- testing, not real contributions.
delete from places where lat < -90 or lat > 90 or lng < -180 or lng > 180;

alter table places
  add constraint places_lat_range check (lat between -90 and 90),
  add constraint places_lng_range check (lng between -180 and 180);
