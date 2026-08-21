import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { layers, namedFlavor, type Flavor } from '@protomaps/basemaps'
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
  region_id?: string | null
  village_id?: string | null
  photoUrl?: string
}

export interface MapHandle {
  locate: () => void
  flyTo: (lat: number, lng: number, zoom: number) => void
  setMapStyle: (style: MapStyleName) => void
}

interface MapProps {
  places?: PlaceMarker[]
  offlineMapFile?: File | null
  mapStyle?: MapStyleName
  onSelectPlace?: (id: string) => void
  onLocateError?: () => void
}

const pmtilesProtocol = new Protocol()
maplibregl.addProtocol('pmtiles', pmtilesProtocol.tile)

const ONLINE_BASEMAP_SOURCE = 'openmaptiles'
const DETAIL_LAYER_IDS = {
  remoteRoads: 'lamyig-remote-roads',
  vehicleTracks: 'lamyig-vehicle-tracks',
  walkingPaths: 'lamyig-walking-paths',
  settlements: 'lamyig-remote-settlements',
  peaks: 'lamyig-mountain-peaks',
} as const

const onlineName: maplibregl.ExpressionSpecification = [
  'coalesce',
  ['get', 'name:en'],
  ['get', 'name_en'],
  ['get', 'name:latin'],
  ['get', 'name'],
]

/**
 * OpenFreeMap's styles intentionally stay general-purpose: remote tracks
 * appear very late, small-place labels use generous collision padding, and
 * the mountain_peak source is not rendered. Reveal that data without adding
 * another provider or fetching a separate layer. Every operation is guarded
 * because OpenFreeMap's individual styles do not share every stock layer id.
 */
function addOnlineRemoteDetail(map: maplibregl.Map) {
  if (!map.getSource(ONLINE_BASEMAP_SOURCE)) return

  const firstSymbol = map.getStyle().layers.find((layer) => layer.type === 'symbol')?.id
  const addLine = (layer: maplibregl.LineLayerSpecification) => {
    if (!map.getLayer(layer.id)) map.addLayer(layer, firstSymbol)
  }

  addLine({
    id: DETAIL_LAYER_IDS.remoteRoads,
    type: 'line',
    source: ONLINE_BASEMAP_SOURCE,
    'source-layer': 'transportation',
    minzoom: 10,
    filter: ['match', ['get', 'class'], ['minor', 'service'], true, false],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#c4ad92',
      'line-opacity': 0.78,
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.35, 12, 0.8, 15, 1.6],
    },
  })
  addLine({
    id: DETAIL_LAYER_IDS.vehicleTracks,
    type: 'line',
    source: ONLINE_BASEMAP_SOURCE,
    'source-layer': 'transportation',
    minzoom: 10.5,
    filter: ['==', ['get', 'class'], 'track'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#98785f',
      'line-dasharray': [2.5, 1.5],
      'line-opacity': 0.82,
      'line-width': ['interpolate', ['linear'], ['zoom'], 10.5, 0.55, 13, 1, 16, 1.8],
    },
  })
  addLine({
    id: DETAIL_LAYER_IDS.walkingPaths,
    type: 'line',
    source: ONLINE_BASEMAP_SOURCE,
    'source-layer': 'transportation',
    minzoom: 11.5,
    filter: ['match', ['get', 'class'], ['path', 'pedestrian'], true, false],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#b35f4b',
      'line-dasharray': [1.2, 1.4],
      'line-opacity': 0.8,
      'line-width': ['interpolate', ['linear'], ['zoom'], 11.5, 0.5, 14, 0.9, 17, 1.6],
    },
  })

  // Reduce the stock styles' large collision boxes. We still let MapLibre
  // resolve actual overlaps, so a dense valley remains readable instead of
  // turning into a wall of text.
  for (const id of ['label_other', 'place_other']) {
    if (!map.getLayer(id)) continue
    map.setLayoutProperty(id, 'text-padding', 1)
    map.setLayoutProperty(id, 'text-transform', 'none')
  }
  for (const id of ['label_village', 'place_village']) {
    if (!map.getLayer(id)) continue
    map.setLayoutProperty(id, 'icon-optional', true)
    map.setLayoutProperty(id, 'text-padding', 1)
  }

  // Named rivers, streams, and lakes are orientation landmarks in remote
  // valleys. Most styles already contain the labels, but conservative zoom
  // thresholds and padding make them disappear at a region's opening zoom.
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'symbol' || !['waterway', 'water_name'].includes(layer['source-layer'] ?? '')) continue
    map.setLayoutProperty(layer.id, 'text-padding', 1)
    if (layer.minzoom != null && layer.minzoom > 9) {
      map.setLayerZoomRange(layer.id, 9, layer.maxzoom ?? 24)
    }
  }

  if (!map.getLayer(DETAIL_LAYER_IDS.settlements)) {
    map.addLayer({
      id: DETAIL_LAYER_IDS.settlements,
      type: 'symbol',
      source: ONLINE_BASEMAP_SOURCE,
      'source-layer': 'place',
      minzoom: 9.5,
      filter: ['match', ['get', 'class'], ['village', 'hamlet', 'isolated_dwelling', 'locality'], true, false],
      layout: {
        'text-field': onlineName,
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 9.5, 10, 13, 11.5, 16, 13],
        'text-max-width': 8,
        'text-padding': 1,
        'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
        'text-radial-offset': 0.35,
        'symbol-sort-key': ['match', ['get', 'class'], 'village', 0, 'hamlet', 1, 2],
      },
      paint: {
        'text-color': '#403a35',
        'text-halo-color': 'rgba(250,248,244,0.92)',
        'text-halo-width': 1.4,
      },
    })
  }

  if (!map.getLayer(DETAIL_LAYER_IDS.peaks)) {
    map.addLayer({
      id: DETAIL_LAYER_IDS.peaks,
      type: 'symbol',
      source: ONLINE_BASEMAP_SOURCE,
      'source-layer': 'mountain_peak',
      minzoom: 9,
      filter: ['match', ['get', 'class'], ['peak', 'volcano', 'saddle'], true, false],
      layout: {
        'text-field': [
          'case',
          ['has', 'ele'],
          ['concat', '▲ ', onlineName, '\n', ['to-string', ['get', 'ele']], ' m'],
          ['concat', '▲ ', onlineName],
        ],
        'text-font': ['Noto Sans Medium'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 9, 10, 13, 11.5],
        'text-max-width': 9,
        'text-padding': 3,
        'symbol-sort-key': ['coalesce', ['get', 'rank'], 99],
      },
      paint: {
        'text-color': '#51443d',
        'text-halo-color': 'rgba(250,248,244,0.94)',
        'text-halo-width': 1.5,
      },
    })
  }
}

function offlineStyle(file: File): maplibregl.StyleSpecification {
  const archive = new PMTiles(new FileSource(file))
  pmtilesProtocol.add(archive)
  const flavor: Flavor = {
    ...namedFlavor('light'),
    // The stock light flavor deliberately makes roads very quiet. Lamyig is
    // a road-book, so give the hierarchy enough contrast to remain legible
    // against Himalayan terrain without competing with community pins.
    other: '#ded8cf',
    minor_service: '#e7e1d8',
    minor_a: '#ded7cc',
    minor_b: '#f8f5ef',
    link: '#f2eadf',
    major: '#ead6bd',
    highway: '#d8b48b',
    minor_casing: '#cfc7bc',
    major_casing_early: '#c8b49e',
    major_casing_late: '#c8b49e',
    highway_casing_early: '#b99b7d',
    highway_casing_late: '#b99b7d',
    roads_label_minor: '#6f6965',
    roads_label_major: '#554d47',
  }
  const baseLayers = layers('protomaps', flavor, { lang: 'en' })
    // These layers require sprite icons. Road names, settlements, rivers,
    // and our restrained POI treatment below remain fully local without a
    // second binary sprite dependency.
    .filter((layer) => !['roads_oneway', 'roads_shields', 'pois'].includes(layer.id))
    .map((layer): maplibregl.LayerSpecification => {
      if (layer.type !== 'symbol' || !layer.layout || !('icon-image' in layer.layout)) return layer
      const { 'icon-image': _iconImage, ...textOnlyLayout } = layer.layout
      return { ...layer, layout: textOnlyLayout }
    })
    .map((layer) => {
      if (layer.id === 'places_locality' && layer.type === 'symbol') {
        return {
          ...layer,
          layout: {
            ...layer.layout,
            'text-padding': ['interpolate', ['linear'], ['zoom'], 5, 2, 9, 2, 12, 3, 15, 5] as maplibregl.ExpressionSpecification,
          },
        }
      }
      if (layer.type === 'symbol' && layer['source-layer'] === 'water') {
        return {
          ...layer,
          minzoom: layer.id === 'water_waterway_label' ? 9 : layer.minzoom,
          layout: { ...layer.layout, 'text-padding': 1 },
        }
      }
      if (layer.id === 'roads_other' && layer.type === 'line') {
        return {
          ...layer,
          minzoom: 11,
          paint: {
            ...layer.paint,
            'line-color': '#a98770',
            'line-dasharray': [1.2, 1.4],
            'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.45, 14, 0.9, 18, 2] as maplibregl.ExpressionSpecification,
          },
        }
      }
      if (layer.id === 'roads_labels_minor' && layer.type === 'symbol') return { ...layer, minzoom: 12.5 }
      return layer
    })
  const usefulPoiKinds = [
    'aerodrome', 'station', 'bus_stop', 'ferry_terminal',
    'toilets', 'drinking_water', 'water_point', 'emergency_phone',
    'restaurant', 'fast_food', 'cafe', 'supermarket', 'convenience',
    'hospital', 'clinic', 'pharmacy', 'fuel',
    'alpine_hut', 'wilderness_hut', 'shelter', 'camp_site',
    'viewpoint', 'waterfall', 'mountain_pass', 'picnic_site', 'ranger_station',
  ]
  return {
    version: 8,
    sources: {
      protomaps: {
        type: 'vector',
        url: `pmtiles://${file.name}`,
        attribution: 'Protomaps © OpenStreetMap contributors',
      },
    },
    glyphs: '/map-fonts/{fontstack}/{range}.pbf',
    layers: [
      ...baseLayers,
      {
        id: 'osm-useful-pois',
        type: 'circle',
        source: 'protomaps',
        'source-layer': 'pois',
        minzoom: 13,
        filter: ['in', ['get', 'kind'], ['literal', usefulPoiKinds]],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 2, 17, 3.5],
          'circle-color': '#82766c',
          'circle-stroke-color': '#f8f5ef',
          'circle-stroke-width': 1,
          'circle-opacity': 0.72,
        },
      },
      {
        id: 'osm-useful-poi-labels',
        type: 'symbol',
        source: 'protomaps',
        'source-layer': 'pois',
        minzoom: 14,
        filter: ['in', ['get', 'kind'], ['literal', usefulPoiKinds]],
        layout: {
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': 10.5,
          'text-offset': [0, 0.85],
          'text-anchor': 'top',
          'text-max-width': 8,
        },
        paint: {
          'text-color': '#706861',
          'text-halo-color': '#f8f5ef',
          'text-halo-width': 1.25,
        },
      },
      {
        id: 'osm-mountain-peak-labels',
        type: 'symbol',
        source: 'protomaps',
        'source-layer': 'pois',
        minzoom: 9,
        filter: ['==', ['get', 'kind'], 'peak'],
        layout: {
          'text-field': [
            'case',
            ['has', 'ele'],
            ['concat', '▲ ', ['coalesce', ['get', 'name:en'], ['get', 'name']], '\n', ['to-string', ['get', 'ele']], ' m'],
            ['concat', '▲ ', ['coalesce', ['get', 'name:en'], ['get', 'name']]],
          ],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 9, 10, 13, 11.5],
          'text-max-width': 9,
          'text-padding': 3,
          'symbol-sort-key': ['coalesce', ['get', 'min_zoom'], 99],
        },
        paint: {
          'text-color': '#51443d',
          'text-halo-color': '#f8f5ef',
          'text-halo-width': 1.5,
        },
      },
    ],
  }
}

const Map = forwardRef<MapHandle, MapProps>(function Map({ places = [], offlineMapFile, mapStyle = 'bright', onSelectPlace, onLocateError }, ref) {
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
      style: initialOfflineFileRef.current ? offlineStyle(initialOfflineFileRef.current) : 'https://tiles.openfreemap.org/styles/bright',
      center: [INDIA_CENTER.lng, INDIA_CENTER.lat],
      zoom: ZOOM_INDIA,
      attributionControl: false,
    })

    // Compact (collapsed to an "i" icon, expands on tap) so the required
    // attribution doesn't collide with our floating category-filter panel,
    // which sits low enough on narrow phone screens to overlap it otherwise.
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.on('style.load', () => addOnlineRemoteDetail(map))

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
    const map = mapRef.current
    if (!map) return
    map.setStyle(offlineMapFile ? offlineStyle(offlineMapFile) : `https://tiles.openfreemap.org/styles/${mapStyle}`)
  }, [offlineMapFile, mapStyle])

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

    const hoverTimers = new Set<number>()
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const schedule = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        hoverTimers.delete(timer)
        callback()
      }, delay)
      hoverTimers.add(timer)
      return timer
    }

    markersRef.current = validPlaces.map((place) => {
      const popupNode = document.createElement('div')
      popupNode.style.cssText = `min-width:${place.photoUrl ? '250px' : '160px'};display:flex;gap:12px;align-items:stretch`
      if (place.photoUrl) {
        const photo = document.createElement('img')
        photo.src = place.photoUrl
        photo.alt = ''
        photo.loading = 'lazy'
        photo.style.cssText = 'width:92px;height:92px;flex:0 0 92px;object-fit:cover;border-radius:8px'
        popupNode.appendChild(photo)
      }
      const summary = document.createElement('div')
      summary.style.cssText = 'min-width:0;display:flex;flex-direction:column;justify-content:center'
      summary.innerHTML = `
        <div style="font-weight:600;font-size:14px;color:var(--color-ink)">${escapeHtml(place.name)}</div>
        <div style="font-size:12.5px;color:var(--color-muted);margin-bottom:6px;text-transform:capitalize">${escapeHtml(place.category)}</div>
      `
      const detailsButton = document.createElement('button')
      detailsButton.textContent = 'More details'
      detailsButton.style.cssText = 'align-self:flex-start;background:transparent;color:var(--color-accent-text);font-size:12.5px;font-weight:600;border:0;padding:3px 0;cursor:pointer'
      detailsButton.onclick = () => onSelectPlace?.(place.id)
      summary.appendChild(detailsButton)
      popupNode.appendChild(summary)

      const markerElement = createMarkerElement(place.category)
      markerElement.setAttribute('role', 'button')
      markerElement.setAttribute('tabindex', '0')
      markerElement.setAttribute('aria-label', `Open ${place.name}`)
      markerElement.title = `Open ${place.name}`
      const openDetails = () => onSelectPlace?.(place.id)
      // setPopup installs its own click-to-toggle behavior. Capture the click
      // first so a deliberate pin click goes straight to the full place page;
      // the compact popup remains a hover preview on pointer devices.
      markerElement.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopImmediatePropagation()
        openDetails()
      }, true)
      markerElement.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        openDetails()
      })
      const popup = new maplibregl.Popup({ offset: 24 }).setDOMContent(popupNode)
      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([place.lng, place.lat])
        .setPopup(popup)
        .addTo(map)

      if (supportsHover) {
        let openTimer: number | undefined
        let closeTimer: number | undefined
        const cancel = (timer: number | undefined) => {
          if (timer === undefined) return
          window.clearTimeout(timer)
          hoverTimers.delete(timer)
        }
        const openSoon = () => {
          cancel(closeTimer)
          openTimer = schedule(() => { if (!popup.isOpen()) marker.togglePopup() }, 160)
        }
        const closeSoon = () => {
          cancel(openTimer)
          closeTimer = schedule(() => { if (popup.isOpen()) popup.remove() }, 220)
        }
        markerElement.addEventListener('mouseenter', openSoon)
        markerElement.addEventListener('mouseleave', closeSoon)
        popupNode.addEventListener('mouseenter', () => cancel(closeTimer))
        popupNode.addEventListener('mouseleave', closeSoon)
      }
      return marker
    })

    return () => {
      hoverTimers.forEach((timer) => window.clearTimeout(timer))
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
