# Load testing

Lamyig has no staging environment (D-010: one free-tier Supabase project, period), so load testing happens against production. `scripts/load-test-seed.mjs` seeds a large batch of throwaway places (tagged `LOADTEST`, owned by one throwaway account) spread across all of India, not just the Himalayan regions actually covered — see `scripts/loadtest-cleanup.sql` to remove them afterward.

## Techniques, roughly in the order to reach for them

1. **Rendering load (client-side).** Load the map with hundreds/thousands of markers and watch for dropped frames, memory growth, or the "one bad row crashes all markers" failure mode already fixed once (migration 0005). Chrome DevTools Performance tab + Memory tab while panning/zooming with the full marker set loaded. If pin count keeps growing, marker clustering (grouping nearby pins into one "12 places" bubble) is the standard fix — not needed yet at hundreds of pins, worth revisiting past a few thousand.

2. **API/DB read load.** Hit the Supabase PostgREST endpoint directly with concurrent requests (`GET /rest/v1/places?select=*`), bypassing the UI, to measure query latency and connection-pool saturation under concurrency. Free, open-source tools that work well for this: **k6** (scriptable, good free tier for this exact use), **autocannon** (npm-installable, zero setup), **Artillery**. Watch the Supabase dashboard's Database → Reports during the run for CPU and active-connections spikes — the free tier has a real connection limit, and that's the wall this kind of test finds.

3. **Multi-client simulation (realistic mixed load).** Script several concurrent Playwright/Puppeteer browser sessions against the real deployed URL, each doing a realistic sequence (load map → search a region → click a pin → open detail), not just hammering one endpoint. Closer to what real traffic looks like than a raw HTTP flood.

4. **Auth load — do NOT stress this one.** Supabase's free tier already has a known, hit-before email rate limit (GitHub issue #2). Don't script bulk signups/logins as a load test; it'll just trip the same limit again for no benefit. If auth capacity ever needs verifying, do it with a small, deliberate number of test accounts, not a load-test tool.

5. **Third-party free APIs — do NOT hammer these either.** The geocoding fallback (Nominatim, ~1 req/sec fair-use policy; Photon) and OpenFreeMap tiles are shared free public infrastructure, not Lamyig's own servers. Load-testing them would be inconsiderate at best and a good way to get the app's requests blocked at worst. If tile/geocoding latency under load matters, test with a handful of realistic requests, not a burst script.

6. **Static asset / bundle load.** The production JS bundle is already flagged as large (~1.5MB, `vite build`'s own chunk-size warning) — run Lighthouse with mobile network throttling against the deployed URL to see real first-load time on a slow connection, which matters more for Lamyig's actual users (remote-area travelers, often on weak signal) than raw server throughput does.

7. **Spike vs. soak, as separate tests.** A short burst of concurrent requests (spike) and a lower steady load sustained for 10–20 minutes (soak) catch different problems — spikes reveal connection-pool limits, soaks reveal memory leaks or slow degradation that a 30-second burst won't show. Worth running both once basic load testing (steps 1–3) passes clean.

## After testing

Run `scripts/loadtest-cleanup.sql` in the Supabase SQL Editor to remove the seeded rows and throwaway account. It's filtered by that account's `added_by`/`verified_by`/user ID, so it won't touch real data.
