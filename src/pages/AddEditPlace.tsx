import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { CATEGORIES, categoryDef, sanitizeAttributes } from '../lib/categories'
import { compressImage } from '../lib/compressImage'
import type { Region, Village } from '../lib/types'

const MAX_PHOTOS = 6

// Loose on purpose — accepts +country codes, spaces, dashes, parens — but
// rejects "ajbnfkdsj"-style garbage so at least it's plausibly a phone number.
// The parens MUST be escaped inside the character class: HTML5's `pattern`
// compiles with the regex "v" flag, which treats bare ( ) inside [...] as a
// syntax error - and an unparseable pattern is spec'd to silently impose no
// restriction at all, so validation looked like it was doing nothing.
const PHONE_PATTERN = '^[0-9+][0-9+\\-\\s\\(\\)]{6,19}$'

function slugify(text: string) {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function AddEditPlace() {
  const { placeId } = useParams()
  const isEdit = Boolean(placeId)
  const navigate = useNavigate()
  const { session, configured, loading: authLoading } = useAuth()

  const [regions, setRegions] = useState<Region[]>([])
  const [villages, setVillages] = useState<Village[]>([])

  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0].value)
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [regionId, setRegionId] = useState('')
  const [villageName, setVillageName] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [attributes, setAttributes] = useState<Record<string, unknown>>({})
  const [photos, setPhotos] = useState<File[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const def = categoryDef(category)

  useEffect(() => {
    if (!supabase) return
    supabase.from('regions').select('*').order('name').then(({ data }) => {
      if (data) setRegions(data as Region[])
    })
  }, [])

  // Villages in the selected region, purely to power the datalist suggestions
  // below the Village field — typing a name that isn't in this list creates
  // a new village on submit instead of blocking you.
  useEffect(() => {
    if (!supabase || !regionId) {
      setVillages([])
      return
    }
    supabase.from('villages').select('*').eq('region_id', regionId).order('name').then(({ data }) => {
      if (data) setVillages(data as Village[])
    })
  }, [regionId])

  useEffect(() => {
    if (!supabase || !placeId) return
    supabase.from('places').select('*').eq('id', placeId).single().then(async ({ data }) => {
      if (!data) return
      setName(data.name)
      setCategory(data.category)
      setDescription(data.description)
      setLat(String(data.lat))
      setLng(String(data.lng))
      setRegionId(data.region_id)
      setPhone(data.phone ?? '')
      setWhatsapp(data.whatsapp ?? '')
      setPriceRange(data.price_range ?? '')
      setAttributes(data.attributes ?? {})

      const { data: village } = await supabase!.from('villages').select('name').eq('id', data.village_id).single()
      if (village) setVillageName(village.name)
    })
  }, [placeId])

  function useMyLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude))
        setLng(String(pos.coords.longitude))
      },
      () => setError('Could not get your location — enter coordinates manually.'),
    )
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS)
    setPhotos(files)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!supabase || !session || !def) return
    const minPhotos = def.minPhotos
    if (!isEdit && photos.length < minPhotos) {
      setError(`Upload at least ${minPhotos} photo${minPhotos === 1 ? '' : 's'} for a ${def.label.toLowerCase()}.`)
      return
    }
    if (!regionId || !villageName.trim()) {
      setError('Select a region and enter a village.')
      return
    }
    if (def.name === 'required' && !name.trim()) {
      setError('Enter a name.')
      return
    }

    setSubmitting(true)
    try {
      // Look up an existing village by slug directly in the DB rather than
      // trusting the local `villages` state (only there for datalist
      // suggestions) - that list can still be loading/stale when someone
      // types fast, which caused a duplicate-slug insert attempt against a
      // village ("Kaza") that already existed.
      const trimmedVillage = villageName.trim()
      const villageSlug = slugify(trimmedVillage)
      let resolvedVillageId: string

      const { data: existingVillage } = await supabase
        .from('villages')
        .select('id')
        .eq('region_id', regionId)
        .eq('slug', villageSlug)
        .maybeSingle()

      if (existingVillage) {
        resolvedVillageId = existingVillage.id
      } else {
        const { data: newVillage, error: villageError } = await supabase
          .from('villages')
          .insert({ name: trimmedVillage, slug: villageSlug, region_id: regionId })
          .select('id')
          .single()
        if (villageError) {
          // Someone else created the same village between our check and
          // insert - recover by using theirs instead of failing outright.
          if (villageError.code === '23505') {
            const { data: raceVillage, error: raceError } = await supabase
              .from('villages')
              .select('id')
              .eq('region_id', regionId)
              .eq('slug', villageSlug)
              .single()
            if (raceError) throw raceError
            resolvedVillageId = raceVillage.id
          } else {
            throw villageError
          }
        } else {
          resolvedVillageId = newVillage.id
        }
      }

      const payload = {
        name: def.name === 'hidden' ? def.label : (name.trim() || def.label),
        category,
        lat: Number(lat),
        lng: Number(lng),
        region_id: regionId,
        village_id: resolvedVillageId,
        description: def.description === 'hidden' ? '' : description,
        phone: def.showPhone ? (phone || null) : null,
        whatsapp: def.showWhatsapp ? (whatsapp || null) : null,
        price_range: def.showPriceRange ? (priceRange || null) : null,
        attributes: sanitizeAttributes(category, attributes),
      }

      let id = placeId
      if (isEdit) {
        const { error: updateError } = await supabase.from('places').update(payload).eq('id', placeId)
        if (updateError) throw updateError
      } else {
        const { data, error: insertError } = await supabase
          .from('places')
          .insert({ ...payload, added_by: session.user.id, last_edited_by: session.user.id })
          .select('id')
          .single()
        if (insertError) throw insertError
        id = data.id

        // You just personally confirmed this place exists — that's a verification.
        await supabase.from('place_verifications').insert({ place_id: id, verified_by: session.user.id })
      }

      for (const [index, file] of photos.entries()) {
        setUploadProgress(`Uploading photo ${index + 1} of ${photos.length}…`)
        const compressed = await compressImage(file)
        const path = `${id}/${crypto.randomUUID()}.webp`
        const { error: uploadError } = await supabase.storage.from('place-photos').upload(path, compressed)
        if (uploadError) throw uploadError
        await supabase.from('place_photos').insert({ place_id: id, storage_path: path, uploaded_by: session.user.id })
      }
      setUploadProgress(null)

      navigate(`/place/${id}`)
    } catch (err) {
      // Supabase throws plain PostgrestError objects, not real Error
      // instances, so `instanceof Error` alone was swallowing the real
      // message and always showing "Something went wrong."
      const message = err instanceof Error
        ? err.message
        : (typeof err === 'object' && err && 'message' in err ? String(err.message) : 'Something went wrong.')
      setError(message)
    } finally {
      setSubmitting(false)
      setUploadProgress(null)
    }
  }

  if (!configured) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-medium">Add / edit place</h1>
        <p className="mt-2 text-neutral-500">
          Backend isn't connected yet — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </p>
      </div>
    )
  }

  if (!authLoading && !session) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-medium">Add a place</h1>
        <p className="mt-2 text-neutral-500">Sign in to contribute.</p>
        <Link to="/auth" className="mt-4 inline-block rounded-md bg-neutral-900 px-3 py-2 text-sm text-white">
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-lg flex-col gap-4 p-6">
      <h1 className="text-2xl font-medium">{isEdit ? 'Edit place' : 'Add a place'}</h1>

      <label className="flex flex-col gap-1 text-sm">
        Category
        <select value={category} onChange={(e) => { setCategory(e.target.value); setAttributes({}) }} className="rounded-md border border-neutral-300 px-3 py-2">
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </label>

      {def && def.name !== 'hidden' && (
        <label className="flex flex-col gap-1 text-sm">
          Name {def.name === 'optional' && '(optional)'}
          <input required={def.name === 'required'} value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2" />
        </label>
      )}

      {def && def.description !== 'hidden' && (
        <label className="flex flex-col gap-1 text-sm">
          Description {def.description === 'optional' && '(optional)'}
          <textarea required={def.description === 'required'} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-md border border-neutral-300 px-3 py-2" />
        </label>
      )}

      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Latitude
          <input required type="number" step="any" min={-90} max={90} value={lat} onChange={(e) => setLat(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Longitude
          <input required type="number" step="any" min={-180} max={180} value={lng} onChange={(e) => setLng(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2" />
        </label>
      </div>
      <button type="button" onClick={useMyLocation} className="self-start text-sm text-neutral-500 underline">
        Use my current location
      </button>

      <label className="flex flex-col gap-1 text-sm">
        Region
        <select required value={regionId} onChange={(e) => { setRegionId(e.target.value); setVillageName('') }} className="rounded-md border border-neutral-300 px-3 py-2">
          <option value="" disabled>Select a region…</option>
          {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Village
        <input
          required
          list="village-suggestions"
          value={villageName}
          onChange={(e) => setVillageName(e.target.value)}
          disabled={!regionId}
          placeholder="Type a village name…"
          className="rounded-md border border-neutral-300 px-3 py-2 disabled:opacity-50"
        />
        <datalist id="village-suggestions">
          {villages.map((v) => <option key={v.id} value={v.name} />)}
        </datalist>
      </label>

      {def && def.fields.length > 0 && (
        <fieldset className="flex flex-col gap-3 rounded-md border border-neutral-200 p-3">
          <legend className="px-1 text-sm font-medium">{def.label} details</legend>
          {def.fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1 text-sm">
              {f.type !== 'boolean' && f.label}
              {f.type === 'boolean' && (
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(attributes[f.key])}
                    onChange={(e) => setAttributes({ ...attributes, [f.key]: e.target.checked })}
                  />
                  {f.label}
                </span>
              )}
              {f.type === 'text' && (
                <input
                  value={(attributes[f.key] as string) ?? ''}
                  onChange={(e) => setAttributes({ ...attributes, [f.key]: e.target.value })}
                  className="rounded-md border border-neutral-300 px-3 py-2"
                />
              )}
              {f.type === 'select' && (
                <select
                  value={(attributes[f.key] as string) ?? ''}
                  onChange={(e) => setAttributes({ ...attributes, [f.key]: e.target.value })}
                  className="rounded-md border border-neutral-300 px-3 py-2"
                >
                  <option value="" disabled>Select…</option>
                  {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
              {f.type === 'multiselect' && (
                <div className="flex flex-wrap gap-2">
                  {f.options?.map((o) => {
                    const selected = ((attributes[f.key] as string[]) ?? []).includes(o)
                    return (
                      <button
                        type="button"
                        key={o}
                        onClick={() => {
                          const current = (attributes[f.key] as string[]) ?? []
                          setAttributes({
                            ...attributes,
                            [f.key]: selected ? current.filter((v) => v !== o) : [...current, o],
                          })
                        }}
                        className={`rounded-full border px-3 py-1 text-xs ${selected ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300'}`}
                      >
                        {o}
                      </button>
                    )
                  })}
                </div>
              )}
            </label>
          ))}
        </fieldset>
      )}

      {def?.showPhone && (
        <label className="flex flex-col gap-1 text-sm">
          Phone (optional)
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            pattern={PHONE_PATTERN}
            title="Digits only, optionally with +, spaces, dashes, or parentheses"
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
      )}
      {def?.showWhatsapp && (
        <label className="flex flex-col gap-1 text-sm">
          WhatsApp (optional)
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            pattern={PHONE_PATTERN}
            title="Digits only, optionally with +, spaces, dashes, or parentheses"
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
      )}
      {def?.showPriceRange && (
        <label className="flex flex-col gap-1 text-sm">
          Price range (optional)
          <input value={priceRange} onChange={(e) => setPriceRange(e.target.value)} placeholder="e.g. ₹800–1200/night" className="rounded-md border border-neutral-300 px-3 py-2" />
        </label>
      )}

      {!isEdit && (
        <label className="flex flex-col gap-1 text-sm">
          Photos {def && def.minPhotos > 0 ? `(min ${def.minPhotos}, max ${MAX_PHOTOS})` : `(optional, max ${MAX_PHOTOS})`}
          <input type="file" accept="image/*" capture="environment" multiple onChange={handlePhotoChange} />
          {photos.length > 0 && <span className="text-neutral-500">{photos.length} selected</span>}
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {submitting ? (uploadProgress ?? 'Submitting…') : isEdit ? 'Save changes' : 'Submit'}
      </button>
    </form>
  )
}
