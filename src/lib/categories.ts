export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'multiselect'

export interface CategoryField {
  key: string
  label: string
  type: FieldType
  options?: string[]
}

export type FieldVisibility = 'required' | 'optional' | 'hidden'

export interface CategoryDef {
  value: string
  label: string
  fields: CategoryField[]
  minPhotos: number
  name: FieldVisibility
  description: FieldVisibility
  showPhone: boolean
  showWhatsapp: boolean
  showPriceRange: boolean
}

// Each category defines its own form - not just its own attributes.fields,
// but which base fields even show up. A toilet doesn't have a phone number;
// forcing a Name on every fuel stop is friction with no payoff. See
// docs/14-decision-log.md for the full per-category spec this implements.
export const CATEGORIES: CategoryDef[] = [
  {
    value: 'homestay',
    label: 'Homestay',
    minPhotos: 3,
    name: 'required',
    description: 'optional',
    showPhone: true,
    showWhatsapp: true,
    showPriceRange: true,
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
    name: 'optional',
    description: 'hidden',
    showPhone: true,
    showWhatsapp: true,
    showPriceRange: false,
    fields: [
      { key: 'services', label: 'Services', type: 'multiselect', options: ['tubeless puncture', 'tube puncture', 'general repair', 'spare parts'] },
      { key: 'vehicle_types', label: 'Vehicle types serviced', type: 'multiselect', options: ['bike', 'car'] },
      { key: 'hours', label: 'Hours (e.g. "8am-8pm" or "24x7")', type: 'text' },
    ],
  },
  {
    value: 'fuel',
    label: 'Fuel',
    minPhotos: 0,
    name: 'hidden',
    description: 'hidden',
    showPhone: true,
    showWhatsapp: true,
    showPriceRange: false,
    fields: [
      { key: 'fuel_types', label: 'Fuel types', type: 'multiselect', options: ['petrol', 'diesel'] },
      { key: 'source', label: 'Source', type: 'select', options: ['pump', 'informal (jerry can)'] },
      { key: 'hours', label: 'Hours (e.g. "8am-8pm" or "24x7")', type: 'text' },
    ],
  },
  {
    value: 'toilet',
    label: 'Toilet',
    minPhotos: 0,
    name: 'hidden',
    description: 'hidden',
    showPhone: false,
    showWhatsapp: false,
    showPriceRange: false,
    fields: [
      { key: 'clean', label: 'Clean', type: 'boolean' },
      { key: 'cost', label: 'Cost', type: 'select', options: ['free', 'paid'] },
      { key: 'style', label: 'Style', type: 'select', options: ['Indian', 'Western'] },
    ],
  },
  {
    value: 'camping',
    label: 'Camping site',
    minPhotos: 0,
    name: 'hidden',
    description: 'optional',
    showPhone: false,
    showWhatsapp: false,
    showPriceRange: false,
    fields: [
      { key: 'tent_allowed', label: 'Tent pitch allowed', type: 'boolean' },
      { key: 'nearby_toilet', label: 'Toilet nearby', type: 'boolean' },
      { key: 'nearby_water', label: 'Water nearby', type: 'boolean' },
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
