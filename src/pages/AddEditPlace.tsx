import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation, type Location } from 'react-router'
import { supabase, BACKEND_NOT_CONFIGURED_MESSAGE } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { usePlacesStore } from '../lib/usePlacesStore'
import { useToast } from '../lib/useToast'
import { CATEGORIES, categoryDef, sanitizeAttributes } from '../lib/categories'
import { CATEGORY_ICONS } from '../lib/categoryIcons'
import { compressImage } from '../lib/compressImage'
import LocationPicker from '../components/LocationPicker'
import HoursInput from '../components/HoursInput'
import type { Region, Village, Trek } from '../lib/types'

const MAX_PHOTOS = 6
const inputClass = 'rounded-[10px] border border-ink/[0.14] bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent-light'
const labelClass = 'text-[11.5px] font-semibold uppercase tracking-wide text-muted'
// The standard red-asterisk-for-required convention, not "(optional)" text
// on everything else - required fields are the exception, not the norm.
const requiredMark = <span className="text-danger">*</span>

// Loose on purpose - accepts +country codes, spaces, dashes, parens - but
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
  const location = useLocation()
  const background = (location.state as { background?: Location } | null)?.background ?? location
  const isEdit = Boolean(placeId)
  const navigate = useNavigate()
  const { session, configured, loading: authLoading } = useAuth()
  const { refetch } = usePlacesStore()
  const { showToast } = useToast()

  const [regions, setRegions] = useState<Region[]>([])
  const [villages, setVillages] = useState<Village[]>([])
  const [treks, setTreks] = useState<Trek[]>([])

  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0].value)
  const [description, setDescription] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [regionId, setRegionId] = useState('')
  const [villageName, setVillageName] = useState('')
  const [trekId, setTrekId] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [attributes, setAttributes] = useState<Record<string, unknown>>({})
  const [photos, setPhotos] = useState<File[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const def = categoryDef(category)

  const selectedVillage = villages.find((v) => v.name.trim().toLowerCase() === villageName.trim().toLowerCase())
  const selectedRegion = regions.find((r) => r.id === regionId)
  const selectedTrek = treks.find((t) => t.id === trekId)
  // Region/Village are hidden for now (see below), so for a new place, Trek
  // is the only thing left besides "Use my current location" that can help
  // center the map anywhere other than India-wide.
  const pickerInitialCenter = selectedVillage?.center_lat != null && selectedVillage?.center_lng != null
    ? { lat: selectedVillage.center_lat, lng: selectedVillage.center_lng }
    : selectedRegion?.center_lat != null && selectedRegion?.center_lng != null
      ? { lat: selectedRegion.center_lat, lng: selectedRegion.center_lng }
      : selectedTrek?.center_lat != null && selectedTrek?.center_lng != null
        ? { lat: selectedTrek.center_lat, lng: selectedTrek.center_lng }
        : undefined

  useEffect(() => {
    if (!supabase) return
    supabase.from('regions').select('*').order('name').then(({ data }) => {
      if (data) setRegions(data as Region[])
    })
  }, [])

  useEffect(() => {
    if (!supabase) return
    supabase.from('treks').select('*').order('name').then(({ data }) => {
      if (data) setTreks(data as Trek[])
    })
  }, [])

  // Villages in the selected region, purely to power the datalist suggestions
  // below the Village field - typing a name that isn't in this list creates
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
      setRegionId(data.region_id ?? '')
      setTrekId(data.trek_id ?? '')
      setPhone(data.phone ?? '')
      setWhatsapp(data.whatsapp ?? '')
      setPriceRange(data.price_range ?? '')
      setAttributes(data.attributes ?? {})

      const { data: village } = await supabase!.from('villages').select('name').eq('id', data.village_id).single()
      if (village) setVillageName(village.name)
    })
  }, [placeId])

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
    // Lat/lng no longer have their own visible inputs - the map is the only
    // way to set them (search, drag, tap, or locate), none of which run
    // automatically, so an untouched map would otherwise silently submit
    // (0, 0) now that there's no `required` input left to catch it.
    if (!lat || !lng) {
      setError('Set a location on the map.')
      return
    }
    if (def.name === 'required' && !name.trim()) {
      setError('Enter a name.')
      return
    }
    // Multiselect and Hours fields are custom controls, not native form
    // inputs, so HTML5 `required` (already applied to text/select fields via
    // their `required` attribute) doesn't reach them - check by hand.
    const missingField = def.fields.find((f) => {
      if (!f.required) return false
      if (f.type === 'multiselect') return ((attributes[f.key] as string[] | undefined) ?? []).length === 0
      if (f.type === 'hours') return !(attributes[f.key] as string | undefined)?.trim()
      return false
    })
    if (missingField) {
      setError(`${missingField.type === 'multiselect' ? 'Select at least one option for' : 'Set'} "${missingField.label}".`)
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
      let resolvedVillageId: string | null = null

      // A village always belongs to a region (villages.region_id is NOT
      // NULL) - Region being optional now means this can be reached with a
      // village name but no region (e.g. auto-filled from a map search
      // before Region was touched). Nothing to resolve in that case; the
      // place just submits without a village.
      if (trimmedVillage && regionId) {
        const villageSlug = slugify(trimmedVillage)
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
      }

      const finalName = def.name === 'hidden' ? def.label : (name.trim() || def.label)
      const payload = {
        name: finalName,
        category,
        lat: Number(lat),
        lng: Number(lng),
        region_id: regionId || null,
        village_id: resolvedVillageId,
        trek_id: trekId || null,
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
      }

      for (const [index, file] of photos.entries()) {
        setUploadProgress(`Adding photo ${index + 1} of ${photos.length}…`)
        const compressed = await compressImage(file)
        const path = `${id}/${crypto.randomUUID()}.webp`
        const { error: uploadError } = await supabase.storage.from('place-photos').upload(path, compressed)
        if (uploadError) throw uploadError
        await supabase.from('place_photos').insert({ place_id: id, storage_path: path, uploaded_by: session.user.id })
      }
      setUploadProgress(null)

      if (isEdit) {
        navigate(`/place/${id}`)
      } else {
        refetch()
        const regionName = regions.find((r) => r.id === regionId)?.name ?? ''
        showToast(`Thanks for sharing "${finalName}"${regionName ? ` in ${regionName}` : ''}.`)
        navigate('/')
      }
    } catch (err) {
      // Supabase throws plain PostgrestError objects, not real Error
      // instances, so `instanceof Error` alone was swallowing the real
      // message and always showing "Something went wrong."
      const message = err instanceof Error
        ? err.message
        : (typeof err === 'object' && err && 'message' in err ? String(err.message) : "Couldn't save that. Try again.")
      setError(message)
    } finally {
      setSubmitting(false)
      setUploadProgress(null)
    }
  }

  if (!configured) {
    return <p className="text-sm text-muted">{BACKEND_NOT_CONFIGURED_MESSAGE}</p>
  }

  if (!authLoading && !session) {
    return (
      <div>
        <p className="text-sm text-muted">Sign in to add a place.</p>
        <button
          onClick={() => navigate('/auth', { state: { background } })}
          className="mt-4 inline-block rounded-[10px] bg-accent px-4 py-2 text-sm font-semibold text-surface"
        >
          Sign in
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Category</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const selected = c.value === category
            const CategoryIcon = CATEGORY_ICONS[c.value]
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  if (c.value === category) return
                  // Each category has its own form (see categories.ts) - carrying
                  // typed-in values across a category switch means what you see
                  // no longer matches what's about to be submitted (e.g. a
                  // Homestay name silently surviving a switch to Mechanic).
                  setCategory(c.value)
                  setName('')
                  setDescription('')
                  setPhone('')
                  setWhatsapp('')
                  setPriceRange('')
                  setAttributes({})
                  setPhotos([])
                }}
                className="flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-all"
                style={{
                  background: selected ? c.color : 'var(--color-surface)',
                  color: selected ? '#ffffff' : 'var(--color-muted)',
                  borderColor: selected ? 'transparent' : 'rgba(32,31,35,0.14)',
                }}
              >
                <CategoryIcon color={selected ? '#ffffff' : '#8a8791'} size={15} />
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      {def && def.name !== 'hidden' && (
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Name{def.name === 'required' && <> {requiredMark}</>}</span>
          <input required={def.name === 'required'} value={name} onChange={(e) => setName(e.target.value)} placeholder={def.namePlaceholder} className={inputClass} />
        </label>
      )}

      {def && def.description !== 'hidden' && (
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Description{def.description === 'required' && <> {requiredMark}</>}</span>
          <textarea required={def.description === 'required'} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What makes this place worth marking?" className={`${inputClass} resize-none`} />
        </label>
      )}

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Location</span>
        <LocationPicker
          lat={lat ? Number(lat) : null}
          lng={lng ? Number(lng) : null}
          category={category}
          initialCenter={pickerInitialCenter}
          onChange={(newLat, newLng) => { setLat(String(newLat)); setLng(String(newLng)) }}
          onSelectVillageName={(name) => { if (!villageName.trim()) setVillageName(name) }}
          onLocateError={() => setError("Couldn't get your location - search or tap the map to set it instead.")}
        />
      </div>

      {/* Region and Village fields are hidden for now, not removed - both
          only matter for the Region/Village pages and offline download
          packs (D-005), neither of which is built yet, so requiring them
          was pure friction with no current payoff. regionId/villageName
          state and the submit-time village lookup/creation logic are left
          intact below; bring these two fields back once that work starts. */}

      {treks.length > 0 && (
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Trek (optional)</span>
          <select value={trekId} onChange={(e) => setTrekId(e.target.value)} className={inputClass}>
            <option value="">Not on a trek</option>
            {treks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
      )}

      {def && def.fields.length > 0 && (
        <fieldset className="flex flex-col gap-3 rounded-xl border border-ink/10 p-3.5">
          <legend className="px-1 text-[13px] font-semibold">{def.label} details</legend>
          {def.fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1.5 text-sm">
              {f.type !== 'boolean' && <span className={labelClass}>{f.label}{f.required && <> {requiredMark}</>}</span>}
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
                  required={f.required}
                  value={(attributes[f.key] as string) ?? ''}
                  onChange={(e) => setAttributes({ ...attributes, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className={inputClass}
                />
              )}
              {/* Exactly 2 options is a binary choice - a toggle is one tap,
                  a <select> is "open menu, then pick" for no extra benefit. */}
              {f.type === 'select' && f.options?.length === 2 && (
                <div className="flex gap-2">
                  {f.options.map((o) => {
                    const selected = (attributes[f.key] as string) === o
                    return (
                      <button
                        type="button"
                        key={o}
                        onClick={() => setAttributes({ ...attributes, [f.key]: o })}
                        className="flex-1 rounded-full border px-3 py-2 text-xs font-medium capitalize"
                        style={{
                          background: selected ? 'var(--color-ink)' : 'var(--color-surface)',
                          color: selected ? 'var(--color-surface)' : 'var(--color-ink)',
                          borderColor: selected ? 'var(--color-ink)' : 'rgba(32,31,35,0.14)',
                        }}
                      >
                        {o}
                      </button>
                    )
                  })}
                </div>
              )}
              {f.type === 'select' && f.options?.length !== 2 && (
                <select
                  required={f.required}
                  value={(attributes[f.key] as string) ?? ''}
                  onChange={(e) => setAttributes({ ...attributes, [f.key]: e.target.value })}
                  className={inputClass}
                >
                  <option value="" disabled>Select…</option>
                  {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
              {f.type === 'hours' && (
                <HoursInput
                  key={category}
                  value={(attributes[f.key] as string) ?? ''}
                  onChange={(v) => setAttributes({ ...attributes, [f.key]: v })}
                />
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
                        className="rounded-full border px-3 py-1 text-xs font-medium"
                        style={{
                          background: selected ? 'var(--color-ink)' : 'var(--color-surface)',
                          color: selected ? 'var(--color-surface)' : 'var(--color-ink)',
                          borderColor: selected ? 'var(--color-ink)' : 'rgba(32,31,35,0.14)',
                        }}
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
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            pattern={PHONE_PATTERN}
            title="Digits only, optionally with +, spaces, dashes, or parentheses"
            className={inputClass}
          />
        </label>
      )}
      {def?.showWhatsapp && (
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>WhatsApp</span>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            pattern={PHONE_PATTERN}
            title="Digits only, optionally with +, spaces, dashes, or parentheses"
            className={inputClass}
          />
        </label>
      )}
      {def?.showPriceRange && (
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Price range</span>
          <input value={priceRange} onChange={(e) => setPriceRange(e.target.value)} placeholder="e.g. ₹800–1200/night" className={inputClass} />
        </label>
      )}

      {!isEdit && def?.showPhotos && (
        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>
            Photos {def && def.minPhotos > 0 && requiredMark} ({def && def.minPhotos > 0 ? `min ${def.minPhotos}, ` : ''}max {MAX_PHOTOS})
          </span>
          <div className="flex flex-wrap gap-2.5">
            {photos.map((file, i) => (
              <img key={i} src={URL.createObjectURL(file)} alt="" className="h-16 w-16 rounded-[10px] border border-ink/10 object-cover" />
            ))}
            <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[10px] border-[1.5px] border-dashed border-ink/20 bg-surface hover:border-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a8791" strokeWidth="1.8" strokeLinecap="round">
                <rect x="3.5" y="6.5" width="17" height="13" rx="2.5" /><circle cx="12" cy="13" r="3.4" /><path d="M8.5 6.5L10 4h4l1.5 2.5" />
              </svg>
              <span className="text-[9.5px] font-semibold text-muted-light">Add</span>
              <input type="file" accept="image/*" capture="environment" multiple onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-[11px] bg-accent px-4 py-3 text-sm font-semibold text-surface disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (uploadProgress ?? (isEdit ? 'Saving changes…' : 'Sharing your place…')) : isEdit ? 'Save changes' : 'Save place'}
      </button>
    </form>
  )
}
