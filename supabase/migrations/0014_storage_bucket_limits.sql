-- Security fix: the place-photos bucket (0003_storage.sql) had no
-- allowed_mime_types or file_size_limit, so the only server-side check on
-- upload was bucket_id. Live-confirmed during the 2026-07-17 security
-- assessment: a non-image file uploaded directly via the Storage REST API
-- (bypassing the client's compressImage.ts, which only ever produces
-- image/webp) was accepted and served back publicly with an
-- attacker-declared content-type. Supabase's own platform layer already
-- neutralizes the worst case for text/html (downgraded to text/plain +
-- nosniff), but nothing stopped arbitrary file size/type otherwise.

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'],
    file_size_limit = 5242880 -- 5 MB
where id = 'place-photos';
