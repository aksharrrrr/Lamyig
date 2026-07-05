// Seeds ~35 demo places spread across the real seeded regions
// (Spiti/Ladakh/Zanskar/Sikkim) so the map has visual spread across India
// instead of clustering at one or two test coordinates. Purely for local
// dev/demo purposes - these are placeholder names, not verified real
// content (see D-007: docs are never fabricated research, but this is
// app data, not documentation, and is clearly labeled as such below).
//
// Usage: node scripts/seed-demo-places.mjs
// Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env at repo root.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env')
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => line.split('=').map((s) => s.trim())),
)

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const TARGET_COUNT = 35
const CATEGORY_CYCLE = ['homestay', 'mechanic', 'fuel', 'toilet', 'camping']
const CATEGORY_ATTRS = {
  homestay: { meals_included: true, parking: 'bike', cash_only: true },
  mechanic: { services: ['tube puncture'], vehicle_types: ['bike'] },
  fuel: { fuel_types: ['petrol'], source: 'pump' },
  toilet: { clean: true, cost: 'free', style: 'Indian' },
  camping: { tent_allowed: true, nearby_water: true },
}

// Real approximate village/town coordinates - existing Spiti villages don't
// store their own lat/lng (only Places do), so this repeats what
// supabase/seed.sql implies for them; the other three regions are real
// villages not yet in supabase/seed.sql, created here if missing.
const REGION_VILLAGES = {
  spiti: [
    { slug: 'kaza', name: 'Kaza', lat: 32.2265, lng: 78.0569 },
    { slug: 'losar', name: 'Losar', lat: 32.4667, lng: 77.9333 },
    { slug: 'tabo', name: 'Tabo', lat: 32.0952, lng: 78.3576 },
    { slug: 'dhankar', name: 'Dhankar', lat: 32.1975, lng: 78.1975 },
    { slug: 'gue', name: 'Gue', lat: 32.2833, lng: 78.5833 },
    { slug: 'shego', name: 'Shego', lat: 32.2, lng: 78.05 },
  ],
  ladakh: [
    { slug: 'leh', name: 'Leh', lat: 34.1526, lng: 77.5771 },
    { slug: 'nubra', name: 'Nubra', lat: 34.5333, lng: 77.5833 },
    { slug: 'pangong', name: 'Pangong', lat: 33.7526, lng: 78.4425 },
    { slug: 'alchi', name: 'Alchi', lat: 34.2333, lng: 77.2667 },
  ],
  zanskar: [
    { slug: 'padum', name: 'Padum', lat: 33.4652, lng: 76.8887 },
    { slug: 'karsha', name: 'Karsha', lat: 33.5333, lng: 76.8333 },
    { slug: 'zangla', name: 'Zangla', lat: 33.6333, lng: 76.9167 },
    { slug: 'rangdum', name: 'Rangdum', lat: 33.9333, lng: 76.4167 },
  ],
  sikkim: [
    { slug: 'gangtok', name: 'Gangtok', lat: 27.3389, lng: 88.6065 },
    { slug: 'pelling', name: 'Pelling', lat: 27.2167, lng: 88.2333 },
    { slug: 'lachen', name: 'Lachen', lat: 27.7167, lng: 88.55 },
    { slug: 'yumthang', name: 'Yumthang', lat: 27.8167, lng: 88.6833 },
  ],
}

function jitter() {
  return (Math.random() - 0.5) * 0.08 // spread pins slightly so they don't stack exactly on the village point
}

async function ensureVillage(regionId, village, cache) {
  const key = `${regionId}:${village.slug}`
  if (cache[key]) return cache[key]
  const { data: existing } = await supabase.from('villages').select('id').eq('region_id', regionId).eq('slug', village.slug).maybeSingle()
  if (existing) { cache[key] = existing.id; return existing.id }
  const { data: created, error } = await supabase.from('villages').insert({ name: village.name, slug: village.slug, region_id: regionId, center_lat: village.lat, center_lng: village.lng }).select('id').single()
  if (error) throw error
  cache[key] = created.id
  return created.id
}

async function main() {
  const email = `lamyig.seed.${Date.now()}@gmail.com`
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password: 'lamyig-seed-pw-1' })
  if (signUpError) throw signUpError
  const userId = signUpData.user.id
  console.log('seeding as', email)

  const { data: regions } = await supabase.from('regions').select('id,slug,name')
  const regionBySlug = Object.fromEntries(regions.map((r) => [r.slug, r]))
  const villageCache = {}

  const allSlots = Object.entries(REGION_VILLAGES).flatMap(([regionSlug, villages]) =>
    villages.map((village) => ({ regionSlug, village })),
  )

  const placesToInsert = []
  let i = 0
  while (placesToInsert.length < TARGET_COUNT) {
    const { regionSlug, village } = allSlots[i % allSlots.length]
    const region = regionBySlug[regionSlug]
    if (!region) { i++; continue }
    const villageId = await ensureVillage(region.id, village, villageCache)
    const category = CATEGORY_CYCLE[i % CATEGORY_CYCLE.length]
    const round = Math.floor(i / allSlots.length) + 1
    placesToInsert.push({
      name: `${village.name} ${category.charAt(0).toUpperCase() + category.slice(1)}${round > 1 ? ` ${round}` : ''}`,
      category,
      lat: village.lat + jitter(),
      lng: village.lng + jitter(),
      region_id: region.id,
      village_id: villageId,
      description: category === 'homestay' ? `Family-run homestay near ${village.name}.` : '',
      attributes: CATEGORY_ATTRS[category],
      added_by: userId,
      last_edited_by: userId,
    })
    i++
  }

  console.log('inserting', placesToInsert.length, 'places...')
  const { data: inserted, error: insertError } = await supabase.from('places').insert(placesToInsert).select('id')
  if (insertError) throw insertError
  console.log('inserted', inserted.length, 'places')

  const verifications = inserted.map((p) => ({ place_id: p.id, verified_by: userId }))
  const { error: verifyError } = await supabase.from('place_verifications').insert(verifications)
  if (verifyError) console.log('verification insert warning:', verifyError.message)
  else console.log('verified all', verifications.length)
}

main().catch((err) => { console.error('SEED FAILED', err); process.exit(1) })
