-- Self-service account erasure. Community place records and their photos are
-- retained as factual public knowledge, but attribution is anonymized. More
-- personal activity (notes, verifications, and reports) is removed.

alter table places
  alter column added_by drop not null,
  alter column last_edited_by drop not null,
  drop constraint places_added_by_fkey,
  drop constraint places_last_edited_by_fkey,
  add constraint places_added_by_fkey foreign key (added_by) references auth.users(id) on delete set null,
  add constraint places_last_edited_by_fkey foreign key (last_edited_by) references auth.users(id) on delete set null;

alter table place_photos
  alter column uploaded_by drop not null,
  drop constraint place_photos_uploaded_by_fkey,
  add constraint place_photos_uploaded_by_fkey foreign key (uploaded_by) references auth.users(id) on delete set null;

alter table community_notes
  drop constraint community_notes_author_id_fkey,
  add constraint community_notes_author_id_fkey foreign key (author_id) references auth.users(id) on delete cascade;

alter table place_verifications
  drop constraint place_verifications_verified_by_fkey,
  add constraint place_verifications_verified_by_fkey foreign key (verified_by) references auth.users(id) on delete cascade;

alter table place_reports
  drop constraint place_reports_reporter_id_fkey,
  add constraint place_reports_reporter_id_fkey foreign key (reporter_id) references auth.users(id) on delete cascade;

create or replace function delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  requesting_user uuid := auth.uid();
begin
  if requesting_user is null then
    raise exception 'Authentication required';
  end if;

  delete from auth.users where id = requesting_user;

  if not found then
    raise exception 'Account not found';
  end if;
end;
$$;

revoke all on function delete_own_account() from public;
grant execute on function delete_own_account() to authenticated;
