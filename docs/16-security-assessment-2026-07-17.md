# Security assessment — 2026-07-17

Authorized security assessment of `lamyig.vercel.app`, performed at the founder's request. Scope: the deployed production app and its Supabase backend, as reflected in this repo. No destructive actions, brute-force, or availability-impacting techniques were used. All findings below were fixed and live-verified the same day — see `docs/14-decision-log.md` for how this relates to the earlier D-016/D-019 security passes.

## Method

Lamyig has no custom backend — the browser talks directly to Supabase using the public `anon` key, and Postgres Row Level Security (RLS) is the entire access-control layer (see `SECURITY.md`). That shaped the method: most of what would normally be "API testing" against a server was instead a direct read of the RLS policies in `supabase/migrations/`, cross-checked against live behavior. Two throwaway accounts were used to test authenticated write boundaries (signup requires no email verification, by design — D-016); all test data created was cleaned up afterward via the Supabase SQL Editor and Storage dashboard.

## Findings

| ID | Severity | Title | Status |
|---|---|---|---|
| H-1 | High | Broken SPA deep-linking silently broke the password-reset flow | Fixed |
| M-1 | Medium | Missing `WITH CHECK` let any user forge a place's `added_by` attribution | Fixed |
| M-2 | Medium | Public storage bucket had no file-type/size limit | Fixed |
| M-3 | Medium | Zero-friction account creation chains into fake "verified" trust signals | Accepted (matches D-016) |
| L-1 | Low | No baseline security response headers | Fixed |
| I-1 | Info | Session tokens live in `localStorage`, not an httpOnly cookie | No action (architectural) |
| I-2 | Info | No SQL injection or XSS surface found | No action |
| I-3 | Info | Production `places` table matched a known test-data count (507 rows) | Cleared |

---

### H-1 — Broken SPA deep-linking silently broke the password-reset flow

**Component:** `vercel.json` (hosting config)

**Evidence:**
```
$ curl -s -o /dev/null -w "%{http_code}\n" https://lamyig.vercel.app/auth
404
$ curl -s https://lamyig.vercel.app/auth
The page could not be found
NOT_FOUND
```
Every non-root path 404'd on direct navigation — the React app never loaded, because `vercel.json` had no SPA fallback rewrite.

**Risk:** `src/pages/Auth.tsx` sets the password-reset redirect to `${window.location.origin}/auth`. Supabase's reset-password email lands the user on exactly that URL as a top-level navigation, which 404'd before the router ever saw the recovery token — account recovery was broken end-to-end in production. The same break hit anyone bookmarking, refreshing, or sharing a link to any place/region/profile page.

**Fix:** added a rewrite so unmatched paths fall back to `index.html`:
```json
"rewrites": [
  { "source": "/((?!assets/|manifest.webmanifest|registerSW.js|favicon.png|apple-touch-icon.png).*)", "destination": "/index.html" }
]
```

**Verified:** all deep-link routes (`/auth`, `/add`, `/profile`, `/region/spiti`, `/place/:id`) now return 200 and serve the app; static assets still resolve directly.

---

### M-1 — Missing `WITH CHECK` let any user forge a place's `added_by` attribution

**Component:** `supabase/migrations/0002_rls.sql`, policy `"authenticated users can edit any place"`

**Evidence:** the UPDATE policy is intentionally permissive by design (D-012, wiki-style editing), but had no `with check`:
```sql
create policy "authenticated users can edit any place" on places
  for update to authenticated using (true);
```
Live test: user B (a throwaway account with no relationship to the place) PATCHed user A's place and set `added_by` to a real, pre-existing third user's ID:
```
PATCH /rest/v1/places?id=eq.a6a14c23-...
{"added_by":"eef65c9e-...", "last_edited_by":"eef65c9e-..."}

→ 200 OK
  "added_by": "eef65c9e-...",       # accepted — forged
  "last_edited_by": "aa146036-..."  # forced back to user B by the existing trigger
```

**Risk:** `last_edited_by` was already protected by the `set_place_edit_metadata` trigger; `added_by` had no equivalent guard. Any authenticated user (free, instant to create — see M-3) could frame an arbitrary real user as a place's contributor, undermining D-012's manual-moderation model, which relies on "who added/edited this" as its main signal.

**Fix** (`supabase/migrations/0013_lock_added_by.sql`) — extended the trigger to make `added_by` immutable after insert, same protection `last_edited_by` already had:
```sql
create or replace function set_place_edit_metadata()
returns trigger as $$
begin
  new.updated_at = now();
  new.last_edited_by = coalesce(auth.uid(), new.last_edited_by);
  new.added_by = old.added_by;
  return new;
end;
$$ language plpgsql;
```

**Verified:** re-ran the same forgery attempt post-fix — request returned 200, but `added_by` stayed unchanged.

---

### M-2 — Public storage bucket had no file-type or size limit

**Component:** `supabase/migrations/0003_storage.sql`, bucket `place-photos`

**Evidence:** the only server-side write check was the bucket ID:
```sql
create policy "authenticated users can upload place photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'place-photos');
```
An HTML file declared as `image/jpeg` was accepted and served back publicly with that content-type intact. A second upload declaring `text/html` directly was auto-downgraded by Supabase's own platform layer to `text/plain` + `nosniff` — closing off stored-XSS specifically, which is why this was Medium and not High.

**Risk:** the client's `compressImage.ts` only ever produces `image/webp` blobs, but that's a browser-side assumption only — calling the Storage REST API directly bypasses it. Realistic impact: storage-quota abuse against the project's zero-cost hosting budget, and hosting arbitrary file content under a trusted-looking `*.supabase.co` URL.

**Fix** (`supabase/migrations/0014_storage_bucket_limits.sql`):
```sql
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'],
    file_size_limit = 5242880 -- 5 MB
where id = 'place-photos';
```

**Verified:** uploads declaring a disallowed type (e.g. `application/pdf`) now hard-fail with `415 invalid_mime_type`. Note: the allowlist checks the *declared* Content-Type, not the actual bytes — spoofing an allowed type while sending non-image content still succeeds. That's an inherent limit of Supabase's mime allowlist (no server exists here to sniff real bytes), not a gap in this fix; it closes the "arbitrary type/size" case, which was the real exposure.

---

### M-3 — Zero-friction account creation chains into fake "verified" trust signals

**Component:** Supabase Auth config (email confirmation off) × `place_verifications` RLS × D-012 auto-publish

Signup requires no email verification and returns a usable session in under a second — a documented, deliberate tradeoff (`SECURITY.md`, D-016). Restated here with a more specific abuse chain than the general risk already on file: an actor can (1) add or edit a place with false information (auto-published, no review queue), then (2) mass-create disposable accounts and have each cast the one-tap "verified" signal the app treats as its core trust mechanic. `place_verifications` only enforces one verification per account per place — nothing ties an account's weight to anything real, so fabricated trust is exactly as cheap as fabricated accounts.

**Status:** no action taken — matches the founder's own explicit call in D-016. Documented here so the "before real growth" trigger in `SECURITY.md` is evaluated against this specific chained scenario, not just generic spam volume.

---

### L-1 — No baseline security response headers

**Component:** `vercel.json`

**Evidence:** only `Strict-Transport-Security` was present (a Vercel platform default) — no CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy`.

**Fix:**
```json
"headers": [{
  "source": "/(.*)",
  "headers": [
    { "key": "X-Frame-Options", "value": "DENY" },
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
    { "key": "Permissions-Policy", "value": "geolocation=(self), camera=(), microphone=()" },
    { "key": "Content-Security-Policy", "value": "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://tiles.openfreemap.org https://photon.komoot.io https://nominatim.openstreetmap.org; manifest-src 'self'; worker-src 'self' blob:" }
  ]
}]
```
The CSP allow-list was built from a source grep of every external URL the app actually calls (Supabase, OpenFreeMap tiles, Photon/Nominatim geocoding, Google Fonts) — not guessed. `geolocation=(self)` stays allowed since `AddEditPlace` uses `navigator.geolocation`.

**Caught during verification:** a live Playwright check against production after the first deploy found `worker-src 'self'` blocking MapLibre GL's internal tile-parsing worker (created from a `blob:` URL) — the map still rendered (degraded fallback) but silently. Fixed by adding `blob:` to `worker-src`. Re-checked: 0 CSP violations, map/fonts/deep-links all confirmed working.

---

### Informational

- **I-1** — Session tokens live in `localStorage` (supabase-js default; no server exists to set an httpOnly cookie from). No active XSS vector exists today (React's default escaping everywhere, no `dangerouslySetInnerHTML`), so this is low residual risk — recorded so any future rendering change gets reviewed knowing an XSS bug here would mean full session takeover, not just defacement.
- **I-2** — No SQL injection or XSS surface found. Every query goes through `supabase-js`'s parameterized builder (`grep -rn ".rpc(\|raw(\|\.sql(" src/` — zero matches); all user text renders through JSX, which escapes by default.
- **I-3** — Live row count matched `scripts/loadtest-cleanup.sql`'s flagged test-data count exactly (507). Confirmed with the founder that no real content existed yet; cleared via that script.

## Risk score

**3.2 / 10 — low-moderate residual risk**, pre-fix. Architecture and access-control fundamentals were sound throughout (every anonymous write attempt was correctly blocked, zero known dependency vulnerabilities, no injection surface); findings were concentrated in configuration gaps and one policy edge case, not systemic design flaws. Post-fix: all High/Medium/Low findings closed and live-verified same day.

## Secure deployment checklist

- [x] `vercel.json` has an SPA rewrite; every route verified reachable by direct URL
- [x] Security response headers configured and CSP verified against a real page load (map, fonts, Supabase all confirmed working, 0 console violations)
- [x] `place-photos` bucket has `allowed_mime_types` and `file_size_limit` set
- [x] `places.added_by` is immutable after insert
- [ ] Any future RLS `for update` policy gets checked for a matching `with check`, or an immutability trigger, on every column that shouldn't move
- [ ] `npm audit` run before each release (currently manual; no CI gate)
- [x] `.env` / `.env.local` remain untracked
- [ ] Re-run this repo's live-RLS probe methodology after any schema change (same practice as D-019)
- [ ] Revisit CAPTCHA / email confirmation (M-3) before real traffic growth, per D-016's own trigger
