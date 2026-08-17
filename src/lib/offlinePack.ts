import { supabase } from './supabase'
import type { CommunityNote, Place, PlacePhoto, Region } from './types'

const DB_NAME = 'lamyig-offline'
const DB_VERSION = 1
const STORE_NAME = 'region-packs'
export const SPITI_PACK_SLUG = 'spiti'
export const SPITI_MAP_URL = '/offline/spiti.pmtiles'
export const SPITI_MAP_BYTES = 15_380_620
const SPITI_PLACE_BOUNDS = { west: 77.3, south: 31.55, east: 78.75, north: 33.2 }

export interface OfflinePhoto extends PlacePhoto {
  blob: Blob
}

export interface OfflineRegionPack {
  slug: string
  downloadedAt: string
  region: Region
  mapFile: File
  places: Place[]
  photos: OfflinePhoto[]
  notes: CommunityNote[]
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'slug' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getOfflinePack(slug = SPITI_PACK_SLUG): Promise<OfflineRegionPack | null> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(slug)
    request.onsuccess = () => resolve((request.result as OfflineRegionPack | undefined) ?? null)
    request.onerror = () => reject(request.error)
    if (request.transaction) request.transaction.oncomplete = () => db.close()
  })
}

async function saveOfflinePack(pack: OfflineRegionPack): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(pack)
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onerror = () => { db.close(); reject(transaction.error) }
  })
}

export async function removeOfflinePack(slug = SPITI_PACK_SLUG): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(slug)
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onerror = () => { db.close(); reject(transaction.error) }
  })
}

export async function downloadSpitiPack(onProgress: (message: string) => void): Promise<OfflineRegionPack> {
  if (!supabase) throw new Error('Lamyig is not connected to its data service.')
  if (!navigator.onLine) throw new Error('Connect to the internet to download or update Spiti.')

  onProgress('Checking available storage…')
  const estimate = await navigator.storage?.estimate()
  const available = estimate?.quota != null && estimate?.usage != null ? estimate.quota - estimate.usage : null
  if (available != null && available < SPITI_MAP_BYTES * 2) {
    throw new Error('Not enough browser storage is available for the Spiti pack.')
  }

  const { data: regionData, error: regionError } = await supabase
    .from('regions').select('*').eq('slug', SPITI_PACK_SLUG).single()
  if (regionError) throw regionError
  const region = regionData as Region

  onProgress('Downloading current Spiti places…')
  const { data: placeData, error: placeError } = await supabase
    .from('places')
    .select('*')
    // Region is optional in the current contribution form. Include both
    // explicitly classified rows and unclassified pins physically inside
    // Spiti, so a valid contribution is not omitted from an offline pack.
    .or(`region_id.eq.${region.id},and(region_id.is.null,lat.gte.${SPITI_PLACE_BOUNDS.south},lat.lte.${SPITI_PLACE_BOUNDS.north},lng.gte.${SPITI_PLACE_BOUNDS.west},lng.lte.${SPITI_PLACE_BOUNDS.east})`)
  if (placeError) throw placeError
  const places = (placeData ?? []) as Place[]
  const placeIds = places.map((place) => place.id)

  let photoRows: PlacePhoto[] = []
  let notes: CommunityNote[] = []
  if (placeIds.length > 0) {
    const [{ data: photoData, error: photoError }, { data: noteData, error: noteError }] = await Promise.all([
      supabase.from('place_photos').select('*').in('place_id', placeIds),
      supabase.from('community_notes').select('*').in('place_id', placeIds),
    ])
    if (photoError) throw photoError
    if (noteError) throw noteError
    photoRows = (photoData ?? []) as PlacePhoto[]
    notes = (noteData ?? []) as CommunityNote[]
  }

  const photos: OfflinePhoto[] = []
  for (const [index, photo] of photoRows.entries()) {
    onProgress(`Downloading place photo ${index + 1} of ${photoRows.length}…`)
    const url = supabase.storage.from('place-photos').getPublicUrl(photo.storage_path).data.publicUrl
    const response = await fetch(url)
    if (!response.ok) throw new Error(`A place photo could not be downloaded (${response.status}).`)
    photos.push({ ...photo, blob: await response.blob() })
  }

  onProgress('Downloading the Spiti map (15 MB)…')
  const mapResponse = await fetch(SPITI_MAP_URL)
  if (!mapResponse.ok) throw new Error(`The Spiti map could not be downloaded (${mapResponse.status}).`)
  const mapFile = new File([await mapResponse.blob()], 'spiti.pmtiles', { type: 'application/octet-stream' })

  onProgress('Saving for offline use…')
  const pack: OfflineRegionPack = {
    slug: SPITI_PACK_SLUG,
    downloadedAt: new Date().toISOString(),
    region,
    mapFile,
    places,
    photos,
    notes,
  }
  await saveOfflinePack(pack)
  await navigator.storage?.persist?.()
  window.dispatchEvent(new CustomEvent('lamyig:offline-pack-updated'))
  return pack
}

export function formatPackDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(iso))
}
