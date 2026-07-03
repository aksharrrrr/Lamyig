import Map from '../components/Map'

const CATEGORIES = [
  'Homestay', 'Mechanic', 'Fuel', 'Food', 'Drinking water',
  'Toilet', 'Medical', 'Camping', 'Mobile network', 'Viewpoint',
]

const POPULAR_DESTINATIONS = ['Spiti', 'Ladakh', 'Zanskar', 'Sikkim', 'Treks']

export default function Home() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 p-3 dark:border-neutral-800">
        <input
          type="search"
          placeholder="Search a region, village, or place…"
          className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <div className="flex gap-2 overflow-x-auto">
          {POPULAR_DESTINATIONS.map((d) => (
            <button
              key={d}
              className="shrink-0 rounded-full border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700"
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <Map />
      </div>

      <div className="flex gap-2 overflow-x-auto border-t border-neutral-200 p-3 dark:border-neutral-800">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-sm dark:bg-neutral-800"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}
