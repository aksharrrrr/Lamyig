import { expect, test } from '@playwright/test'
import type { OfflineRegionPack } from '../src/lib/offlinePack'
import {
  OFFLINE_REGION_CONFIG,
  offlinePackHasLocalUpdate,
  type OfflineRegionSlug,
} from '../src/lib/offlineConfig'
import { mergeOfflinePackContent } from '../src/lib/offlineMerge'
import { matchesJourneySearch } from '../src/lib/search'
import type { Place } from '../src/lib/types'

const basePlace: Place = {
  id: 'shared-place', name: 'Old name', category: 'homestay', lat: 33.46, lng: 76.88,
  village_id: null, region_id: 'zanskar', trek_id: null, description: 'Old details',
  phone: null, whatsapp: null, price_range: null, attributes: {}, added_by: null,
  last_edited_by: null, last_verified_at: null, verified_count: 0,
  created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-10T00:00:00Z',
}

function pack(slug: OfflineRegionSlug, downloadedAt: string, places: Place[], childSuffix: string): OfflineRegionPack {
  return {
    slug, downloadedAt, places, revision: 1, packVersion: 2,
    mapVersion: OFFLINE_REGION_CONFIG[slug].mapVersion,
    villages: [], mapFile: new File([], `${slug}.pmtiles`),
    region: {
      id: slug, slug, name: slug, state: 'Ladakh', description: null, featured: true,
      center_lat: 33.4, center_lng: 76.8, default_zoom: 8,
    },
    photos: [{
      id: `photo-${childSuffix}`, place_id: 'shared-place', storage_path: `${childSuffix}.webp`,
      uploaded_by: null, created_at: downloadedAt, blob: new Blob([childSuffix]),
    }],
    notes: [{
      id: `note-${childSuffix}`, place_id: 'shared-place', author_id: childSuffix,
      body: `Note ${childSuffix}`, created_at: downloadedAt,
    }],
  }
}

test('offline packs detect app-schema and map-artifact updates independently', () => {
  const current = pack('spiti', '2026-08-21T00:00:00Z', [basePlace], 'current')

  expect(offlinePackHasLocalUpdate(current)).toBe(false)
  expect(offlinePackHasLocalUpdate({ ...current, mapVersion: undefined })).toBe(true)
  expect(offlinePackHasLocalUpdate({ ...current, mapVersion: current.mapVersion! - 1 })).toBe(true)
  expect(offlinePackHasLocalUpdate({ ...current, packVersion: current.packVersion - 1 })).toBe(true)
})

test('overlapping packs show one newest place without losing independent notes or photos', () => {
  const ladakh = pack('ladakh', '2026-08-11T00:00:00Z', [basePlace], 'ladakh')
  const corrected = { ...basePlace, name: 'Corrected name', description: '', updated_at: '2026-08-12T00:00:00Z' }
  const distinctPlace = { ...basePlace, id: 'different-id', name: 'Neighbouring homestay' }
  const zanskar = pack('zanskar', '2026-08-13T00:00:00Z', [corrected, distinctPlace], 'zanskar')

  const merged = mergeOfflinePackContent([ladakh, zanskar])
  expect(merged.places).toHaveLength(2)
  expect(merged.places.find((place) => place.id === 'shared-place')).toMatchObject({
    name: 'Corrected name',
    description: '',
  })
  expect(merged.photos.map((photo) => photo.id).sort()).toEqual(['photo-ladakh', 'photo-zanskar'])
  expect(merged.notes.map((note) => note.id).sort()).toEqual(['note-ladakh', 'note-zanskar'])

  const afterZanskarRemoval = mergeOfflinePackContent([ladakh])
  expect(afterZanskarRemoval.places).toHaveLength(1)
  expect(afterZanskarRemoval.places[0].name).toBe('Old name')
})

test('offline journey search matches downloaded context and plural village queries', () => {
  expect(matchesJourneySearch('Padum Zanskar village', 'Zanskar villages')).toBe(true)
  expect(matchesJourneySearch('Karsha Zanskar village', 'karsha')).toBe(true)
  expect(matchesJourneySearch('Mountain View Homestay Padum Zanskar place', 'zanskar homestays')).toBe(true)
  expect(matchesJourneySearch('Padum Zanskar village', 'Rajkot')).toBe(false)
})
