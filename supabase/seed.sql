-- Initial starting regions + a few real villages, drawn from the origin
-- story (docs/01-founder-story.md), so the Add-place form has something to
-- pick from before the community adds more. Run after migrations 0001-0003.
--
-- "Treks" (docs/07-information-architecture.md's popular destinations)
-- don't fit the India -> State -> Region -> Village -> Place hierarchy as a
-- place - a trek crosses villages/regions - so they're their own table
-- (migration 0024), seeded below with the same 5 that were previously just
-- a hardcoded fly-to list in Home.tsx.

insert into regions (slug, name, state, description, featured) values
  ('spiti', 'Spiti', 'Himachal Pradesh', 'A high-altitude cold desert valley in Himachal Pradesh.', true),
  ('ladakh', 'Ladakh', 'Ladakh', 'A high-altitude Himalayan region in the union territory of Ladakh.', true),
  ('zanskar', 'Zanskar', 'Ladakh', 'A remote valley in the union territory of Ladakh.', true),
  ('sikkim', 'Sikkim', 'Sikkim', 'A Himalayan state in Northeast India.', true)
on conflict (slug) do nothing;

insert into villages (slug, name, region_id)
select v.slug, v.name, r.id
from (values
  ('kaza', 'Kaza', 'spiti'),
  ('losar', 'Losar', 'spiti'),
  ('shego', 'Shego', 'spiti'),
  ('gue', 'Gue', 'spiti'),
  ('tabo', 'Tabo', 'spiti'),
  ('dhankar', 'Dhankar', 'spiti')
) as v(slug, name, region_slug)
join regions r on r.slug = v.region_slug
on conflict (region_id, slug) do nothing;

insert into treks (slug, name, center_lat, center_lng) values
  ('hampta-pass', 'Hampta Pass', 32.2408, 77.2668),
  ('pin-parvati-pass', 'Pin Parvati Pass', 31.9522, 77.6539),
  ('bhrigu-lake', 'Bhrigu Lake', 32.2957, 77.3324),
  ('triund', 'Triund', 32.2438, 76.3389),
  ('kheerganga', 'Kheerganga', 32.0186, 77.3204)
on conflict (slug) do nothing;
