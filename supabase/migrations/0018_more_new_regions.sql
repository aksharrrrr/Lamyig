-- 13 more regions added by the Himachal offbeat-circuits + Northeast India +
-- Kerala/Telangana/Karnataka/Goa/Maharashtra place-research batches, matching
-- data/places-seed.csv's new region rows. Not in the "featured" set.
insert into regions (slug, name, state, description, featured) values
  ('himachal', 'Himachal (offbeat circuits)', 'Himachal Pradesh', 'Offbeat valleys and villages across Himachal Pradesh beyond the Spiti circuit - Pangi, Bharmour, Sainj, Lahaul, Kinnaur, Churah, Barot, Kotkhai, Sirmaur, Thachi and more.', false),
  ('tamilnadu', 'Tamil Nadu', 'Tamil Nadu', 'Rural heritage and craft villages of Tamil Nadu, including the Chettinad region.', false),
  ('arunachal', 'Arunachal Pradesh', 'Arunachal Pradesh', 'Himalayan monastery towns and valleys of Arunachal Pradesh (Tawang, Mechuka, Aalo).', false),
  ('nagaland', 'Nagaland', 'Nagaland', 'Tribal villages of Nagaland, including Longwa, Khonoma and the Dzukou Valley trek base.', false),
  ('assam', 'Assam', 'Assam', 'Kaziranga National Park and Majuli river island in Assam.', false),
  ('manipur', 'Manipur', 'Manipur', 'Loktak Lake and the forest trails of Tamenglong in Manipur.', false),
  ('mizoram', 'Mizoram', 'Mizoram', 'Lunglei and the southern hills of Mizoram.', false),
  ('tripura', 'Tripura', 'Tripura', 'The Unakoti rock-carving pilgrimage site in Tripura.', false),
  ('kerala', 'Kerala', 'Kerala', 'Offbeat highland and forest villages of Kerala (Kanthalloor, Gavi).', false),
  ('telangana', 'Telangana', 'Telangana', 'Kinnerasani Wildlife Sanctuary and rural Telangana.', false),
  ('karnataka', 'Karnataka', 'Karnataka', 'Western Ghats villages of Karnataka (Agumbe, Yana).', false),
  ('goa', 'Goa', 'Goa', 'Inland forest and heritage villages of Goa beyond the beaches (Cotigao, Rivona).', false),
  ('maharashtra', 'Maharashtra', 'Maharashtra', 'Konkan coastal villages of Maharashtra, including the Velas turtle-nesting beach.', false)
on conflict (slug) do nothing;
