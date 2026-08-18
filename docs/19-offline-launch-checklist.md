# Offline launch checklist

Run this against the production candidate before announcing offline maps. Automated tests cover application logic; this checklist covers browser storage, real radios, restarts, and OS behaviour that emulation cannot certify.

Record the device, OS/browser version, date, tester, and result. A failed **Launch gate** blocks release. Keep screenshots or a short screen recording for failures.

## Device matrix

| Device | Browser | Why it is required |
|---|---|---|
| Android phone | Current Chrome | Primary installable-PWA and IndexedDB path |
| iPhone | Current Safari, added to Home Screen | WebKit storage and standalone-mode path |
| Laptop | Current Chrome or Edge | Desktop download, hover popup, and larger-screen layout |

Use a normal browsing profile, not private/incognito mode. Private storage is temporary and is not presented as a supported offline-download location.

## Launch gates

For each device above:

- [ ] Open Lamyig online, download Spiti, and confirm the progress text advances instead of appearing frozen.
- [ ] Confirm Spiti says **Ready for the road**, reports its place count, and remains listed under **Offline maps** after closing and reopening the browser/PWA.
- [ ] Enable airplane mode, fully close Lamyig, reopen it, and open the Spiti map without dismissing an error screen.
- [ ] While offline, pan and zoom across Spiti and confirm the road map remains visible throughout the downloaded bounds.
- [ ] Confirm every downloaded Spiti place is represented when **Show all** is active. If filters hide pins, confirm **Showing X of Y places** is visible and the totals are correct.
- [ ] Search offline by region, village, exact place name, and category. Each saved result must open or centre the expected location without an external-search request.
- [ ] Open places with and without photos. Confirm the name, category, details, notes, and available photo render; a missing optional photo must not hide the place.
- [ ] Try Add place, Edit, Post note, Report, and Feedback while offline. The saved guide must remain usable, the connection message must be understandable, and typed text must remain available for Retry.
- [ ] Return online, add or edit a test place in Spiti from a second session, and confirm the first device shows **Update available** without opening the region panel first.
- [ ] Update Spiti, return to airplane mode, and confirm the changed place appears with the newest complete details.
- [ ] Start an update, interrupt connectivity partway through, and confirm the previously saved Spiti copy still opens. Reconnect and Retry successfully.
- [ ] Begin a download with insufficient device/browser storage and confirm it fails before replacing a working copy, with a useful recovery message.
- [ ] Tap Remove, choose **Keep it**, and confirm nothing changes. Repeat, choose **Remove download**, and confirm Spiti leaves Offline maps and no longer supplies offline pins.

## Overlap gate

Run once on any device with enough storage:

- [ ] Download Ladakh and Zanskar.
- [ ] In the overlapping area, confirm the same database place appears as one pin and one search result.
- [ ] Confirm unique notes and photos available from either pack remain visible.
- [ ] Remove Zanskar and confirm places also contained in Ladakh remain available.
- [ ] Confirm two genuinely different places at the same or nearby coordinates both remain visible.

## Honest limitations to verify in release copy

- [ ] Per-region sizes describe the map file; photo totals can vary and are not presented as a fixed full-pack size.
- [ ] Independent Ladakh and Zanskar map files may use extra storage where their map coverage overlaps.
- [ ] Clearing site data, uninstalling the PWA, private browsing, or browser/OS storage eviction can remove downloads. Lamyig must not imply cloud backup or cross-device sync.
- [ ] `0027_offline_region_revisions.sql` and `0028_offline_village_revisions.sql` are applied before the frontend release.

## Release record

| Device/browser | Build or commit | Tester/date | Result | Evidence/issues |
|---|---|---|---|---|
| Android Chrome |  |  | Pending |  |
| iPhone Safari/PWA |  |  | Pending |  |
| Desktop Chrome/Edge |  |  | Pending |  |

Do not change a Pending or Failed launch gate to Passed without running it on the named physical device.
