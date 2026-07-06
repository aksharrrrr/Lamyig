-- Run in Supabase SQL Editor to remove load-test data seeded by
-- scripts/load-test-seed.mjs. Replace the UUID below with the one printed
-- by that script (also shown in its terminal output at seed time).
delete from place_verifications where verified_by = '9a560081-5121-4250-93bd-d76b24a5c561';
delete from places where added_by = '9a560081-5121-4250-93bd-d76b24a5c561';
delete from auth.users where id = '9a560081-5121-4250-93bd-d76b24a5c561';
