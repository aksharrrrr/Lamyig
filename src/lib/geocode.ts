// Geocoding for both the home search bar and the Add Place location picker.
// LocationIQ is the primary source when a token is configured (free tier:
// 5k req/day, 2 req/sec) - it serves the same OSM data as Nominatim, but its
// ToS explicitly permits autocomplete/live-search use, unlike Nominatim's
// public instance, whose usage policy explicitly forbids exactly that ("will
// get you banned"). Falls back to Photon then Nominatim if no token is set
// (e.g. a contributor running locally without one) or if LocationIQ errors.

export interface GeocodeResult {
  name: string
  lat: number
  lng: number
  /** Best-effort settlement name from address components - only LocationIQ populates this today. */
  village?: string
  town?: string
  city?: string
  county?: string
}

const LOCATIONIQ_TOKEN = import.meta.env.VITE_LOCATIONIQ_TOKEN as string | undefined

interface LocationIQResult {
  display_name: string
  lat: string
  lon: string
  address?: { village?: string; town?: string; city?: string; county?: string }
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

async function queryLocationIQ(query: string): Promise<GeocodeResult[]> {
  const url = new URL('https://api.locationiq.com/v1/autocomplete')
  url.searchParams.set('key', LOCATIONIQ_TOKEN!)
  url.searchParams.set('q', query)
  url.searchParams.set('countrycodes', 'in')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '5')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`LocationIQ returned ${res.status}`)
  const data: LocationIQResult[] = await res.json()
  return data.map((r) => ({
    name: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
    village: r.address?.village,
    town: r.address?.town,
    city: r.address?.city,
    county: r.address?.county,
  }))
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
  // This fallback path is only single, occasional requests (not
  // autocomplete-on-every-keystroke, since LocationIQ handles that when a
  // token is present), which is within Nominatim's usage policy.
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Nominatim returned ${res.status}`)
  const data: NominatimResult[] = await res.json()
  return data.map((r) => ({ name: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }))
}

export async function geocodeSearch(query: string): Promise<GeocodeResult[]> {
  if (LOCATIONIQ_TOKEN) {
    try {
      const results = await queryLocationIQ(query)
      if (results.length > 0) return results
    } catch {
      // fall through to the free OSM chain below
    }
  }
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
