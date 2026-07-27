-- Villages started centrally curated (0002_rls.sql granted no insert policy),
-- but the seed list can't realistically cover every village India-wide.
-- Let contributors add a village inline while adding a Place, same
-- wiki-style trust model as places themselves (D-012).

create policy "authenticated users can add villages" on villages
  for insert to authenticated with check (true);
