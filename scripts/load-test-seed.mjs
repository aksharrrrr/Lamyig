// Seeds a large batch of throwaway places into the LIVE production DB for
// load testing (no separate staging env exists - see D-010). Every row is
// name-prefixed "LOADTEST" and owned by one freshly created throwaway
// account, so cleanup afterward is one filtered delete - see the SQL
// printed at the end of this script's output.
//
// Usage: node scripts/load-test-seed.mjs [count]
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

const TARGET_COUNT = Number(process.argv[2]) || 1000
const BATCH_SIZE = 200
const CATEGORY_CYCLE = ['homestay', 'mechanic', 'fuel', 'toilet', 'camping']
const CATEGORY_ATTRS = {
  homestay: { meals_included: true, parking: 'bike', cash_only: true },
  mechanic: { services: ['tube puncture'], vehicle_types: ['bike'] },
  fuel: { fuel_types: ['petrol'], source: 'pump' },
  toilet: { clean: true, cost: 'free', style: 'Indian' },
  camping: { tent_allowed: true, nearby_water: true },
}

// Rough real-land bounding boxes spread across the whole country, not just
// the Himalayan regions Lamyig actually covers yet - this is purely to load
// test map rendering/query performance with nationwide spread, not real
// content, so a `region_id`/`village_id` FK doesn't need to semantically
// match the zone a pin's coordinates fall in (see below: every row reuses
// one real filler village so the schema's not-null FKs are satisfied).
const ZONES = [
  { label: 'Himalaya-Spiti', latMin: 31.9, latMax: 32.6, lngMin: 77.8, lngMax: 78.6 },
  { label: 'Himalaya-Ladakh', latMin: 33.5, latMax: 34.8, lngMin: 76.5, lngMax: 78.3 },
  { label: 'Himalaya-Zanskar', latMin: 33.2, latMax: 34.0, lngMin: 76.3, lngMax: 77.3 },
  { label: 'Himalaya-Sikkim', latMin: 27.0, latMax: 28.1, lngMin: 88.0, lngMax: 88.9 },
  { label: 'Northeast', latMin: 24.0, latMax: 27.5, lngMin: 91.0, lngMax: 96.0 },
  { label: 'South', latMin: 8.5, latMax: 15.0, lngMin: 74.5, lngMax: 80.5 },
  { label: 'West', latMin: 15.5, latMax: 26.0, lngMin: 68.5, lngMax: 76.0 },
  { label: 'East-Central', latMin: 20.0, latMax: 27.0, lngMin: 77.5, lngMax: 88.0 },
]

function randomInRange(min, max) {
  return min + Math.random() * (max - min)
}

async function main() {
  const email = `lamyig.loadtest.${Date.now()}@gmail.com`
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password: 'lamyig-loadtest-pw-1' })
  if (signUpError) throw signUpError
  const userId = signUpData.user.id
  console.log('seeding as throwaway account', email, userId)

  // Every row needs a real region_id/village_id (not-null FKs), but map
  // markers render from lat/lng alone (see src/components/Map.tsx) - so one
  // real village works as a filler FK for all 1000 rows regardless of which
  // zone a given pin's coordinates actually fall in.
  const { data: fillerVillage, error: villageError } = await supabase.from('villages').select('id,region_id').limit(1).single()
  if (villageError) throw new Error(`couldn't find any existing village to use as a filler FK: ${villageError.message}`)

  const placesToInsert = []
  for (let i = 0; i < TARGET_COUNT; i++) {
    const zone = ZONES[i % ZONES.length]
    const category = CATEGORY_CYCLE[i % CATEGORY_CYCLE.length]
    placesToInsert.push({
      name: `LOADTEST ${zone.label} ${category} #${i + 1}`,
      category,
      lat: randomInRange(zone.latMin, zone.latMax),
      lng: randomInRange(zone.lngMin, zone.lngMax),
      region_id: fillerVillage.region_id,
      village_id: fillerVillage.id,
      description: 'Synthetic load-test data, not a real place.',
      attributes: CATEGORY_ATTRS[category],
      added_by: userId,
      last_edited_by: userId,
    })
  }

  console.log(`inserting ${placesToInsert.length} places in batches of ${BATCH_SIZE}...`)
  let insertedCount = 0
  for (let start = 0; start < placesToInsert.length; start += BATCH_SIZE) {
    const batch = placesToInsert.slice(start, start + BATCH_SIZE)
    const { data, error } = await supabase.from('places').insert(batch).select('id')
    if (error) throw error
    insertedCount += data.length
    console.log(`  ${insertedCount}/${placesToInsert.length}`)
  }

  console.log('\ndone. cleanup SQL (run in Supabase SQL Editor when finished load testing):\n')
  console.log(`delete from place_verifications where verified_by = '${userId}';`)
  console.log(`delete from places where added_by = '${userId}';`)
  console.log(`delete from auth.users where id = '${userId}';`)
}

main().catch((err) => { console.error('LOAD-TEST SEED FAILED', err); process.exit(1) })
