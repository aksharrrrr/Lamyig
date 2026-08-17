import { supabase } from './supabase'
import type { CommunityNote, Place, PlacePhoto, Region } from './types'

const DB_NAME = 'lamyig-offline'
const DB_VERSION = 1
const STORE_NAME = 'region-packs'

export const OFFLINE_REGION_CONFIG = {
  spiti: { name: 'Spiti', mapUrl: '/offline/spiti.pmtiles', mapBytes: 15_380_620, bounds: { west: 77.3, south: 31.55, east: 78.75, north: 33.2 } },
  ladakh: { name: 'Ladakh', mapUrl: '/offline/ladakh.pmtiles', mapBytes: 35_947_110, bounds: { west: 75.6, south: 32.2, east: 80, north: 35.8 } },
  zanskar: { name: 'Zanskar', mapUrl: '/offline/zanskar.pmtiles', mapBytes: 6_579_260, bounds: { west: 76.2, south: 32.6, east: 77.8, north: 34.2 } },
} as const
export type OfflineRegionSlug = keyof typeof OFFLINE_REGION_CONFIG
export const DEFAULT_OFFLINE_REGION: OfflineRegionSlug = 'spiti'

export function isOfflineRegionSlug(value: string | undefined | null): value is OfflineRegionSlug {
  return Boolean(value && value in OFFLINE_REGION_CONFIG)
}

export interface OfflinePhoto extends PlacePhoto {
  blob: Blob
}

export interface OfflineRegionPack {
  slug: string
  revision?: number
  downloadedAt: string
  region: Region
  mapFile: File
  places: Place[]
  photos: OfflinePhoto[]
  notes: CommunityNote[]
}

export interface OfflinePackStatus {
  pack: OfflineRegionPack
  updateAvailable: boolean
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: 'slug' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getOfflinePack(slug: string = DEFAULT_OFFLINE_REGION): Promise<OfflineRegionPack | null> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(slug)
    request.onsuccess = () => resolve((request.result as OfflineRegionPack | undefined) ?? null)
    request.onerror = () => reject(request.error)
    if (request.transaction) request.transaction.oncomplete = () => db.close()
  })
}

export async function getOfflinePacks(): Promise<OfflineRegionPack[]> {
  const packs = await Promise.all(Object.keys(OFFLINE_REGION_CONFIG).map((slug) => getOfflinePack(slug)))
  return packs.filter((pack): pack is OfflineRegionPack => Boolean(pack))
}

export async function getOfflinePackStatuses(): Promise<OfflinePackStatus[]> {
  const packs = await getOfflinePacks()
  if (packs.length === 0) return []
  if (!supabase || !navigator.onLine) return packs.map((pack) => ({ pack, updateAvailable: false }))

  const { data, error } = await supabase
    .from('regions')
    .select('slug, offline_revision')
    .in('slug', packs.map((pack) => pack.slug))
  if (error || !data) return packs.map((pack) => ({ pack, updateAvailable: false }))

  const revisions = new Map(data.map((region) => [region.slug, Number(region.offline_revision)]))
  return packs.map((pack) => ({
    pack,
    // Packs downloaded before revision tracking deliberately get one update
    // prompt so their future freshness can be compared authoritatively.
    updateAvailable: revisions.has(pack.slug) && pack.revision !== revisions.get(pack.slug),
  }))
}

export async function offlinePackNeedsUpdate(pack: OfflineRegionPack): Promise<boolean> {
  if (!supabase || !navigator.onLine) return false
  const { data, error } = await supabase
    .from('regions')
    .select('offline_revision')
    .eq('slug', pack.slug)
    .maybeSingle()
  if (error || !data) return false
  return pack.revision !== Number(data.offline_revision)
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

export async function removeOfflinePack(slug: string = DEFAULT_OFFLINE_REGION): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(slug)
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onerror = () => { db.close(); reject(transaction.error) }
  })
}

export async function downloadOfflinePack(slug: OfflineRegionSlug, onProgress: (message: string) => void): Promise<OfflineRegionPack> {
  const config = OFFLINE_REGION_CONFIG[slug]
  if (!supabase) throw new Error('Lamyig is not connected to its data service.')
  if (!navigator.onLine) throw new Error(`Connect to the internet to download or update ${config.name}.`)

  onProgress('Checking there is room…')
  const estimate = await navigator.storage?.estimate()
  const available = estimate?.quota != null && estimate?.usage != null ? estimate.quota - estimate.usage : null
  if (available != null && available < config.mapBytes * 2) throw new Error(`Not enough browser storage is available for the ${config.name} pack.`)

  const { data: regionData, error: regionError } = await supabase.from('regions').select('*').eq('slug', slug).single()
  if (regionError) throw regionError
  const region = regionData as Region

  onProgress(`Gathering the latest places in ${config.name}…`)
  const { data: placeData, error: placeError } = await supabase
    .from('places')
    .select('*')
    .or(`region_id.eq.${region.id},and(region_id.is.null,lat.gte.${config.bounds.south},lat.lte.${config.bounds.north},lng.gte.${config.bounds.west},lng.lte.${config.bounds.east})`)
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
    onProgress(`Packing photo ${index + 1} of ${photoRows.length}…`)
    const url = supabase.storage.from('place-photos').getPublicUrl(photo.storage_path).data.publicUrl
    const response = await fetch(url)
    if (!response.ok) throw new Error(`A place photo could not be downloaded (${response.status}).`)
    photos.push({ ...photo, blob: await response.blob() })
  }

  onProgress(`Bringing the ${config.name} road map (${Math.ceil(config.mapBytes / 1_000_000)} MB)…`)
  const mapResponse = await fetch(config.mapUrl)
  if (!mapResponse.ok) throw new Error(`The ${config.name} map could not be downloaded (${mapResponse.status}).`)
  const mapFile = new File([await mapResponse.blob()], `${slug}.pmtiles`, { type: 'application/octet-stream' })

  onProgress(`Saving ${config.name} for the road…`)
  const pack: OfflineRegionPack = {
    slug,
    revision: Number(region.offline_revision ?? 0),
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
