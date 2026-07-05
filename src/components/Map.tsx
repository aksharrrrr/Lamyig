import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const INDIA_CENTER: [number, number] = [78.6569, 22.9734]
const INDIA_ZOOM = 4.2

// Same path data as lib/categoryIcons.tsx, as raw SVG markup — markers are
// built as plain DOM nodes for MapLibre, outside the React tree, so the
// React icon components can't be rendered directly here.
const CATEGORY_ICON_SVG: Record<string, string> = {
  homestay: '<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.2V19h11v-8.8"/>',
  mechanic: '<path d="M12 4l6.9 4v8L12 20l-6.9-4V8z"/><circle cx="12" cy="12" r="2.6"/>',
  fuel: '<rect x="5.5" y="4.5" width="8.5" height="15" rx="1.5"/><path d="M8 8h3.5"/><path d="M14 10.5h1.6a1.6 1.6 0 0 1 1.6 1.6v3.4a1.3 1.3 0 0 0 2.6 0V9l-1.7-2"/><path d="M4 19.5h11.5"/>',
  toilet: '<rect x="4" y="4.5" width="16" height="15" rx="3.5"/><text x="12" y="15.3" text-anchor="middle" font-size="8.5" font-weight="700" fill="#ffffff" font-family="inherit">WC</text>',
  camping: '<path d="M12 5 4.5 19h15z"/><path d="M9.5 19 12 14l2.5 5"/>',
}

function createMarkerElement(category: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.width = '32px'
  el.style.height = '32px'
  el.style.borderRadius = '50%'
  el.style.background = 'var(--color-accent)'
  el.style.border = '2.5px solid #ffffff'
  el.style.boxShadow = '0 4px 12px rgba(30,20,45,0.30)'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.style.cursor = 'pointer'
  const inner = CATEGORY_ICON_SVG[category] ?? ''
  el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
  return el
}

export interface PlaceMarker {
  id: string
  name: string
  category: string
  lat: number
  lng: number
}

export interface MapHandle {
  locate: () => void
}

interface MapProps {
  places?: PlaceMarker[]
  onSelectPlace?: (id: string) => void
}

const Map = forwardRef<MapHandle, MapProps>(function Map({ places = [], onSelectPlace }, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const geolocateRef = useRef<maplibregl.GeolocateControl | null>(null)

  useImperativeHandle(ref, () => ({
    locate: () => geolocateRef.current?.trigger(),
  }), [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: INDIA_CENTER,
      zoom: INDIA_ZOOM,
    })

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showUserLocation: true,
    })
    map.addControl(geolocate, 'top-right')
    geolocateRef.current = geolocate
    map.on('load', () => geolocate.trigger())

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      geolocateRef.current = null
    }
  }, [])

  // Map-pin tap -> essential info popup -> "More Details" (docs/08-mvp.md
  // screen 4). The popup is a plain DOM node since MapLibre popups live
  // outside the React tree.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())

    // One out-of-range row (e.g. a typo'd latitude) shouldn't take down every
    // pin - maplibre throws on an invalid LngLat, and .map() has no
    // per-item try/catch, so one bad row would abort the whole batch.
    const validPlaces = places.filter((p) => {
      const valid = p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180
      if (!valid) console.warn(`Skipping place "${p.name}" (${p.id}): invalid coordinates`, p.lat, p.lng)
      return valid
    })

    markersRef.current = validPlaces.map((place) => {
      const popupNode = document.createElement('div')
      popupNode.className = 'text-sm'
      popupNode.innerHTML = `
        <div class="font-medium">${escapeHtml(place.name)}</div>
        <div class="text-muted mb-2">${escapeHtml(place.category)}</div>
      `
      const detailsButton = document.createElement('button')
      detailsButton.textContent = 'More details'
      detailsButton.className = 'text-accent underline text-sm'
      detailsButton.onclick = () => onSelectPlace?.(place.id)
      popupNode.appendChild(detailsButton)

      const marker = new maplibregl.Marker({ element: createMarkerElement(place.category) })
        .setLngLat([place.lng, place.lat])
        .setPopup(new maplibregl.Popup({ offset: 24 }).setDOMContent(popupNode))
        .addTo(map)
      return marker
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
    }
  }, [places, onSelectPlace])

  return <div ref={containerRef} className="h-full w-full" />
})

export default Map

function escapeHtml(value: string): string {
  const div = document.createElement('div')
  div.textContent = value
  return div.innerHTML
}
