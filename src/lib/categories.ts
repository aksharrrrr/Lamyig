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
}

// Base fields (name, description, coordinates, village/region, photos, phone,
// whatsapp, price range) are shared by every category — see docs/08-mvp.md.
// These are the category-specific fields from that doc's field table.
export const CATEGORIES: CategoryDef[] = [
  {
    value: 'homestay',
    label: 'Homestay',
    fields: [
      { key: 'meals_included', label: 'Meals included', type: 'boolean' },
      { key: 'parking', label: 'Parking', type: 'select', options: ['none', 'bike', 'car', 'bike and car'] },
      { key: 'cash_only', label: 'Cash only', type: 'boolean' },
    ],
  },
  {
    value: 'mechanic',
    label: 'Mechanic',
    fields: [
      { key: 'services', label: 'Services', type: 'multiselect', options: ['puncture repair', 'general repair', 'spare parts'] },
      { key: 'vehicle_types', label: 'Vehicle types serviced', type: 'multiselect', options: ['bike', 'car'] },
    ],
  },
  {
    value: 'fuel',
    label: 'Fuel',
    fields: [
      { key: 'fuel_types', label: 'Fuel types', type: 'multiselect', options: ['petrol', 'diesel'] },
      { key: 'source', label: 'Source', type: 'select', options: ['pump', 'informal (jerry can)'] },
    ],
  },
  {
    value: 'food',
    label: 'Food',
    fields: [
      { key: 'meal_times', label: 'Meal times', type: 'text' },
      { key: 'cash_only', label: 'Cash only', type: 'boolean' },
    ],
  },
  {
    value: 'drinking_water',
    label: 'Drinking water',
    fields: [
      { key: 'potable', label: 'Potable', type: 'boolean' },
      { key: 'cost', label: 'Cost', type: 'select', options: ['free', 'paid'] },
    ],
  },
  {
    value: 'toilet',
    label: 'Toilet',
    fields: [
      { key: 'clean', label: 'Clean', type: 'boolean' },
      { key: 'cost', label: 'Cost', type: 'select', options: ['free', 'paid'] },
      { key: 'style', label: 'Style', type: 'select', options: ['Indian', 'Western'] },
    ],
  },
  {
    value: 'medical',
    label: 'Medical',
    fields: [
      { key: 'facility_type', label: 'Type', type: 'select', options: ['clinic', 'pharmacy', 'hospital'] },
      { key: 'emergency_capable', label: 'Emergency-capable', type: 'boolean' },
    ],
  },
  {
    value: 'camping',
    label: 'Camping',
    fields: [
      { key: 'tent_allowed', label: 'Tent pitch allowed', type: 'boolean' },
      { key: 'nearby_toilet', label: 'Toilet nearby', type: 'boolean' },
      { key: 'nearby_water', label: 'Water nearby', type: 'boolean' },
    ],
  },
  {
    value: 'mobile_network',
    label: 'Mobile network',
    fields: [
      { key: 'operators', label: 'Operators with signal', type: 'multiselect', options: ['BSNL', 'Airtel', 'Jio', 'Vi'] },
      { key: 'signal_note', label: 'Signal note', type: 'text' },
    ],
  },
  {
    value: 'viewpoint',
    label: 'Viewpoint',
    fields: [
      { key: 'best_time_of_day', label: 'Best time of day', type: 'select', options: ['sunrise', 'morning', 'afternoon', 'sunset', 'night'] },
    ],
  },
]

export function categoryDef(value: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.value === value)
}
