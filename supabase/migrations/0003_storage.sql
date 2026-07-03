-- Public bucket for place photos — publicly readable, authenticated upload only.

insert into storage.buckets (id, name, public)
values ('place-photos', 'place-photos', true)
on conflict (id) do nothing;

create policy "place photos bucket is publicly readable" on storage.objects
  for select using (bucket_id = 'place-photos');

create policy "authenticated users can upload place photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'place-photos');
