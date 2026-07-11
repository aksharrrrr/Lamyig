-- Pre-launch cleanup: removes every test/demo place currently in prod.
-- As of 2026-07-11, all 507 rows in `places` are test data - LOADTEST
-- seed rows, leftover demo places, and a migration-verification row.
-- Run this in Supabase SQL Editor before real content goes in.

delete from place_verifications where verified_by in (
  'eef65c9e-fd72-4df2-a83a-49054995cba3',
  'd74fa0d4-3b62-4cd3-99a9-e02a2fc6a3fd',
  '14b09668-23d6-4357-a5fe-69529f768096'
);
delete from places where added_by in (
  'eef65c9e-fd72-4df2-a83a-49054995cba3',
  'd74fa0d4-3b62-4cd3-99a9-e02a2fc6a3fd',
  '14b09668-23d6-4357-a5fe-69529f768096'
);

-- Optional - also removes the throwaway accounts themselves:
delete from auth.users where id in (
  'eef65c9e-fd72-4df2-a83a-49054995cba3',
  'd74fa0d4-3b62-4cd3-99a9-e02a2fc6a3fd',
  '14b09668-23d6-4357-a5fe-69529f768096'
);
