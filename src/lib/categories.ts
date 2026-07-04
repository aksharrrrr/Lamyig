export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'multiselect'

export interface CategoryField {
  key: string
  label: string
  type: FieldType
  options?: string[]
}

export interface CategoryDef {
  value: string
  label: string
  fields: CategoryField[]
  minPhotos: number
}

// Base fields (name, description, coordinates, village/region, phone,
// whatsapp, price range) are shared by every category — see docs/08-mvp.md.
// These are the category-specific fields from that doc's field table.
//
// minPhotos: a homestay needs to show itself off; a toilet or mechanic pin is
// a quick "this exists here" note and shouldn't be gated behind 3 photos.
export const CATEGORIES: CategoryDef[] = [
  {
    value: 'homestay',
    label: 'Homestay',
    minPhotos: 3,
    fields: [
      { key: 'host_name', label: 'Host name', type: 'text' },
      { key: 'meals_included', label: 'Meals included', type: 'boolean' },
      { key: 'parking', label: 'Parking', type: 'select', options: ['none', 'bike', 'car', 'bike and car'] },
      { key: 'cash_only', label: 'Cash only', type: 'boolean' },
    ],
  },
  {
    value: 'mechanic',
    label: 'Mechanic',
    minPhotos: 0,
    fields: [
      { key: 'services', label: 'Services', type: 'multiselect', options: ['puncture repair', 'general repair', 'spare parts'] },
      { key: 'vehicle_types', label: 'Vehicle types serviced', type: 'multiselect', options: ['bike', 'car'] },
      { key: 'hours', label: 'Hours (e.g. "8am-8pm" or "24x7")', type: 'text' },
    ],
  },
  {
    value: 'fuel',
    label: 'Fuel',
    minPhotos: 0,
    fields: [
      { key: 'fuel_types', label: 'Fuel types', type: 'multiselect', options: ['petrol', 'diesel'] },
      { key: 'source', label: 'Source', type: 'select', options: ['pump', 'informal (jerry can)'] },
      { key: 'hours', label: 'Hours (e.g. "8am-8pm" or "24x7")', type: 'text' },
    ],
  },
  {
    value: 'food',
    label: 'Food',
    minPhotos: 0,
    fields: [
      { key: 'meal_times', label: 'Meal times', type: 'text' },
      { key: 'cash_only', label: 'Cash only', type: 'boolean' },
    ],
  },
  {
    value: 'drinking_water',
    label: 'Drinking water',
    minPhotos: 0,
    fields: [
      { key: 'potable', label: 'Potable', type: 'boolean' },
      { key: 'cost', label: 'Cost', type: 'select', options: ['free', 'paid'] },
    ],
  },
  {
    value: 'toilet',
    label: 'Toilet',
    minPhotos: 0,
    fields: [
      { key: 'clean', label: 'Clean', type: 'boolean' },
      { key: 'cost', label: 'Cost', type: 'select', options: ['free', 'paid'] },
      { key: 'style', label: 'Style', type: 'select', options: ['Indian', 'Western'] },
    ],
  },
  {
    value: 'medical',
    label: 'Medical',
    minPhotos: 0,
    fields: [
      { key: 'facility_type', label: 'Type', type: 'select', options: ['clinic', 'pharmacy', 'hospital'] },
      { key: 'emergency_capable', label: 'Emergency-capable', type: 'boolean' },
      { key: 'hours', label: 'Hours (e.g. "8am-8pm" or "24x7")', type: 'text' },
    ],
  },
  {
    value: 'camping',
    label: 'Camping',
    minPhotos: 0,
    fields: [
      { key: 'tent_allowed', label: 'Tent pitch allowed', type: 'boolean' },
      { key: 'nearby_toilet', label: 'Toilet nearby', type: 'boolean' },
      { key: 'nearby_water', label: 'Water nearby', type: 'boolean' },
    ],
  },
  {
    value: 'mobile_network',
    label: 'Mobile network',
    minPhotos: 0,
    fields: [
      { key: 'operators', label: 'Operators with signal', type: 'multiselect', options: ['BSNL', 'Airtel', 'Jio', 'Vi'] },
      { key: 'signal_note', label: 'Signal note', type: 'text' },
    ],
  },
  {
    value: 'viewpoint',
    label: 'Viewpoint',
    minPhotos: 0,
    fields: [
      { key: 'best_time_of_day', label: 'Best time of day', type: 'select', options: ['sunrise', 'morning', 'afternoon', 'sunset', 'night'] },
    ],
  },
]

export function categoryDef(value: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.value === value)
}

// Defense in depth: `attributes` is a jsonb column, so Postgres won't stop a
// stray/renamed/leftover key from getting written. The UI only ever shows
// fields from the matching CategoryDef, but this makes that the enforced
// shape rather than just the usual one, no matter what called insert/update.
export function sanitizeAttributes(category: string, attributes: Record<string, unknown>): Record<string, unknown> {
  const allowedKeys = new Set(categoryDef(category)?.fields.map((f) => f.key) ?? [])
  return Object.fromEntries(Object.entries(attributes).filter(([key]) => allowedKeys.has(key)))
}
