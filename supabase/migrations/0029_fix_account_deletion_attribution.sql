-- ON DELETE SET NULL from 0026 was being undone by the place edit-metadata
-- trigger from 0013: auth.uid() still identifies the deleting user during
-- the cascade, so last_edited_by was restored and added_by was always copied
-- from OLD. Allow null attribution only when its referenced auth.users row
-- has actually been deleted; ordinary wiki edits retain the anti-forgery
-- behavior unchanged.

create or replace function public.set_place_edit_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  added_account_deleted boolean :=
    old.added_by is not null
    and new.added_by is null
    and not exists (select 1 from auth.users where id = old.added_by);
  editor_account_deleted boolean :=
    old.last_edited_by is not null
    and new.last_edited_by is null
    and not exists (select 1 from auth.users where id = old.last_edited_by);
begin
  new.updated_at = now();

  if not editor_account_deleted then
    new.last_edited_by = coalesce(auth.uid(), new.last_edited_by);
  end if;

  if not added_account_deleted then
    new.added_by = old.added_by;
  end if;

  return new;
end;
$$;

-- Reassert the intended referential actions in case 0026 was only partially
-- applied in an environment before its account-deletion function was used.
alter table public.places
  alter column added_by drop not null,
  alter column last_edited_by drop not null,
  drop constraint if exists places_added_by_fkey,
  drop constraint if exists places_last_edited_by_fkey;

alter table public.places
  add constraint places_added_by_fkey foreign key (added_by) references auth.users(id) on delete set null,
  add constraint places_last_edited_by_fkey foreign key (last_edited_by) references auth.users(id) on delete set null;
