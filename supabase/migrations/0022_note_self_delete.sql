-- Scoped exception to D-012's "no delete for anyone, manual-review-only"
-- stance, for community notes specifically - see D-020 in
-- docs/14-decision-log.md. Reporting your own note made no sense (the
-- report button is now hidden on your own notes in the UI); an author
-- fixing their own typo/mistake note shouldn't need to wait on manual
-- admin review the way a place edit or someone else's content does.
create policy "authors can delete their own community notes" on community_notes
  for delete to authenticated using (author_id = auth.uid());
