// Shared constants and enum-like value lists used across more than one
// file - kept in one place so a change only has to happen once, and so a
// new file that needs one of these reuses it instead of re-declaring its
// own (slightly different) copy. Values still only used in a single file
// stay local to that file - this isn't a dumping ground for every literal
// in the app.

// Matches the `report_reason` Postgres enum exactly - see
// supabase/migrations/0001_init.sql. Keep these in sync if that enum ever
// changes.
export const REPORT_REASONS = ['spam', 'incorrect', 'closed', 'duplicate'] as const

export const MAX_PHOTOS = 6

// Loose on purpose - accepts +country codes, spaces, dashes, parens - but
// rejects "ajbnfkdsj"-style garbage so at least it's plausibly a phone
// number. The parens MUST be escaped inside the character class: HTML5's
// `pattern` compiles with the regex "v" flag, which treats bare ( ) inside
// [...] as a syntax error - and an unparseable pattern is spec'd to
// silently impose no restriction at all, so validation looked like it was
// doing nothing.
export const PHONE_PATTERN = '^[0-9+][0-9+\\-\\s\\(\\)]{6,19}$'

// Default map center/zoom when nothing more specific (a place's own
// coordinates, a region/village/trek center) is known. The India-center
// coordinate used to be independently hardcoded in both Map.tsx and
// LocationPicker.tsx - same value, two copies.
export const INDIA_CENTER = { lat: 22.9734, lng: 78.6569 }
export const ZOOM_INDIA = 4.2
export const ZOOM_REGION = 13
export const ZOOM_VILLAGE = 12
// "Zoomed in on one exact point" - used for a picked/located/searched
// place, not just a general area. Used to be PICKED_ZOOM in
// LocationPicker.tsx and MY_LOCATION_ZOOM in Map.tsx - same value (15),
// two names.
export const ZOOM_PRECISE = 15

// OpenFreeMap serves several real styles beyond our default (liberty) -
// confirmed live: liberty/bright/positron/dark/fiord all return valid style
// JSON at tiles.openfreemap.org/styles/{name}. Cycling a curated 3 rather
// than all 5, matching the original design reference's voyager/light/dark
// 3-way toggle.
export const MAP_STYLES = ['liberty', 'positron', 'dark'] as const
export type MapStyleName = (typeof MAP_STYLES)[number]
// OpenFreeMap's own style names ("liberty", "positron") mean nothing to a
// traveller - these are what the map-style toggle actually shows/announces.
export const MAP_STYLE_LABELS: Record<MapStyleName, string> = {
  liberty: 'Default',
  positron: 'Light',
  dark: 'Dark',
}
