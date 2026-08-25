import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import type { PlaceMarker } from '../components/Map'
import { getOfflinePacks } from './offlinePack'
import { mergeOfflinePackContent } from './offlineMerge'
import { curatedPlacePhoto } from './curatedPlacePhotos'

interface PlacesContextValue {
  places: PlaceMarker[]
  refetch: () => void
  contributorCount: number | null
}

const PlacesContext = createContext<PlacesContextValue | null>(null)

// Home (persistent map) and AddEditPlace (rendered as an overlay on top of
// it) need to share this list - a successful add has to refresh the pins
// without Home ever remounting, since the overlay pattern keeps it mounted
// underneath the whole time.
//
// contributorCount is fetched here too (not in Vision, where it's shown) so
// it's already in memory by the time the vision popup opens instead of
// popping in after a network round trip.
export function PlacesProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<PlaceMarker[]>([])
  const [contributorCount, setContributorCount] = useState<number | null>(null)
  const photoObjectUrls = useRef<string[]>([])

  const replacePlaces = useCallback((nextPlaces: PlaceMarker[]) => {
    photoObjectUrls.current.forEach((url) => URL.revokeObjectURL(url))
    photoObjectUrls.current = nextPlaces
      .map((place) => place.photoUrl)
      .filter((url): url is string => Boolean(url?.startsWith('blob:')))
    setPlaces(nextPlaces)
  }, [])

  const loadOfflinePack = useCallback(async () => {
    const packs = await getOfflinePacks()
    if (packs.length === 0) return
    const content = mergeOfflinePackContent(packs)
    replacePlaces(content.places.map((place) => {
      const photo = content.photos.find((candidate) => candidate.place_id === place.id)
      return { ...place, photoUrl: photo ? URL.createObjectURL(photo.blob) : undefined }
    }))
  }, [replacePlaces])

  const refetch = useCallback(() => {
    const client = supabase
    if (!client) return
    if (!navigator.onLine) return void loadOfflinePack()
    client.from('places').select('id, name, category, lat, lng, region_id, village_id, place_photos(storage_path)').then(({ data, error }) => {
      if (data) {
        replacePlaces(data.map((place) => {
          const storagePath = place.place_photos?.[0]?.storage_path
          const photoUrl = storagePath
            ? client.storage.from('place-photos').getPublicUrl(storagePath).data.publicUrl
            : curatedPlacePhoto(place.id)?.url
          return { ...place, photoUrl }
        }))
      } else if (error) void loadOfflinePack()
    })
  }, [loadOfflinePack, replacePlaces])

  useEffect(() => { refetch() }, [refetch])

  useEffect(() => () => {
    photoObjectUrls.current.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  useEffect(() => {
    const refresh = () => refetch()
    window.addEventListener('online', refresh)
    window.addEventListener('offline', refresh)
    window.addEventListener('lamyig:offline-pack-updated', refresh)
    return () => {
      window.removeEventListener('online', refresh)
      window.removeEventListener('offline', refresh)
      window.removeEventListener('lamyig:offline-pack-updated', refresh)
    }
  }, [refetch])

  useEffect(() => {
    if (!supabase) return
    supabase.from('repo_stats').select('contributor_count').eq('id', true).maybeSingle().then(({ data }) => {
      if (data) setContributorCount(data.contributor_count)
    })
  }, [])

  return (
    <PlacesContext.Provider value={{ places, refetch, contributorCount }}>{children}</PlacesContext.Provider>
  )
}

export function usePlacesStore() {
  const ctx = useContext(PlacesContext)
  if (!ctx) throw new Error('usePlacesStore must be used inside a PlacesProvider')
  return ctx
}
