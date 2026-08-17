export interface Region {
  id: string
  slug: string
  name: string
  state: string
  description: string | null
  featured: boolean
  center_lat: number | null
  center_lng: number | null
  default_zoom: number
  offline_revision?: number
  offline_west?: number | null
  offline_south?: number | null
  offline_east?: number | null
  offline_north?: number | null
}

export interface Village {
  id: string
  slug: string
  name: string
  region_id: string
  center_lat: number | null
  center_lng: number | null
}

export interface Trek {
  id: string
  slug: string
  name: string
  center_lat: number | null
  center_lng: number | null
}

export interface Place {
  id: string
  name: string
  category: string
  lat: number
  lng: number
  village_id: string | null
  region_id: string | null
  trek_id: string | null
  description: string
  phone: string | null
  whatsapp: string | null
  price_range: string | null
  attributes: Record<string, unknown>
  added_by: string | null
  last_edited_by: string | null
  last_verified_at: string | null
  verified_count: number
  created_at: string
  updated_at: string
}

export interface PlacePhoto {
  id: string
  place_id: string
  storage_path: string
  uploaded_by: string | null
  created_at: string
}

export interface CommunityNote {
  id: string
  place_id: string
  author_id: string
  body: string
  created_at: string
}
