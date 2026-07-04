import { Fragment, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { categoryDef } from '../lib/categories'
import type { CommunityNote, Place as PlaceT, PlacePhoto } from '../lib/types'

const REPORT_REASONS = ['spam', 'incorrect', 'closed', 'duplicate'] as const

export default function Place() {
  const { placeId } = useParams()
  const { session, configured } = useAuth()

  const [place, setPlace] = useState<PlaceT | null>(null)
  const [photos, setPhotos] = useState<PlacePhoto[]>([])
  const [notes, setNotes] = useState<CommunityNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [reportReason, setReportReason] = useState<typeof REPORT_REASONS[number]>('incorrect')
  const [status, setStatus] = useState<string | null>(null)
  const [hasVerified, setHasVerified] = useState(false)

  const load = useCallback(async () => {
    if (!supabase || !placeId) return
    const [{ data: placeData }, { data: photoData }, { data: noteData }] = await Promise.all([
      supabase.from('places').select('*').eq('id', placeId).single(),
      supabase.from('place_photos').select('*').eq('place_id', placeId),
      supabase.from('community_notes').select('*').eq('place_id', placeId).order('created_at', { ascending: false }),
    ])
    if (placeData) setPlace(placeData as PlaceT)
    if (photoData) setPhotos(photoData as PlacePhoto[])
    if (noteData) setNotes(noteData as CommunityNote[])

    if (session) {
      const { data: verification } = await supabase
        .from('place_verifications')
        .select('id')
        .eq('place_id', placeId)
        .eq('verified_by', session.user.id)
        .maybeSingle()
      setHasVerified(Boolean(verification))
    }
  }, [placeId, session])

  useEffect(() => { load() }, [load])

  async function verify() {
    if (!supabase || !session || !placeId || hasVerified) return
    const { error } = await supabase.from('place_verifications').insert({ place_id: placeId, verified_by: session.user.id })
    setStatus(error ? error.message : 'Marked as still accurate.')
    load()
  }

  async function report() {
    if (!supabase || !session || !placeId) return
    const { error } = await supabase.from('place_reports').insert({ place_id: placeId, reporter_id: session.user.id, reason: reportReason })
    setStatus(error ? error.message : 'Reported — thanks, this goes to manual review.')
  }

  async function submitNote() {
    if (!supabase || !session || !placeId || !newNote.trim()) return
    const { error } = await supabase.from('community_notes').insert({ place_id: placeId, author_id: session.user.id, body: newNote.trim() })
    if (!error) {
      setNewNote('')
      load()
    }
  }

  if (!configured) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-medium">Place</h1>
        <p className="mt-2 text-neutral-500">Backend isn't connected yet.</p>
      </div>
    )
  }

  if (!place) return <div className="p-6 text-neutral-500">Loading…</div>

  const def = categoryDef(place.category)
  const publicUrl = (path: string) => supabase!.storage.from('place-photos').getPublicUrl(path).data.publicUrl

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium">{place.name}</h1>
          <p className="text-sm text-neutral-500">{def?.label ?? place.category}</p>
        </div>
        <Link to={`/place/${place.id}/edit`} className="text-sm text-neutral-500 underline">Edit</Link>
      </div>

      {photos.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {photos.map((p) => (
            <img key={p.id} src={publicUrl(p.storage_path)} alt={place.name} className="h-40 w-56 shrink-0 rounded-md object-cover" />
          ))}
        </div>
      )}

      <p className="mt-4 whitespace-pre-wrap">{place.description}</p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {place.price_range && <><dt className="text-neutral-500">Price</dt><dd>{place.price_range}</dd></>}
        {place.phone && <><dt className="text-neutral-500">Phone</dt><dd>{place.phone}</dd></>}
        {place.whatsapp && <><dt className="text-neutral-500">WhatsApp</dt><dd>{place.whatsapp}</dd></>}
        {def?.fields.map((f) => {
          const value = place.attributes[f.key]
          if (value === undefined || value === '' || value === false) return null
          return (
            <Fragment key={f.key}>
              <dt className="text-neutral-500">{f.label}</dt>
              <dd>{Array.isArray(value) ? value.join(', ') : String(value)}</dd>
            </Fragment>
          )
        })}
      </dl>

      <p className="mt-4 text-sm text-neutral-500">
        {place.last_verified_at
          ? `Last verified ${new Date(place.last_verified_at).toLocaleDateString()} by ${place.verified_count} rider${place.verified_count === 1 ? '' : 's'}`
          : 'Not yet verified'}
      </p>

      {session ? (
        <div className="mt-4 flex gap-2">
          <button
            onClick={verify}
            disabled={hasVerified}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {hasVerified ? 'You verified this' : 'Still accurate'}
          </button>
          <select value={reportReason} onChange={(e) => setReportReason(e.target.value as typeof reportReason)} className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm">
            {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={report} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">Report</button>
        </div>
      ) : (
        <p className="mt-4 text-sm">
          <Link to="/auth" className="underline">Sign in</Link> to verify, report, or edit.
        </p>
      )}
      {status && <p className="mt-2 text-sm text-neutral-500">{status}</p>}

      <h2 className="mt-8 text-lg font-medium">Community notes</h2>
      <div className="mt-2 flex flex-col gap-3">
        {notes.map((n) => (
          <p key={n.id} className="rounded-md bg-neutral-100 p-3 text-sm">{n.body}</p>
        ))}
        {notes.length === 0 && <p className="text-sm text-neutral-500">No notes yet.</p>}
      </div>
      {session && (
        <div className="mt-3 flex gap-2">
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Stayed June 2026. Meals included. Cash only…"
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <button onClick={submitNote} className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white">Post</button>
        </div>
      )}
    </div>
  )
}
