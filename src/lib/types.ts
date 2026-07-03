export interface Region {
  id: string
  slug: string
  name: string
  state: string
  description: string | null
  featured: boolean
}

export interface Village {
  id: string
  slug: string
  name: string
  region_id: string
}

export interface Place {
  id: string
  name: string
  category: string
  lat: number
  lng: number
  village_id: string
  region_id: string
  description: string
  phone: string | null
  whatsapp: string | null
  price_range: string | null
  attributes: Record<string, unknown>
  added_by: string
  last_edited_by: string
  last_verified_at: string | null
  verified_count: number
  created_at: string
  updated_at: string
}

export interface PlacePhoto {
  id: string
  place_id: string
  storage_path: string
  uploaded_by: string
  created_at: string
}

export interface CommunityNote {
  id: string
  place_id: string
  author_id: string
  body: string
  created_at: string
}
