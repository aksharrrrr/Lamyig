import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import type { PlaceMarker } from '../components/Map'

interface PlacesContextValue {
  places: PlaceMarker[]
  refetch: () => void
}

const PlacesContext = createContext<PlacesContextValue | null>(null)

// Home (persistent map) and AddEditPlace (rendered as an overlay on top of
// it) need to share this list — a successful add has to refresh the pins
// without Home ever remounting, since the overlay pattern keeps it mounted
// underneath the whole time.
export function PlacesProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<PlaceMarker[]>([])

  const refetch = useCallback(() => {
    if (!supabase) return
    supabase.from('places').select('id, name, category, lat, lng').then(({ data }) => {
      if (data) setPlaces(data as PlaceMarker[])
    })
  }, [])

  useEffect(() => { refetch() }, [refetch])

  return <PlacesContext.Provider value={{ places, refetch }}>{children}</PlacesContext.Provider>
}

export function usePlacesStore() {
  const ctx = useContext(PlacesContext)
  if (!ctx) throw new Error('usePlacesStore must be used inside a PlacesProvider')
  return ctx
}
