import type { OfflinePhoto, OfflineRegionPack } from './offlinePack'
import type { CommunityNote, Place } from './types'

export interface MergedOfflineContent {
  places: Place[]
  photos: OfflinePhoto[]
  notes: CommunityNote[]
}

// Regional extracts intentionally overlap. Identity comes only from the
// database IDs: coordinates or similar names are never enough evidence to
// merge two community records. For the same place ID, keep the newest whole
// record so an older pack cannot restore a field that was deliberately
// corrected or removed. Child records are independent facts, so retain the
// union of their IDs.
export function mergeOfflinePackContent(packs: OfflineRegionPack[]): MergedOfflineContent {
  const places = new Map<string, { place: Place; downloadedAt: string }>()
  const photos = new Map<string, OfflinePhoto>()
  const notes = new Map<string, CommunityNote>()

  for (const pack of packs) {
    for (const place of pack.places) {
      const current = places.get(place.id)
      const placeTime = Date.parse(place.updated_at) || 0
      const currentTime = current ? Date.parse(current.place.updated_at) || 0 : -1
      if (!current || placeTime > currentTime || (placeTime === currentTime && pack.downloadedAt > current.downloadedAt)) {
        places.set(place.id, { place, downloadedAt: pack.downloadedAt })
      }
    }
    for (const photo of pack.photos) if (!photos.has(photo.id)) photos.set(photo.id, photo)
    for (const note of pack.notes) if (!notes.has(note.id)) notes.set(note.id, note)
  }

  const retainedPlaceIds = new Set(places.keys())
  return {
    places: [...places.values()].map(({ place }) => place),
    photos: [...photos.values()].filter((photo) => retainedPlaceIds.has(photo.place_id)),
    notes: [...notes.values()].filter((note) => retainedPlaceIds.has(note.place_id)),
  }
}
