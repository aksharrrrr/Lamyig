import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// LocationIQ, not raw Nominatim: Nominatim's usage policy explicitly forbids
// autocomplete/live-search use ("will get you banned") - LocationIQ serves
// the same OSM data but with a free tier whose ToS actually permits this.
const LOCATIONIQ_TOKEN = import.meta.env.VITE_LOCATIONIQ_TOKEN as string | undefined
const SEARCH_DEBOUNCE_MS = 450
const MIN_QUERY_LENGTH = 3
const DEFAULT_ZOOM = 13
const PICKED_ZOOM = 15

interface SearchResult {
  display_name: string
  lat: string
  lon: string
  address?: {
    village?: string
    town?: string
    city?: string
    county?: string
  }
}

interface LocationPickerProps {
  lat: number | null
  lng: number | null
  /** Falls back to India-wide view when neither this nor lat/lng is set. */
  initialCenter?: { lat: number; lng: number }
  onChange: (lat: number, lng: number) => void
  /** Best-effort village name from a search result's address components - caller decides whether to use it (e.g. only if the Village field is still empty). */
  onSelectVillageName?: (name: string) => void
}

export default function LocationPicker({ lat, lng, initialCenter, onChange, onSelectVillageName }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const start = lat != null && lng != null
      ? { lat, lng }
      : initialCenter ?? { lat: 22.9734, lng: 78.6569 }
    const startZoom = lat != null && lng != null ? PICKED_ZOOM : (initialCenter ? DEFAULT_ZOOM : 4.2)

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [start.lng, start.lat],
      zoom: startZoom,
      attributionControl: false,
    })
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    const marker = new maplibregl.Marker({ draggable: true, color: '#c2542f' })
      .setLngLat([start.lng, start.lat])
      .addTo(map)

    marker.on('dragend', () => {
      const { lat: newLat, lng: newLng } = marker.getLngLat()
      onChangeRef.current(newLat, newLng)
    })

    // Tap-to-place, same as dragging the pin - lets someone who already knows
    // roughly where they are on the map skip the search step entirely.
    map.on('click', (e) => {
      marker.setLngLat(e.lngLat)
      onChangeRef.current(e.lngLat.lat, e.lngLat.lng)
    })

    mapRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // Intentionally empty deps - map/marker are created once; external
    // lat/lng changes are synced via the effect below instead of recreating
    // the map (which would lose zoom/pan state on every keystroke elsewhere
    // in the form).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the pin in sync if lat/lng change from outside (e.g. the manual
  // number-input fallback fields, or "Use my current location").
  useEffect(() => {
    if (!markerRef.current || lat == null || lng == null) return
    const current = markerRef.current.getLngLat()
    if (Math.abs(current.lat - lat) < 1e-9 && Math.abs(current.lng - lng) < 1e-9) return
    markerRef.current.setLngLat([lng, lat])
  }, [lat, lng])

  useEffect(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults([])
      setSearchError(null)
      return
    }
    if (!LOCATIONIQ_TOKEN) {
      setSearchError('Search unavailable (no LocationIQ token configured).')
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setSearching(true)
      setSearchError(null)
      try {
        const url = new URL('https://api.locationiq.com/v1/autocomplete')
        url.searchParams.set('key', LOCATIONIQ_TOKEN)
        url.searchParams.set('q', query.trim())
        url.searchParams.set('countrycodes', 'in')
        url.searchParams.set('addressdetails', '1')
        url.searchParams.set('limit', '5')
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error(`Search failed (${res.status})`)
        const data = (await res.json()) as SearchResult[]
        setResults(data)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setSearchError('Search failed. Try again, or place the pin manually.')
        setResults([])
      } finally {
        setSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  function pickResult(result: SearchResult) {
    const resultLat = Number(result.lat)
    const resultLng = Number(result.lon)
    mapRef.current?.flyTo({ center: [resultLng, resultLat], zoom: PICKED_ZOOM, duration: 1200 })
    markerRef.current?.setLngLat([resultLng, resultLat])
    onChange(resultLat, resultLng)

    const villageName = result.address?.village ?? result.address?.town ?? result.address?.city ?? result.address?.county
    if (villageName) onSelectVillageName?.(villageName)

    setQuery('')
    setResults([])
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a village or place name…"
          className="w-full rounded-[10px] border border-ink/[0.14] bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent-light"
        />
        {(results.length > 0 || searching || searchError) && (
          <div className="absolute z-10 mt-1 w-full rounded-[10px] border border-ink/10 bg-surface shadow-lg">
            {searching && <p className="px-3.5 py-2 text-xs text-muted">Searching…</p>}
            {searchError && <p className="px-3.5 py-2 text-xs text-danger">{searchError}</p>}
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pickResult(r)}
                className="block w-full truncate px-3.5 py-2 text-left text-sm hover:bg-ink/5"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-[11.5px] text-muted">Search to jump to the area, then drag the pin (or tap the map) to the exact spot.</p>
      <div ref={containerRef} className="h-56 w-full overflow-hidden rounded-xl border border-ink/10" />
    </div>
  )
}
