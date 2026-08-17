-- Publish a new place and all of its photo metadata in one transaction.
-- The client uploads compressed files first, then calls this function. If
-- this function fails, no place or place_photos rows become public and the
-- client removes the staged files.

create or replace function publish_place_with_photos(
  p_id uuid,
  p_name text,
  p_category place_category,
  p_lat double precision,
  p_lng double precision,
  p_region_id uuid,
  p_village_id uuid,
  p_trek_id uuid,
  p_description text,
  p_phone text,
  p_whatsapp text,
  p_price_range text,
  p_attributes jsonb,
  p_photo_paths text[]
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  photo_path text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into places (
    id, name, category, lat, lng, region_id, village_id, trek_id,
    description, phone, whatsapp, price_range, attributes,
    added_by, last_edited_by
  ) values (
    p_id, p_name, p_category, p_lat, p_lng, p_region_id, p_village_id, p_trek_id,
    p_description, p_phone, p_whatsapp, p_price_range, coalesce(p_attributes, '{}'::jsonb),
    auth.uid(), auth.uid()
  );

  foreach photo_path in array coalesce(p_photo_paths, array[]::text[])
  loop
    if photo_path not like p_id::text || '/%' then
      raise exception 'Invalid photo path';
    end if;

    insert into place_photos (place_id, storage_path, uploaded_by)
    values (p_id, photo_path, auth.uid());
  end loop;

  return p_id;
end;
$$;

revoke all on function publish_place_with_photos(
  uuid, text, place_category, double precision, double precision, uuid, uuid,
  uuid, text, text, text, text, jsonb, text[]
) from public;

grant execute on function publish_place_with_photos(
  uuid, text, place_category, double precision, double precision, uuid, uuid,
  uuid, text, text, text, text, jsonb, text[]
) to authenticated;

-- Permit cleanup of staged files when compression, upload, or finalization
-- fails, without allowing deletion of another user's files.
create policy "uploaders can remove their own staged photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'place-photos' and owner_id = auth.uid()::text);
