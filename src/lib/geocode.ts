// Free, zero-infra geocoding fallback for places outside our own curated
// regions/villages — Photon first (faster, autocomplete-friendly), falls
// back to Nominatim if Photon errors or returns nothing. Both are free
// public OSM-based services (D-006 territory: use the OSM ecosystem,
// never build/host this ourselves) — see docs/15-free-tier-limits.md for
// the usage-policy constraints on both before changing how often this
// gets called.

export interface GeocodeResult {
  name: string
  lat: number
  lng: number
}

interface PhotonFeature {
  properties: { name?: string; state?: string; country?: string }
  geometry: { coordinates: [number, number] }
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
}

async function queryPhoton(query: string): Promise<GeocodeResult[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en&lat=22.97&lon=78.65&zoom=5`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Photon returned ${res.status}`)
  const data: { features?: PhotonFeature[] } = await res.json()
  return (data.features ?? []).map((f) => ({
    name: [f.properties.name, f.properties.state, f.properties.country].filter(Boolean).join(', '),
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }))
}

async function queryNominatim(query: string): Promise<GeocodeResult[]> {
  // countrycodes=in keeps results relevant to what Lamyig actually covers.
  // Browsers won't let JS set a custom User-Agent header (Nominatim's usage
  // policy asks for one) - the HTTP Referer, which browsers send
  // automatically, is their documented fallback identification method for
  // client-side web apps, so this is within policy without extra work.
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Nominatim returned ${res.status}`)
  const data: NominatimResult[] = await res.json()
  return data.map((r) => ({ name: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }))
}

export async function geocodeSearch(query: string): Promise<GeocodeResult[]> {
  try {
    const results = await queryPhoton(query)
    if (results.length > 0) return results
  } catch {
    // fall through to Nominatim
  }
  try {
    return await queryNominatim(query)
  } catch {
    return []
  }
}
