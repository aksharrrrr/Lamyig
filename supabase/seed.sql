-- Founder-seeded starting regions + a few real villages from the founder
-- story (docs/01-founder-story.md), so the Add-place form has something to
-- pick from before the community adds more. Run after migrations 0001-0003.
--
-- "Treks" (docs/07-information-architecture.md's popular destinations) is
-- deliberately not seeded here — it doesn't fit the India -> State -> Region
-- -> Village -> Place hierarchy as a place, it's more like a cross-region
-- collection/tag. Flagged as an open question in docs/14-decision-log.md.

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
