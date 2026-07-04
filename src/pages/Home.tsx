import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { type PlaceMarker } from '../components/Map'
import { supabase } from '../lib/supabase'
import { CATEGORIES } from '../lib/categories'

const POPULAR_DESTINATIONS = ['Spiti', 'Ladakh', 'Zanskar', 'Sikkim', 'Treks']

export default function Home() {
  const navigate = useNavigate()
  const [places, setPlaces] = useState<PlaceMarker[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!supabase) return
    supabase.from('places').select('id, name, category, lat, lng').then(({ data }) => {
      if (data) setPlaces(data as PlaceMarker[])
    })
  }, [])

  function toggleCategory(value: string) {
    setSelectedCategories((current) => {
      const next = new Set(current)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  // No categories selected = show everything; otherwise show only the selected ones.
  const visiblePlaces = selectedCategories.size === 0
    ? places
    : places.filter((p) => selectedCategories.has(p.category))

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 p-3">
        <input
          type="search"
          placeholder="Search a region, village, or place…"
          className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <div className="flex gap-2 overflow-x-auto">
          {POPULAR_DESTINATIONS.map((d) => (
            <button
              key={d}
              className="shrink-0 rounded-full border border-neutral-300 px-3 py-1 text-sm"
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <Map places={visiblePlaces} onSelectPlace={(id) => navigate(`/place/${id}`)} />
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-neutral-200 p-3">
        {CATEGORIES.map((c) => {
          const selected = selectedCategories.has(c.value)
          return (
            <button
              key={c.value}
              onClick={() => toggleCategory(c.value)}
              className={`shrink-0 rounded-full px-3 py-1 text-sm ${
                selected ? 'bg-neutral-900 text-white' : 'bg-neutral-100'
              }`}
            >
              {c.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
