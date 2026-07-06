import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Map, { MAP_STYLES, type MapHandle, type MapStyleName } from '../components/Map'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { usePlacesStore } from '../lib/usePlacesStore'
import { useToast } from '../lib/useToast'
import { CATEGORIES } from '../lib/categories'
import { CATEGORY_ICONS } from '../lib/categoryIcons'
import { geocodeSearch, type GeocodeResult } from '../lib/geocode'
import type { Region, Village } from '../lib/types'
import headerMark from '../assets/header-mark.png'

const VILLAGE_ZOOM = 12

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

  function openOverlay(path: string) {
    navigate(path, { state: { background: location } })
  }

  function flyToRegion(region: Region) {
    if (region.center_lat == null || region.center_lng == null) {
      showToast(`No map location set for ${region.name} yet`)
      return
    }
    mapRef.current?.flyTo(region.center_lat, region.center_lng, region.default_zoom)
    setSearchQuery('')
  }

  function flyToVillage(village: Village) {
    if (village.center_lat == null || village.center_lng == null) {
      showToast(`No map location set for ${village.name} yet`)
      return
    }
    mapRef.current?.flyTo(village.center_lat, village.center_lng, VILLAGE_ZOOM)
    setSearchQuery('')
  }

  // Search matches regions and villages first (real Lamyig content). If
  // nothing local matches, it falls back to free OSM geocoding (Photon then
  // Nominatim, see lib/geocode.ts) so you can still fly to any place name -
  // clearly labeled "via OpenStreetMap" since Lamyig has no curated content
  // there. Matching individual Places is still separate, later scope.
  const query = searchQuery.trim().toLowerCase()
  const matchingRegions = query ? regions.filter((r) => r.name.toLowerCase().includes(query)) : []
  const matchingVillages = query ? villages.filter((v) => v.name.toLowerCase().includes(query)) : []
  const localResultCount = matchingRegions.length + matchingVillages.length

  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 3 || localResultCount > 0) {
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
  }, [searchQuery, localResultCount])

  type SearchResult =
    | { kind: 'region'; key: string; item: Region }
    | { kind: 'village'; key: string; item: Village }
    | { kind: 'osm'; key: string; item: GeocodeResult }

  const searchResults: SearchResult[] = query
    ? [
        ...matchingRegions.map((r): SearchResult => ({ kind: 'region', key: `region-${r.id}`, item: r })),
        ...matchingVillages.map((v): SearchResult => ({ kind: 'village', key: `village-${v.id}`, item: v })),
        ...osmResults.map((o, i): SearchResult => ({ kind: 'osm', key: `osm-${i}`, item: o })),
      ].slice(0, 6)
    : []

  function selectSearchResult(result: SearchResult) {
    if (result.kind === 'region') flyToRegion(result.item)
    else if (result.kind === 'village') flyToVillage(result.item)
    else {
      mapRef.current?.flyTo(result.item.lat, result.item.lng, 11)
      setSearchQuery('')
      showToast('No Lamyig places here yet — be the first to add one')
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && searchResults.length > 0) selectSearchResult(searchResults[0])
  }

  const initials = session?.user.email ? session.user.email.slice(0, 2).toUpperCase() : null

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Map ref={mapRef} places={visiblePlaces} onSelectPlace={(id) => openOverlay(`/place/${id}`)} />

      {/* Subtle vignette so floating light UI stays legible over any map color underneath */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 50% 40%, rgba(255,255,255,0) 60%, rgba(35,30,45,0.10) 100%)' }}
      />

      {/* Top bar: logo + region chips */}
      <div className="absolute left-1/2 top-[18px] z-10 flex max-w-[min(920px,calc(100vw-148px))] -translate-x-1/2 items-center gap-2.5 rounded-full border border-ink/[0.06] bg-surface/95 px-2.5 py-2 shadow-lg backdrop-blur-sm">
        <div className="flex flex-none items-center gap-2 px-1">
          <img src={headerMark} alt="" className="h-7 w-7 rounded-[9px]" />
          <span className="text-[15px] font-bold tracking-tight">Lamyig</span>
        </div>
        <div className="h-[22px] w-px flex-none bg-ink/10" />
        <div className="relative min-w-0">
          <div className="flex gap-1.5 overflow-x-auto p-0.5" style={{ scrollbarWidth: 'none' }}>
            {regions.map((r) => (
              <button
                key={r.id}
                onClick={() => flyToRegion(r)}
                className="flex-none rounded-full px-3.5 py-1.5 text-[13px] font-medium text-ink hover:bg-ink/5"
              >
                {r.name}
              </button>
            ))}
          </div>
          {/* Hints that the pill row scrolls when it overflows the header on narrow/mobile widths */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-surface/95 to-transparent" />
        </div>
      </div>

      {/* Profile avatar */}
      <button
        onClick={() => (session ? openOverlay('/profile') : navigate('/auth'))}
        title="Profile"
        className="absolute right-[18px] top-[18px] z-10 flex h-11 w-11 items-center justify-center rounded-full border border-ink/[0.08] bg-accent-light text-[14px] font-bold text-accent-text shadow-lg"
      >
        {initials ?? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
          </svg>
        )}
      </button>

      {/* Search */}
      <div className="absolute left-1/2 top-[78px] z-10 w-[clamp(300px,60vw,720px)] max-w-[calc(100vw-32px)] -translate-x-1/2">
        <div className="flex h-12 items-center gap-2.5 rounded-full border border-ink/[0.06] bg-surface/95 px-[18px] shadow-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a8791" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search a region, village, or place…"
            className="min-w-0 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-muted-light"
          />
        </div>
        {(searchResults.length > 0 || (geocoding && localResultCount === 0 && query.length >= 3)) && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-ink/[0.06] bg-surface/95 shadow-lg">
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
                  {result.kind === 'region' ? 'Region' : result.kind === 'village' ? 'Village' : 'via OpenStreetMap'}
                </span>
              </button>
            ))}
            {searchResults.length === 0 && geocoding && (
              <div className="px-4 py-2.5 text-[13px] text-muted-light">Searching…</div>
            )}
          </div>
        )}
      </div>

      {/* Category cluster. Extra bottom clearance below the sm breakpoint so
          it doesn't sit on top of MapLibre's required attribution bar, which
          spans the full viewport width on narrow (phone) screens. */}
      <div className="absolute bottom-[56px] left-1/2 z-10 flex max-w-[min(560px,calc(100vw-150px))] -translate-x-1/2 flex-wrap justify-center gap-1 rounded-3xl border border-ink/[0.06] bg-surface/95 px-3 py-2.5 shadow-xl backdrop-blur-sm sm:bottom-[22px]">
        {CATEGORIES.map((c) => {
          const selected = selectedCategories.has(c.value)
          const CategoryIcon = CATEGORY_ICONS[c.value]
          return (
            <button
              key={c.value}
              onClick={() => toggleCategory(c.value)}
              className="flex flex-col items-center gap-1 px-1.5 py-0.5"
            >
              <span
                className="flex h-[46px] w-[46px] items-center justify-center rounded-full border transition-all"
                style={{
                  background: selected ? 'var(--color-accent)' : 'var(--color-surface)',
                  borderColor: selected ? 'transparent' : 'rgba(32,31,35,0.14)',
                  boxShadow: selected ? 'inset 0 2px 6px rgba(0,0,0,0.18), 0 4px 12px rgba(90,45,150,0.28)' : 'none',
                }}
              >
                <CategoryIcon color={selected ? '#ffffff' : '#55525c'} size={20} />
              </span>
              <span className="text-[11px] font-semibold" style={{ color: selected ? 'var(--color-ink)' : 'var(--color-muted-light)' }}>
                {c.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Utility stack */}
      <div className="absolute bottom-[30px] right-[14px] z-10 flex flex-col items-center gap-2.5">
        <button
          onClick={() => openOverlay('/add')}
          title="Add a place"
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-accent shadow-xl hover:bg-accent-dark"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
        </button>
        <button
          onClick={() => { mapRef.current?.locate(); showToast('Centered on your location') }}
          title="My location"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/[0.08] bg-surface/95 shadow-lg hover:scale-105"
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
            showToast(`Map style: ${next}`)
          }}
          title="Map style"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/[0.08] bg-surface/95 shadow-lg hover:scale-105"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#55525c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4l8 4.7-8 4.7-8-4.7z" /><path d="M4 13.6l8 4.7 8-4.7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
