-- Narrows place_category to the 5 categories actually being built out
-- (homestay, mechanic, fuel, toilet, camping). Food, drinking_water,
-- medical, mobile_network, and viewpoint are dropped for now - they can
-- come back later, but Postgres enums can only grow via ALTER TYPE ... ADD
-- VALUE, not shrink, so removing values means recreating the type.
--
-- Safe to run: confirmed zero existing rows use any of the five being
-- removed (all current test data is homestay/toilet/mechanic/fuel).

alter type place_category rename to place_category_old;

create type place_category as enum ('homestay', 'mechanic', 'fuel', 'toilet', 'camping');

alter table places
  alter column category type place_category using category::text::place_category;

drop type place_category_old;
