export const CURRENT_OFFLINE_PACK_VERSION = 2

export const OFFLINE_REGION_CONFIG = {
  // mapVersion is independent from the database revision. Increment it and
  // update mapBytes whenever a PMTiles artifact is replaced so devices that
  // already downloaded the region receive the normal update prompt.
  spiti: { name: 'Spiti', mapUrl: '/offline/spiti.pmtiles', mapBytes: 15_380_620, mapVersion: 1, bounds: { west: 77.3, south: 31.55, east: 78.75, north: 33.2 } },
  ladakh: { name: 'Ladakh', mapUrl: '/offline/ladakh.pmtiles', mapBytes: 35_947_110, mapVersion: 1, bounds: { west: 75.6, south: 32.2, east: 80, north: 35.8 } },
  zanskar: { name: 'Zanskar', mapUrl: '/offline/zanskar.pmtiles', mapBytes: 6_579_260, mapVersion: 1, bounds: { west: 76.2, south: 32.6, east: 77.8, north: 34.2 } },
} as const

export type OfflineRegionSlug = keyof typeof OFFLINE_REGION_CONFIG
export const DEFAULT_OFFLINE_REGION: OfflineRegionSlug = 'spiti'
export const OPEN_OFFLINE_REGION_EVENT = 'lamyig:open-offline-region'

export function isOfflineRegionSlug(value: string | undefined | null): value is OfflineRegionSlug {
  return Boolean(value && value in OFFLINE_REGION_CONFIG)
}

export function offlinePackHasLocalUpdate(pack: {
  slug: string
  packVersion?: number
  mapVersion?: number
}): boolean {
  if (pack.packVersion !== CURRENT_OFFLINE_PACK_VERSION) return true
  if (!isOfflineRegionSlug(pack.slug)) return true
  return pack.mapVersion !== OFFLINE_REGION_CONFIG[pack.slug].mapVersion
}
