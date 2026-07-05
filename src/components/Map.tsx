import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const INDIA_CENTER: [number, number] = [78.6569, 22.9734]
const INDIA_ZOOM = 4.2

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

      const marker = new maplibregl.Marker()
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
