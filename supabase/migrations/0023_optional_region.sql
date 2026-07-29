-- Region drives the (still-unbuilt) Region page listing and offline
-- download packaging - it doesn't affect whether a place's pin shows up on
-- the map, which is driven purely by lat/lng and category. Forcing every
-- contributor to pick a region added friction with no payoff for those two
-- unshipped features. Same reasoning/pattern as 0012_optional_village.sql,
-- which made village_id nullable for the same kind of reason - unlike that
-- one, this migration actually contains the SQL instead of an empty file.
alter table places alter column region_id drop not null;
