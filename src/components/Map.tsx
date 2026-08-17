import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { layers, namedFlavor } from '@protomaps/basemaps'
import { FileSource, PMTiles, Protocol } from 'pmtiles'
import 'maplibre-gl/dist/maplibre-gl.css'
import { categoryDef } from '../lib/categories'
import { INDIA_CENTER, ZOOM_INDIA, ZOOM_PRECISE, type MapStyleName } from '../lib/constants'

export type { MapStyleName }

// Same path data as lib/categoryIcons.tsx, as raw SVG markup - markers are
// built as plain DOM nodes for MapLibre, outside the React tree, so the
// React icon components can't be rendered directly here.
const CATEGORY_ICON_SVG: Record<string, string> = {
  homestay: '<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.2V19h11v-8.8"/>',
  mechanic: '<path d="M12 4l6.9 4v8L12 20l-6.9-4V8z"/><circle cx="12" cy="12" r="2.6"/>',
  fuel: '<rect x="5.5" y="4.5" width="8.5" height="15" rx="1.5"/><path d="M8 8h3.5"/><path d="M14 10.5h1.6a1.6 1.6 0 0 1 1.6 1.6v3.4a1.3 1.3 0 0 0 2.6 0V9l-1.7-2"/><path d="M4 19.5h11.5"/>',
  toilet: '<rect x="4" y="4.5" width="16" height="15" rx="3.5"/><text x="12" y="15.3" text-anchor="middle" font-size="8.5" font-weight="700" fill="#ffffff" font-family="inherit">WC</text>',
  camping: '<path d="M12 5 4.5 19h15z"/><path d="M9.5 19 12 14l2.5 5"/>',
}

export function createMarkerElement(category: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.width = '24px'
  el.style.height = '24px'
  el.style.borderRadius = '50%'
  el.style.background = categoryDef(category)?.color ?? 'var(--color-accent)'
  el.style.border = '2px solid #ffffff'
  el.style.boxShadow = '0 3px 9px rgba(30,20,45,0.30)'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.style.cursor = 'pointer'
  const inner = CATEGORY_ICON_SVG[category] ?? ''
  el.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
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
  flyTo: (lat: number, lng: number, zoom: number) => void
  setMapStyle: (style: MapStyleName) => void
}

interface MapProps {
  places?: PlaceMarker[]
  offlineMapFile?: File | null
  onSelectPlace?: (id: string) => void
  onLocateError?: () => void
}

const pmtilesProtocol = new Protocol()
maplibregl.addProtocol('pmtiles', pmtilesProtocol.tile)

function offlineStyle(file: File): maplibregl.StyleSpecification {
  const archive = new PMTiles(new FileSource(file))
  pmtilesProtocol.add(archive)
  return {
    version: 8,
    sources: {
      protomaps: {
        type: 'vector',
        url: `pmtiles://${file.name}`,
        attribution: 'Protomaps © OpenStreetMap contributors',
      },
    },
    // Labels require separate glyph/font downloads. The offline pack keeps
    // the terrain, roads, water, and Lamyig's own labelled place pins fully
    // local instead of pretending remote labels are available without signal.
    layers: layers('protomaps', namedFlavor('light')),
  }
}

const Map = forwardRef<MapHandle, MapProps>(function Map({ places = [], offlineMapFile, onSelectPlace, onLocateError }, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const geolocateRef = useRef<maplibregl.GeolocateControl | null>(null)
  const onLocateErrorRef = useRef(onLocateError)
  const initialOfflineFileRef = useRef(offlineMapFile)
  onLocateErrorRef.current = onLocateError

  useImperativeHandle(ref, () => ({
    // Not geolocateRef.current?.trigger() - the control's own camera move
    // (fitBounds on the accuracy circle, capped at zoom 15) depends on GPS
    // accuracy and whatever zoom the map already was at, so it doesn't
    // reliably "zoom in and center on me" the way a normal map app does.
    // Getting the position directly and flying to a fixed zoom ourselves
    // does that reliably, every time.
    locate: () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: ZOOM_PRECISE, duration: 1500 }),
        () => onLocateErrorRef.current?.(),
        { enableHighAccuracy: true },
      )
    },
    flyTo: (lat, lng, zoom) => mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1500 }),
    // Markers/controls aren't part of the style, so they survive a
    // setStyle() call - MapLibre re-attaches them once the new style loads.
    setMapStyle: (style) => mapRef.current?.setStyle(`https://tiles.openfreemap.org/styles/${style}`),
  }), [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: initialOfflineFileRef.current ? offlineStyle(initialOfflineFileRef.current) : 'https://tiles.openfreemap.org/styles/liberty',
      center: [INDIA_CENTER.lng, INDIA_CENTER.lat],
      zoom: ZOOM_INDIA,
      attributionControl: false,
    })

    // Compact (collapsed to an "i" icon, expands on tap) so the required
    // attribution doesn't collide with our floating category-filter panel,
    // which sits low enough on narrow phone screens to overlap it otherwise.
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

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

  useEffect(() => {
    if (offlineMapFile && mapRef.current) mapRef.current.setStyle(offlineStyle(offlineMapFile))
  }, [offlineMapFile])

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
      popupNode.style.minWidth = '160px'
      popupNode.innerHTML = `
        <div style="font-weight:600;font-size:14px;color:var(--color-ink)">${escapeHtml(place.name)}</div>
        <div style="font-size:12.5px;color:var(--color-muted);margin-bottom:8px">${escapeHtml(place.category)}</div>
      `
      const detailsButton = document.createElement('button')
      detailsButton.textContent = 'More details'
      detailsButton.style.cssText = 'background:var(--color-accent-light);color:var(--color-accent-text);font-size:12.5px;font-weight:600;border:none;border-radius:999px;padding:6px 12px;cursor:pointer'
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
