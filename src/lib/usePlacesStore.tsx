import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import type { PlaceMarker } from '../components/Map'

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

  const refetch = useCallback(() => {
    if (!supabase) return
    supabase.from('places').select('id, name, category, lat, lng').then(({ data }) => {
      if (data) setPlaces(data as PlaceMarker[])
    })
  }, [])

  useEffect(() => { refetch() }, [refetch])

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
