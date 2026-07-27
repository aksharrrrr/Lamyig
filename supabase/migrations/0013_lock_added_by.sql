-- Security fix: the places UPDATE policy (0002_rls.sql, "authenticated users
-- can edit any place") is deliberately `using (true)` for wiki-style editing
-- (D-012), but has no `with check`, so nothing stopped a client from also
-- rewriting `added_by` on every edit. last_edited_by was already protected
-- by this trigger; added_by wasn't. Live-confirmed during the 2026-07-17
-- security assessment: an unrelated authenticated user could PATCH any
-- place and forge added_by to an arbitrary real user's id, which undermines
-- D-012's manual-moderation model (added_by is the signal a maintainer reviews
-- to know who actually contributed what).
--
-- added_by should be set once at insert and never move again - same
-- immutable-after-creation shape as created_at.

create or replace function set_place_edit_metadata()
returns trigger as $$
begin
  new.updated_at = now();
  new.last_edited_by = coalesce(auth.uid(), new.last_edited_by);
  new.added_by = old.added_by;
  return new;
end;
$$ language plpgsql;
