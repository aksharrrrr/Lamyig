-- Villages now travel inside offline region packs and participate in local
-- search, so changing one must make the affected download visibly stale.

create or replace function bump_offline_revision_from_village()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update regions
    set offline_revision = offline_revision + 1
    where id = old.region_id;
  end if;

  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.region_id is distinct from old.region_id) then
    update regions
    set offline_revision = offline_revision + 1
    where id = new.region_id;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger villages_bump_offline_revision
  after insert or update or delete on villages
  for each row execute function bump_offline_revision_from_village();

revoke all on function bump_offline_revision_from_village() from public;
