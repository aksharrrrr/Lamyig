-- 5 new regions beyond the original Himalaya set (D-009: Lamyig is
-- India-wide), matching data/places-seed.csv's new kutch/thar/meghalaya/
-- ziro/kumaon rows. Not in the "featured" set (spiti/ladakh/zanskar/
-- sikkim/treks per D-009) - these are additional, not headline, regions.
insert into regions (slug, name, state, description, featured) values
  ('kutch', 'Kutch', 'Gujarat', 'The salt-desert and Banni grasslands region of western Gujarat.', false),
  ('thar', 'Thar Desert', 'Rajasthan', 'The desert region around Jaisalmer and Jodhpur in western Rajasthan.', false),
  ('meghalaya', 'Meghalaya', 'Meghalaya', 'The living-root-bridge and river-canyon region of the Khasi and Jaintia Hills.', false),
  ('ziro', 'Ziro Valley', 'Arunachal Pradesh', 'The Apatani valley of Lower Subansiri district in Arunachal Pradesh.', false),
  ('kumaon', 'Kumaon', 'Uttarakhand', 'The Himalayan foothill region of Pithoragarh and Munsiyari in Uttarakhand.', false)
on conflict (slug) do nothing;
