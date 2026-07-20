-- villages had an insert policy (0004, wiki-style contribution) but no
-- update policy at all - discovered while backfilling center_lat/center_lng
-- (0009) for villages that already existed before that migration's own
-- UPDATE statements were seeded. Extends the same wiki-style trust model
-- places already use (0002's "authenticated users can edit any place") to
-- villages, rather than inventing a different rule for this table.

create policy "authenticated users can edit any village" on villages
  for update to authenticated using (true);
