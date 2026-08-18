import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import Map, { type MapHandle, type MapStyleName } from '../components/Map'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { usePlacesStore } from '../lib/usePlacesStore'
import { useToast } from '../lib/useToast'
import { CATEGORIES, categoryDef } from '../lib/categories'
import { CATEGORY_ICONS } from '../lib/categoryIcons'
import { geocodeSearch, type GeocodeResult } from '../lib/geocode'
import { MAP_STYLES, MAP_STYLE_LABELS, ZOOM_VILLAGE } from '../lib/constants'
import type { Region, Village } from '../lib/types'
import { getLastOfflineRegion, getOfflinePackStatuses, isOfflineRegionSlug, OFFLINE_REGION_CONFIG, type OfflinePackStatus } from '../lib/offlinePack'
import { OFFLINE_CONTRIBUTION_MESSAGE } from '../lib/connectivity'

// Treks now also exist as a real, place-attachable entity (the `treks`
// table, migration 0024) - this flat list is kept independent on purpose,
// just for this dropdown's fly-to behavior, rather than round-tripping
// through a fetch for something this small and rarely-changing.
const TREKS: { name: string; lat: number; lng: number }[] = [
  { name: 'Hampta Pass', lat: 32.2408, lng: 77.2668 },
  { name: 'Pin Parvati Pass', lat: 31.9522, lng: 77.6539 },
  { name: 'Bhrigu Lake', lat: 32.2957, lng: 77.3324 },
  { name: 'Triund', lat: 32.2438, lng: 76.3389 },
  { name: 'Kheerganga', lat: 32.0186, lng: 77.3204 },
]

const CATEGORY_FILTER_KEY = 'lamyig:selectedCategories'

function loadStoredCategories(): Set<string> {
  try {
    const raw = localStorage.getItem(CATEGORY_FILTER_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch {
    // ignore malformed/unavailable storage, fall through to the default
  }
  // First-time visitors see homestays only, not everything at once.
  return new Set(['homestay'])
}

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const { places } = usePlacesStore()
  const { showToast } = useToast()
  const mapRef = useRef<MapHandle>(null)

  const [regions, setRegions] = useState<Region[]>([])
  const [villages, setVillages] = useState<Village[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(loadStoredCategories)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapStyle, setMapStyleState] = useState<MapStyleName>('liberty')
  const [osmResults, setOsmResults] = useState<GeocodeResult[]>([])
  const [geocoding, setGeocoding] = useState(false)
  const [listening, setListening] = useState(false)
  const [regionMenuOpen, setRegionMenuOpen] = useState(false)
  const [trekSubmenuOpen, setTrekSubmenuOpen] = useState(false)
  const [trekDropdownOpen, setTrekDropdownOpen] = useState(false)
  const [offlineStatuses, setOfflineStatuses] = useState<OfflinePackStatus[]>([])
  const offlinePacks = offlineStatuses.map(({ pack }) => pack)
  const hasOfflineUpdate = offlineStatuses.some(({ updateAvailable }) => updateAvailable)
  const [online, setOnline] = useState(navigator.onLine)
  const requestedOfflineSlug = new URLSearchParams(location.search).get('offline')
  const offlineMapRequested = isOfflineRegionSlug(requestedOfflineSlug) ? requestedOfflineSlug : null
  const lastOfflineSlug = getLastOfflineRegion()
  const activeOfflinePack = offlinePacks.find((pack) => pack.slug === offlineMapRequested)
    ?? (!online ? offlinePacks.find((pack) => pack.slug === lastOfflineSlug) ?? offlinePacks[0] : null)
  const searchableRegions = [...new globalThis.Map([
    ...regions,
    ...offlinePacks.map((pack) => pack.region),
  ].map((region) => [region.id, region])).values()]
  const searchableVillages = [...new globalThis.Map([
    ...villages,
    ...offlinePacks.flatMap((pack) => pack.villages ?? []),
  ].map((village) => [village.id, village])).values()]

  useEffect(() => {
    const refreshPack = () => getOfflinePackStatuses().then(setOfflineStatuses).catch(() => setOfflineStatuses([]))
    const connectionChanged = () => { setOnline(navigator.onLine); refreshPack() }
    refreshPack()
    window.addEventListener('online', connectionChanged)
    window.addEventListener('offline', connectionChanged)
    window.addEventListener('lamyig:offline-pack-updated', refreshPack)
    return () => {
      window.removeEventListener('online', connectionChanged)
      window.removeEventListener('offline', connectionChanged)
      window.removeEventListener('lamyig:offline-pack-updated', refreshPack)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const pathRegion = location.pathname.startsWith('/region/') ? location.pathname.split('/')[2] : null
    const requestedRegion = pathRegion ?? params.get('region')
    if (!requestedRegion) return
    const region = regions.find((candidate) => candidate.slug === requestedRegion)
    if (region?.center_lat != null && region.center_lng != null) {
      mapRef.current?.flyTo(region.center_lat, region.center_lng, region.default_zoom)
    }
  }, [location.pathname, location.search, regions])

  const activeOfflineRegion = activeOfflinePack?.region
  useEffect(() => {
    if (!activeOfflineRegion) return
    const { center_lat, center_lng, default_zoom } = activeOfflineRegion
    if (center_lat != null && center_lng != null) mapRef.current?.flyTo(center_lat, center_lng, default_zoom)
  }, [activeOfflineRegion])

  useEffect(() => {
    if (!supabase) return
    supabase.from('regions').select('*').order('name').then(({ data }) => {
      if (data) setRegions(data as Region[])
    })
    // Fetched once, unfiltered - just used to power search suggestions
    // (village count is small enough that this is cheaper than a query per
    // keystroke, and it's the same free ilike-on-Postgres approach as
    // regions, not a separate search service).
    supabase.from('villages').select('*').then(({ data }) => {
      if (data) setVillages(data as Village[])
    })
  }, [])

  function toggleCategory(value: string) {
    setSelectedCategories((current) => {
      const next = new Set(current)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      localStorage.setItem(CATEGORY_FILTER_KEY, JSON.stringify([...next]))
      return next
    })
  }

  // No categories selected = no pins - selection is opt-in, not opt-out.
  const visiblePlaces = places.filter((p) => selectedCategories.has(p.category))
  const filtersHidePlaces = visiblePlaces.length < places.length

  function showAllPlaces() {
    const next = new Set(places.map((place) => place.category))
    setSelectedCategories(next)
    localStorage.setItem(CATEGORY_FILTER_KEY, JSON.stringify([...next]))
  }

  // The quick-nav chip row is for D-009's headline destinations only
  // (Spiti/Ladakh/Zanskar/Sikkim/Treks) - `regions` itself stays unfiltered
  // (used for search suggestions and map pins across every region, including
  // newer non-featured ones like Kutch/Thar/Meghalaya/Ziro/Kumaon).
  const featuredRegions = regions.filter((r) => r.featured)

  function openOverlay(path: string) {
    navigate(path, { state: { background: location } })
  }

  function flyToRegion(region: Region) {
    if (region.center_lat == null || region.center_lng == null) {
      showToast(`Don't have a map location for ${region.name} yet`)
      return
    }
    mapRef.current?.flyTo(region.center_lat, region.center_lng, region.default_zoom)
    setSearchQuery('')
  }

  function openRegion(region: Region) {
    flyToRegion(region)
    openOverlay(`/region/${region.slug}`)
  }

  function flyToVillage(village: Village) {
    if (village.center_lat == null || village.center_lng == null) {
      showToast(`Don't have a map location for ${village.name} yet`)
      return
    }
    mapRef.current?.flyTo(village.center_lat, village.center_lng, ZOOM_VILLAGE)
    setSearchQuery('')
  }

  function flyToTrek(trek: (typeof TREKS)[number]) {
    mapRef.current?.flyTo(trek.lat, trek.lng, ZOOM_VILLAGE)
  }

  // Search matches downloaded and live Lamyig content first. Downloaded
  // packs carry their villages and places, so this path needs no signal.
  // If nothing local matches while online, it falls back to free OSM
  // geocoding (Photon then
  // Nominatim, see lib/geocode.ts) so you can still fly to any place name -
  // clearly labeled "via OpenStreetMap" since Lamyig has no curated content
  // there.
  const query = searchQuery.trim().toLowerCase()
  const matchingRegions = query ? searchableRegions.filter((r) => r.name.toLowerCase().includes(query)) : []
  const matchingVillages = query ? searchableVillages.filter((v) => v.name.toLowerCase().includes(query)) : []
  const matchingPlaces = query ? places.filter((place) => {
    const category = categoryDef(place.category)
    return place.name.toLowerCase().includes(query)
      || place.category.toLowerCase().includes(query)
      || Boolean(category?.label.toLowerCase().includes(query))
  }) : []
  const localResultCount = matchingRegions.length + matchingVillages.length + matchingPlaces.length

  useEffect(() => {
    const q = searchQuery.trim()
    if (!online || q.length < 3 || localResultCount > 0) {
      setOsmResults([])
      return
    }
    setGeocoding(true)
    // Debounced - both Photon and Nominatim are free public services with a
    // "don't hammer us" fair-use expectation (see docs/15-free-tier-limits.md),
    // so this only fires 450ms after typing pauses, not on every keystroke.
    const timer = setTimeout(() => {
      geocodeSearch(q).then(setOsmResults).finally(() => setGeocoding(false))
    }, 450)
    return () => { clearTimeout(timer); setGeocoding(false) }
  }, [searchQuery, localResultCount, online])

  type SearchResult =
    | { kind: 'region'; key: string; item: Region }
    | { kind: 'village'; key: string; item: Village }
    | { kind: 'place'; key: string; item: (typeof places)[number] }
    | { kind: 'osm'; key: string; item: GeocodeResult }

  const searchResults: SearchResult[] = query
    ? [
        ...matchingRegions.map((r): SearchResult => ({ kind: 'region', key: `region-${r.id}`, item: r })),
        ...matchingVillages.map((v): SearchResult => ({ kind: 'village', key: `village-${v.id}`, item: v })),
        ...matchingPlaces.map((p): SearchResult => ({ kind: 'place', key: `place-${p.id}`, item: p })),
        ...osmResults.map((o, i): SearchResult => ({ kind: 'osm', key: `osm-${i}`, item: o })),
      ].slice(0, 6)
    : []

  function selectSearchResult(result: SearchResult) {
    if (result.kind === 'region') flyToRegion(result.item)
    else if (result.kind === 'village') flyToVillage(result.item)
    else if (result.kind === 'place') {
      mapRef.current?.flyTo(result.item.lat, result.item.lng, 15)
      setSearchQuery('')
    }
    else {
      mapRef.current?.flyTo(result.item.lat, result.item.lng, 11)
      setSearchQuery('')
      showToast('No Lamyig places here yet. Be the first to add one.')
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && searchResults.length > 0) selectSearchResult(searchResults[0])
  }

  // Same searchQuery state the typed input uses - voice is just an alt way
  // to fill it in, the rest of the search pipeline (local match + OSM
  // geocode fallback) stays untouched.
  function startVoiceSearch() {
    const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      showToast("Voice search isn't supported on this browser.")
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (e: any) => setSearchQuery(e.results[0][0].transcript)
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    setListening(true)
    recognition.start()
  }

  const initials = session?.user.email ? session.user.email.slice(0, 2).toUpperCase() : null

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Map
        ref={mapRef}
        places={visiblePlaces}
        offlineMapFile={activeOfflinePack?.mapFile ?? null}
        mapStyle={mapStyle}
        onSelectPlace={(id) => openOverlay(`/place/${id}`)}
        onLocateError={() => showToast("Couldn't get your location. Check permissions and try again.")}
      />

      {/* Subtle vignette so floating light UI stays legible over any map color underneath */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 50% 40%, rgba(255,255,255,0) 60%, rgba(35,30,45,0.10) 100%)' }}
      />

      {/* Title, top-left corner */}
      <div className="absolute left-[18px] top-[18px] z-10 flex items-center gap-2 rounded-2xl border border-ink/[0.06] bg-surface px-3 py-1.5 leading-tight shadow-lg">
        <img src="/pwa-192x192.png" alt="" className="h-7 w-7 flex-none" />
        <div className="flex flex-col items-start justify-center">
          <span className="text-[15px] font-bold tracking-tight">Lamyig</span>
          <span className="text-[11px] font-medium text-muted-light">ལམ་ཡིག</span>
        </div>
      </div>

      {/* Profile avatar */}
      <button
        onClick={() => (session ? openOverlay('/profile') : openOverlay('/auth'))}
        title="Profile"
        className="absolute right-[18px] top-[18px] z-10 flex h-11 w-11 items-center justify-center rounded-full border border-ink/[0.08] bg-accent-light text-[14px] font-bold text-accent-text shadow-lg"
      >
        {initials ?? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
          </svg>
        )}
      </button>

      {/* Search - z-30, not z-10: this div and the category-pills div below
          are each position:absolute, which makes each its own stacking
          context. The dropdown inside declaring z-20 only outranks siblings
          within THIS div - compared against the pills div (also z-10,
          later in the DOM), equal z-index falls back to DOM order, so the
          pills painted on top and hid the dropdown's actual result text
          behind their opaque buttons (only the trailing "Village"/"Region"
          label peeked out where the pills row had empty space). */}
      <div className="absolute left-[18px] right-[18px] top-[78px] z-30 mx-auto max-w-[720px]">
        <div className="flex h-12 items-center gap-2.5 rounded-full border border-ink/[0.06] bg-surface px-[18px] shadow-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a8791" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search anywhere along your journey…"
            className="min-w-0 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-muted-light"
          />
          <button
            type="button"
            onClick={startVoiceSearch}
            title="Search by voice"
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full"
            style={{ color: listening ? 'var(--color-accent)' : '#8a8791' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10.5a7 7 0 0 0 14 0" /><path d="M12 17.5v4" /><path d="M8.5 21.5h7" />
            </svg>
          </button>
        </div>
        {(searchResults.length > 0 || (query.length >= 3 && localResultCount === 0)) && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-ink/[0.06] bg-surface shadow-lg">
            {searchResults.map((result) => (
              <button
                key={result.key}
                onClick={() => selectSearchResult(result)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[14px] hover:bg-ink/5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8791" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.2" />
                </svg>
                <span className="min-w-0 flex-1 truncate">{result.item.name}</span>
                <span className="shrink-0 text-[12px] text-muted-light">
                  {result.kind === 'region'
                    ? 'Region'
                    : result.kind === 'village'
                      ? 'Village'
                      : result.kind === 'place'
                        ? categoryDef(result.item.category)?.label ?? 'Place'
                        : 'via OpenStreetMap'}
                </span>
              </button>
            ))}
            {searchResults.length === 0 && geocoding && (
              <div className="px-4 py-2.5 text-[13px] text-muted-light">Looking that up…</div>
            )}
            {searchResults.length === 0 && !geocoding && query.length >= 3 && (
              <div className="px-4 py-2.5 text-[13px] text-muted-light">
                No place found for "{searchQuery.trim()}". Think this is a mistake?{' '}
                <button type="button" onClick={() => openOverlay('/feedback')} className="font-semibold text-accent underline">
                  Tell us
                </button>
                .
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category cluster - sits right under the search bar (Google Maps
          style), icon+label always visible on every breakpoint, multi-select
          toggle logic unchanged. */}
      <div className="absolute left-0 right-0 top-[134px] z-10 sm:left-1/2 sm:right-auto sm:w-[min(720px,calc(100vw-36px))] sm:-translate-x-1/2">
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto py-1" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map((c) => {
              const selected = selectedCategories.has(c.value)
              const CategoryIcon = CATEGORY_ICONS[c.value]
              const count = places.reduce((n, p) => (p.category === c.value ? n + 1 : n), 0)
              return (
                <button
                  key={c.value}
                  onClick={() => toggleCategory(c.value)}
                  className="flex h-11 flex-none items-center gap-1.5 rounded-full border px-3.5 shadow-lg transition-all"
                  style={{
                    background: selected ? c.color : 'var(--color-surface)',
                    borderColor: selected ? 'transparent' : 'rgba(32,31,35,0.10)',
                    boxShadow: selected ? 'inset 0 2px 6px rgba(0,0,0,0.18), 0 4px 12px rgba(30,20,45,0.28)' : undefined,
                  }}
                >
                  <CategoryIcon color={selected ? '#ffffff' : '#55525c'} size={16} />
                  <span className="whitespace-nowrap text-[13px] font-semibold" style={{ color: selected ? '#ffffff' : 'var(--color-ink)' }}>
                    {c.label}
                  </span>
                  <span
                    className="whitespace-nowrap text-[12px] font-medium"
                    style={{ color: selected ? 'rgba(255,255,255,0.75)' : 'var(--color-muted-light)' }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
          {filtersHidePlaces && (
            <div className="mt-1 flex justify-center">
              <div className="flex items-center gap-1.5 rounded-full border border-ink/[0.06] bg-surface/95 px-3 py-1.5 text-[12px] text-muted shadow-md backdrop-blur-sm">
                <span>Showing {visiblePlaces.length} of {places.length} places</span>
                <span aria-hidden="true">·</span>
                <button type="button" onClick={showAllPlaces} className="font-semibold text-accent underline underline-offset-2">
                  Show all
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Region quick-zoom. Tablet/desktop: always-visible scroll row.
          Phone: collapses to a single "Popular destinations" toggle whose
          list opens upward (bottom-full) so it's never clipped by the
          browser's bottom chrome. */}
      <div className="absolute bottom-[56px] left-1/2 z-10 max-w-[min(680px,calc(100vw-32px))] -translate-x-1/2 sm:bottom-[22px]">
        <div className="hidden items-center overflow-x-auto rounded-full border border-ink/[0.06] bg-surface px-2 py-1.5 shadow-lg sm:flex sm:gap-1" style={{ scrollbarWidth: 'none' }}>
          {featuredRegions.map((r) => (
            <button
              key={r.id}
              onClick={() => openRegion(r)}
              className="flex-none whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium text-ink hover:bg-ink/5"
            >
              {r.name}
            </button>
          ))}

          {/* Treks: not a Region (spans villages/regions), so it's a separate
              flyout pill rather than another item in the regions row. The
              popup itself renders outside this row (see below) because this
              row is overflow-x-auto - browsers coerce a lone overflow-x onto
              overflow-y too, so a bottom-full popup nested in here gets
              silently clipped instead of floating above it. */}
          <button
            onClick={() => setTrekDropdownOpen((v) => !v)}
            className="relative z-20 flex flex-none items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium text-ink hover:bg-ink/5"
          >
            Treks
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: trekDropdownOpen ? 'rotate(180deg)' : 'none' }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        {trekDropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setTrekDropdownOpen(false)} />
            <div className="absolute bottom-full right-0 z-20 mb-2 hidden w-[220px] overflow-hidden rounded-2xl border border-ink/[0.06] bg-surface shadow-xl sm:block">
              {TREKS.map((t) => (
                <button
                  key={t.name}
                  onClick={() => { flyToTrek(t); setTrekDropdownOpen(false) }}
                  className="flex w-full items-center px-4 py-2.5 text-left text-[14px] hover:bg-ink/5"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="relative sm:hidden">
          {regionMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => { setRegionMenuOpen(false); setTrekSubmenuOpen(false) }} />
              <div className="absolute bottom-full left-1/2 z-20 mb-2 w-[min(280px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-ink/[0.06] bg-surface shadow-xl">
                {featuredRegions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { openRegion(r); setRegionMenuOpen(false) }}
                    className="flex w-full items-center px-4 py-2.5 text-left text-[14px] hover:bg-ink/5"
                  >
                    {r.name}
                  </button>
                ))}

                {/* Treks: nested accordion row inside the same dropdown,
                    click expands the trek list inline rather than opening
                    a second popup (avoids off-screen flyout clipping on phone). */}
                <button
                  onClick={() => setTrekSubmenuOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[14px] font-semibold hover:bg-ink/5"
                >
                  Treks
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: trekSubmenuOpen ? 'rotate(180deg)' : 'none' }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {trekSubmenuOpen && TREKS.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => { flyToTrek(t); setRegionMenuOpen(false); setTrekSubmenuOpen(false) }}
                    className="flex w-full items-center py-2.5 pl-8 pr-4 text-left text-[13.5px] text-muted-light hover:bg-ink/5"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => setRegionMenuOpen((v) => !v)}
            className="relative z-20 flex items-center gap-1.5 rounded-full border border-ink/[0.06] bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink shadow-lg"
          >
            Popular destinations
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: regionMenuOpen ? 'rotate(180deg)' : 'none' }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Utility stack */}
      <div className="absolute bottom-[30px] right-[14px] z-10 flex flex-col items-center gap-2.5">
        <button
          onClick={() => openOverlay('/offline-maps')}
          title="Offline maps"
          className="relative flex h-11 items-center justify-center gap-1.5 rounded-full border border-ink/[0.08] bg-surface px-3 shadow-lg hover:scale-105"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55525c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6.5 9 4l6 2.5L20 4v13.5L15 20l-6-2.5L4 20z" /><path d="M9 4v13.5M15 6.5V20" />
            <path d="M12 8v5m0 0-2-2m2 2 2-2" />
          </svg>
          <span className="text-xs font-semibold text-ink">
            {activeOfflinePack && isOfflineRegionSlug(activeOfflinePack.slug)
              ? `${OFFLINE_REGION_CONFIG[activeOfflinePack.slug].name} offline`
              : 'Offline'}
          </span>
          {offlinePacks.length > 0 && (
            <span className={`absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-surface ${hasOfflineUpdate ? 'bg-danger' : 'bg-accent'}`} />
          )}
        </button>
        <button
          onClick={() => {
            if (!navigator.onLine) return showToast(OFFLINE_CONTRIBUTION_MESSAGE)
            openOverlay('/add')
          }}
          title="Add a place"
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-ink/[0.08] bg-accent-light shadow-xl hover:scale-105"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-text)" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
        </button>
        <button
          onClick={() => openOverlay('/feedback')}
          title="Send feedback"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/[0.08] bg-surface shadow-lg hover:scale-105"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55525c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
        <button
          onClick={() => mapRef.current?.locate()}
          title="My location"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/[0.08] bg-surface shadow-lg hover:scale-105"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55525c" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="6.2" /><circle cx="12" cy="12" r="1.6" />
            <path d="M12 2.5v3" /><path d="M12 18.5v3" /><path d="M2.5 12h3" /><path d="M18.5 12h3" />
          </svg>
        </button>
        <button
          onClick={() => {
            const next = MAP_STYLES[(MAP_STYLES.indexOf(mapStyle) + 1) % MAP_STYLES.length]
            setMapStyleState(next)
            mapRef.current?.setMapStyle(next)
            showToast(`Map style: ${MAP_STYLE_LABELS[next]}`)
          }}
          title="Map style"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/[0.08] bg-surface shadow-lg hover:scale-105"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55525c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4l8 4.7-8 4.7-8-4.7z" /><path d="M4 13.6l8 4.7 8-4.7" />
          </svg>
        </button>
        <a
          href="https://github.com/aksharrrrr/Lamyig"
          target="_blank"
          rel="noopener noreferrer"
          title="Made with ❤️ in India, for everyone - view source on GitHub"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/[0.08] bg-surface shadow-lg hover:scale-105"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#55525c">
            <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.53.1.72-.23.72-.51v-1.98c-2.94.64-3.56-1.28-3.56-1.28-.48-1.22-1.17-1.55-1.17-1.55-.96-.65.07-.64.07-.64 1.06.07 1.62 1.09 1.62 1.09.94 1.61 2.46 1.15 3.06.87.1-.68.37-1.15.67-1.41-2.35-.27-4.82-1.17-4.82-5.22 0-1.15.41-2.09 1.09-2.83-.11-.27-.47-1.35.1-2.81 0 0 .89-.28 2.91 1.08a10.1 10.1 0 0 1 5.3 0c2.02-1.36 2.91-1.08 2.91-1.08.57 1.46.21 2.54.1 2.81.68.74 1.09 1.68 1.09 2.83 0 4.06-2.48 4.95-4.84 5.21.38.33.72.97.72 1.96v2.9c0 .28.19.62.73.51A10.5 10.5 0 0 0 12 1.5z" />
          </svg>
        </a>
        <button
          onClick={() => openOverlay('/vision')}
          title="Why Lamyig exists"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/[0.08] bg-surface shadow-lg hover:scale-105"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55525c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M15.5 8.5l-2.2 5.2-5.2 2.2 2.2-5.2z" />
          </svg>
        </button>
        <a
          href="https://x.com/AksharRughani"
          target="_blank"
          rel="noopener noreferrer"
          title="Follow on X"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/[0.08] bg-surface shadow-lg hover:scale-105"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#55525c">
            <path d="M18.42 2h2.9l-6.34 7.24L22.5 22h-6.1l-4.78-6.25L5.6 22H2.7l6.78-7.75L2 2h6.25l4.32 5.71L18.42 2zm-1.02 18.17h1.6L7.68 3.75H5.96L17.4 20.17z" />
          </svg>
        </a>
      </div>
    </div>
  )
}
