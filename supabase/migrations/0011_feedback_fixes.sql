-- Two fixes to the feedback table (migration 0010):
--
-- 1. The anon-insert policy wasn't actually letting anonymous inserts
--    through in production (verified live: anon insert returned an RLS
--    violation). Re-creating it explicit about the target roles rather
--    than relying on the implicit PUBLIC default.
--
-- 2. feedback is the only fully zero-friction anonymous write path in the
--    schema - place_reports and place_verifications both require a signed-in
--    account, which is at least some deterrent against automated spam even
--    with email confirmation off (D-016). feedback has none. A length cap
--    is cheap, doesn't affect legitimate use, and limits how much storage
--    a spam script could burn through per request on the free tier (D-010).

drop policy if exists "anyone can submit feedback" on feedback;

create policy "anyone can submit feedback" on feedback
  for insert to anon, authenticated with check (true);

alter table feedback add constraint feedback_message_length check (char_length(message) <= 5000);
