# Security re-verification — 2026-07-28 (custom domain migration)

Follow-up to [`16-security-assessment-2026-07-17.md`](16-security-assessment-2026-07-17.md), triggered by the move from `lamyig.vercel.app` to the custom domain `www.lamyig.in`. Read-only re-verification only, at the founder's explicit choice — no throwaway accounts or live write-tests were created this time, since nothing in the access-control layer (RLS policies, storage bucket policy) changed since the original assessment; see below for why that's a defensible scope for this specific trigger.

## Why read-only was sufficient here

Everything since the 07-17 assessment was data (`places`/`village-centers`/`regions` seed rows), documentation, and one pure client-side popup (`Vision.tsx`, static text + plain `<a>` links, no new backend surface). `supabase/migrations/0017_new_regions.sql` through `0019_more_new_regions.sql` were checked directly — none touch RLS policies or the storage bucket config the original findings (M-1, M-2) were about. A domain change alone doesn't move any of the H-1/M-1/M-2/L-1 fixes, which live in `vercel.json` and the database, not in DNS.

## Checks re-run against `www.lamyig.in`

| Original finding | Re-check | Result |
|---|---|---|
| H-1 — SPA deep-linking | `curl` against `/`, `/auth`, `/add`, `/profile`, `/region/spiti`, `/place/:id` | All return `200`, app loads — fix holds on the new domain |
| L-1 — security headers | `curl -D -` against `/` | `CSP`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` all present, matching `vercel.json` |
| M-1 — `added_by` immutability | Diff of `supabase/migrations/0017-0019` | No changes to the trigger from `0013_lock_added_by.sql` |
| M-2 — storage bucket limits | Diff of `supabase/migrations/0017-0019` | No changes to `0014_storage_bucket_limits.sql` |
| CSP `connect-src` coverage | Manual review | `'self'` already covers the new same-origin hostname; no cross-origin dependency changed, no CSP update needed |

## Not re-run this time (by explicit choice)

- Live write-test (two throwaway accounts, forgery attempt against `added_by`, cleanup) — the founder chose read-only-only for this pass, since the underlying policy hasn't changed since it was last live-verified on 07-17. Should still be the standard practice (per the `16` checklist item) after any *actual* schema/RLS change, not skipped as a habit.

## Result

No new findings. All fixes from `16-security-assessment-2026-07-17.md` hold on `www.lamyig.in`. Risk posture unchanged from the 3.2/10 post-fix score recorded there.

## Secure deployment checklist (carried forward)

- [x] SPA rewrite verified on the new domain
- [x] Security headers + CSP verified on the new domain
- [x] `place-photos` bucket limits unchanged
- [x] `places.added_by` immutability unchanged
- [ ] Any future RLS `for update` policy still needs a matching `with check` or immutability trigger
- [ ] `npm audit` before each release (still manual, no CI gate)
- [ ] Full live-RLS-probe re-test (D-019/`16`'s method) after any *actual* schema/policy change — this pass deliberately skipped it since nothing qualified
- [ ] Revisit CAPTCHA / email confirmation (M-3) before real traffic growth, per D-016's own trigger
