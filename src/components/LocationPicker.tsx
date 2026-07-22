import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { createMarkerElement } from './Map'
import { geocodeSearch, type GeocodeResult } from '../lib/geocode'

const SEARCH_DEBOUNCE_MS = 450
const MIN_QUERY_LENGTH = 3
const DEFAULT_ZOOM = 13
const PICKED_ZOOM = 15

interface LocationPickerProps {
  lat: number | null
  lng: number | null
  /** Marker uses the same category-colored icon as the real map pin (Map.tsx) - the picker's pin looks exactly like the place will once it's live. */
  category: string
  /** Falls back to India-wide view when neither this nor lat/lng is set. */
  initialCenter?: { lat: number; lng: number }
  onChange: (lat: number, lng: number) => void
  /** Best-effort village name from a search result's address components - caller decides whether to use it (e.g. only if the Village field is still empty). */
  onSelectVillageName?: (name: string) => void
}

export default function LocationPicker({ lat, lng, category, initialCenter, onChange, onSelectVillageName }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodeResult[]>([])
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

    const marker = new maplibregl.Marker({ element: createMarkerElement(category), draggable: true, anchor: 'center' })
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
    // Intentionally excludes category/lat/lng/initialCenter - map/marker are
    // created once; category swaps are handled by the effect below (destroy
    // + recreate the marker element in place) and lat/lng changes by the
    // effect after that, rather than recreating the whole map (which would
    // lose zoom/pan state on every keystroke elsewhere in the form).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Category changed (e.g. switched from homestay to camping) - swap the
  // marker's icon in place so it still matches what the real map pin will
  // look like, without losing the current position.
  useEffect(() => {
    const map = mapRef.current
    const oldMarker = markerRef.current
    if (!map || !oldMarker) return
    const pos = oldMarker.getLngLat()
    oldMarker.remove()
    const marker = new maplibregl.Marker({ element: createMarkerElement(category), draggable: true, anchor: 'center' })
      .setLngLat(pos)
      .addTo(map)
    marker.on('dragend', () => {
      const { lat: newLat, lng: newLng } = marker.getLngLat()
      onChangeRef.current(newLat, newLng)
    })
    markerRef.current = marker
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

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

    let cancelled = false
    const timer = setTimeout(async () => {
      setSearching(true)
      setSearchError(null)
      try {
        const data = await geocodeSearch(query.trim())
        if (!cancelled) setResults(data)
      } catch {
        if (!cancelled) {
          setSearchError('Search failed. Try again, or place the pin manually.')
          setResults([])
        }
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  function pickResult(result: GeocodeResult) {
    mapRef.current?.flyTo({ center: [result.lng, result.lat], zoom: PICKED_ZOOM, duration: 1200 })
    markerRef.current?.setLngLat([result.lng, result.lat])
    onChange(result.lat, result.lng)

    const villageName = result.village ?? result.town ?? result.city ?? result.county
    if (villageName) onSelectVillageName?.(villageName)

    setQuery('')
    setResults([])
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div className="flex h-11 items-center gap-2.5 rounded-full border border-ink/[0.06] bg-surface px-4 shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a8791" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a village or place name…"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-light"
          />
        </div>
        {(results.length > 0 || searching || searchError) && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-ink/[0.06] bg-surface shadow-lg">
            {searching && <div className="px-4 py-2.5 text-[13px] text-muted-light">Searching…</div>}
            {searchError && <div className="px-4 py-2.5 text-[13px] text-danger">{searchError}</div>}
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pickResult(r)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[14px] hover:bg-ink/5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8791" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.2" />
                </svg>
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
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
