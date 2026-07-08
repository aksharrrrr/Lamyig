-- Run in Supabase SQL Editor to remove load-test data seeded by
-- scripts/load-test-seed.mjs. Replace the UUID below with the one printed
-- by that script (also shown in its terminal output at seed time).
delete from place_verifications where verified_by = 'eef65c9e-fd72-4df2-a83a-49054995cba3';
delete from places where added_by = 'eef65c9e-fd72-4df2-a83a-49054995cba3';
delete from auth.users where id = 'eef65c9e-fd72-4df2-a83a-49054995cba3';

-- Also leftover from verifying migration 0012 (optional village_id):
delete from places where name = 'VILLAGETEST no-village place';
