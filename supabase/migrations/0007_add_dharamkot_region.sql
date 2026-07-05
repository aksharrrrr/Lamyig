-- Adds Dharamkot (Dharamshala) as a 5th featured region, alongside the
-- existing Spiti/Ladakh/Zanskar/Sikkim. A real region dropdown/picker is
-- planned later; for now it just joins the existing region list.

insert into regions (slug, name, state, description, featured) values
  ('dharamkot', 'Dharamkot', 'Himachal Pradesh', 'A hillside village above Dharamshala, popular with long-term travellers.', true)
on conflict (slug) do nothing;
