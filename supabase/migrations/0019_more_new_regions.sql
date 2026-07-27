-- 5 more regions from the Madhya Pradesh / West Bengal-Odisha-Jharkhand /
-- Rajasthan place-research batches, matching data/places-seed.csv's new
-- region rows. Not in the "featured" set.
insert into regions (slug, name, state, description, featured) values
  ('madhyapradesh', 'Madhya Pradesh', 'Madhya Pradesh', 'Tribal art villages, riverside heritage towns and forest-reserve hamlets of Madhya Pradesh.', false),
  ('westbengal', 'West Bengal (hills & Jungle Mahal)', 'West Bengal', 'Darjeeling/Kalimpong hill villages and the Jungle Mahal forest belt of West Bengal.', false),
  ('jharkhand', 'Jharkhand', 'Jharkhand', 'Colonial-heritage and hill-station villages of the Chotanagpur plateau, Jharkhand.', false),
  ('odisha', 'Odisha', 'Odisha', 'Wetland and wildlife-sanctuary villages of Odisha, including the Chilika Lake basin.', false),
  ('rajasthan', 'Rajasthan (heritage villages)', 'Rajasthan', 'Heritage-fort and craft villages of Rajasthan beyond the Thar dune circuit.', false)
on conflict (slug) do nothing;
