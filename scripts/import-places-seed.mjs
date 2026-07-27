// One-off import of data/places-seed.csv (researched from public travel
// blogs, cleaned up and verified per docs/14-decision-log.md-adjacent
// process) into villages + places. Regions already exist (supabase/seed.sql);
// villages are created here if missing, using the researched center_lat/lng.
//
// Usage: node scripts/import-places-seed.mjs
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

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n') {
      row.push(field); field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else if (c === '\r') {
      // skip
    } else {
      field += c
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  const header = rows.shift()
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

async function ensureVillage(regionId, slug, name, lat, lng, cache) {
  const key = `${regionId}:${slug}`
  if (cache[key]) return cache[key]
  const { data: existing } = await supabase.from('villages').select('id,center_lat,center_lng').eq('region_id', regionId).eq('slug', slug).maybeSingle()
  if (existing) {
    cache[key] = existing.id
    if (lat != null && lng != null && existing.center_lat == null) {
      const { error } = await supabase.from('villages').update({ center_lat: lat, center_lng: lng }).eq('id', existing.id)
      if (error) throw error
    }
    return existing.id
  }
  const insertRow = { name, slug, region_id: regionId }
  if (lat != null && lng != null) { insertRow.center_lat = lat; insertRow.center_lng = lng }
  const { data: created, error } = await supabase.from('villages').insert(insertRow).select('id').single()
  if (error) throw error
  cache[key] = created.id
  return created.id
}

async function main() {
  const csvPath = path.join(__dirname, '..', 'data', 'places-seed.csv')
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'))
  console.log(`loaded ${rows.length} rows from data/places-seed.csv`)

  const email = `lamyig.import.${Date.now()}@gmail.com`
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password: 'lamyig-import-pw-1' })
  if (signUpError) throw signUpError
  const userId = signUpData.user.id
  console.log('importing as', email)

  const { data: regions } = await supabase.from('regions').select('id,slug,name')
  const regionBySlug = Object.fromEntries(regions.map((r) => [r.slug, r]))
  const villageCache = {}

  // verified village centers (see docs from the coord-correction pass), NOT
  // derived from places rows - those are individually scattered and would
  // give a wrong, arbitrary "center".
  const centersCsvPath = path.join(__dirname, '..', 'data', 'village-centers.csv')
  const centerRows = parseCsv(fs.readFileSync(centersCsvPath, 'utf8'))
  const villageCenters = {}
  for (const r of centerRows) {
    villageCenters[`${r.region}:${r.village_slug}`] = { lat: parseFloat(r.lat), lng: parseFloat(r.lng) }
  }

  const placesToInsert = []
  const skipped = []
  for (const r of rows) {
    const region = regionBySlug[r.region]
    if (!region) { skipped.push({ row: r.name, reason: `unknown region ${r.region}` }); continue }
    const center = villageCenters[`${r.region}:${r.village_slug}`]
    const villageId = await ensureVillage(region.id, r.village_slug, r.village_name, center?.lat, center?.lng, villageCache)

    // Idempotency: this script has no transaction/run tracking, and gets
    // re-run as the seed CSV grows, so skip anything already present
    // (same name in the same village) rather than duplicating it.
    const { data: dupe } = await supabase.from('places').select('id').eq('village_id', villageId).eq('name', r.name).maybeSingle()
    if (dupe) { skipped.push({ row: r.name, reason: 'already exists in this village' }); continue }

    let attributes = {}
    try { attributes = r.attributes_json ? JSON.parse(r.attributes_json) : {} } catch { attributes = {} }
    attributes = {
      ...attributes,
      source_url: r.source_url || undefined,
      source_name: r.source_name || undefined,
      confidence: r.confidence || undefined,
      obscurity: r.obscurity || undefined,
    }

    placesToInsert.push({
      name: r.name,
      category: r.category,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      region_id: region.id,
      village_id: villageId,
      description: r.description || '',
      phone: r.phone || null,
      price_range: r.price_range || null,
      attributes,
      added_by: userId,
      last_edited_by: userId,
    })
  }

  if (skipped.length) console.log('skipped rows:', skipped)

  console.log('inserting', placesToInsert.length, 'places...')
  const { data: inserted, error: insertError } = await supabase.from('places').insert(placesToInsert).select('id')
  if (insertError) throw insertError
  console.log('inserted', inserted.length, 'places')
}

main().catch((err) => { console.error('IMPORT FAILED', err); process.exit(1) })
