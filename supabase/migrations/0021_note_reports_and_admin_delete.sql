-- Community notes had no report path and no delete path at all - not even
-- for an admin (0016_admin_role.sql added admin-delete for places, place
-- reports, and feedback, but never touched community_notes). Staying
-- consistent with D-012/SECURITY.md's "no delete for anyone, including the
-- author, manual review only" stance: still no author self-delete, but a
-- note can now be reported (reusing the existing place_reports/manual-review
-- pattern) and an admin can delete a note once a report is actioned, same as
-- they already can for a place.

-- Nullable: existing place-level reports have no note_id. Set only when the
-- report is about a specific community note rather than the place itself.
alter table place_reports add column note_id uuid references community_notes(id) on delete cascade;

create policy "admins can delete community notes" on community_notes
  for delete to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
