import { Fragment, useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, type Location } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { categoryDef } from '../lib/categories'
import type { CommunityNote, Place as PlaceT, PlacePhoto } from '../lib/types'

const REPORT_REASONS = ['spam', 'incorrect', 'closed', 'duplicate'] as const
const pillButtonClass = 'rounded-full border border-ink/10 bg-surface px-3.5 py-1.5 text-[13px] font-medium text-ink disabled:opacity-50'

export default function Place() {
  const { placeId } = useParams()
  const { session, configured } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  // If we're already rendered as an overlay (opened from Home), our own
  // background is Home's location - reuse that for Edit instead of nesting
  // an overlay on top of this one, which would unmount Home underneath it.
  const background = (location.state as { background?: Location } | null)?.background ?? location

  const [place, setPlace] = useState<PlaceT | null>(null)
  const [photos, setPhotos] = useState<PlacePhoto[]>([])
  const [notes, setNotes] = useState<CommunityNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [reportReason, setReportReason] = useState<typeof REPORT_REASONS[number]>('incorrect')
  const [status, setStatus] = useState<string | null>(null)
  const [noteStatus, setNoteStatus] = useState<string | null>(null)
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
    setStatus(error ? error.message : "Thanks for helping keep Lamyig accurate.")
    load()
  }

  async function report() {
    if (!supabase || !session || !placeId) return
    const { error } = await supabase.from('place_reports').insert({ place_id: placeId, reporter_id: session.user.id, reason: reportReason })
    setStatus(error ? error.message : "Thanks for the heads up - we'll take a look.")
  }

  async function reportNote(noteId: string) {
    if (!supabase || !session || !placeId) return
    const { error } = await supabase.from('place_reports').insert({ place_id: placeId, reporter_id: session.user.id, reason: 'spam', note_id: noteId })
    setNoteStatus(error ? error.message : "Thanks for the heads up - we'll take a look.")
  }

  async function submitNote() {
    if (!supabase || !session || !placeId || !newNote.trim()) return
    setNoteStatus(null)
    const { error } = await supabase.from('community_notes').insert({ place_id: placeId, author_id: session.user.id, body: newNote.trim() })
    if (error) {
      setNoteStatus(error.message)
      return
    }
    setNoteStatus('Your note is up - future travellers will see it.')
    setNewNote('')
    load()
  }

  if (!configured) {
    return <p className="text-sm text-muted">Backend isn't connected yet.</p>
  }

  if (!place) return <p className="text-sm text-muted">Finding this place…</p>

  const def = categoryDef(place.category)
  const publicUrl = (path: string) => supabase!.storage.from('place-photos').getPublicUrl(path).data.publicUrl

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{place.name}</h1>
          <p className="text-sm text-muted">{def?.label ?? place.category}</p>
        </div>
        <button
          onClick={() => navigate(`/place/${place.id}/edit`, { state: { background } })}
          className="text-sm font-medium text-accent underline"
        >
          Edit
        </button>
      </div>

      {photos.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {photos.map((p) => (
            <img key={p.id} src={publicUrl(p.storage_path)} alt={place.name} className="h-40 w-56 shrink-0 rounded-xl object-cover" />
          ))}
        </div>
      )}

      {place.description && <p className="mt-4 whitespace-pre-wrap text-sm">{place.description}</p>}

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {place.price_range && <><dt className="text-muted">Price</dt><dd>{place.price_range}</dd></>}
        {place.phone && <><dt className="text-muted">Phone</dt><dd>{place.phone}</dd></>}
        {place.whatsapp && <><dt className="text-muted">WhatsApp</dt><dd>{place.whatsapp}</dd></>}
        {def?.fields.map((f) => {
          const value = place.attributes[f.key]
          if (value === undefined || value === '' || value === false) return null
          return (
            <Fragment key={f.key}>
              <dt className="text-muted">{f.label}</dt>
              <dd>{Array.isArray(value) ? value.join(', ') : String(value)}</dd>
            </Fragment>
          )
        })}
      </dl>

      <p className="mt-4 text-sm text-muted">
        {place.last_verified_at
          ? `Last confirmed ${new Date(place.last_verified_at).toLocaleDateString()}`
          : 'Not yet confirmed'}
      </p>

      {session ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={verify} disabled={hasVerified} className={pillButtonClass}>
            {hasVerified ? 'You confirmed this' : 'Still accurate?'}
          </button>
          <select value={reportReason} onChange={(e) => setReportReason(e.target.value as typeof reportReason)} className={pillButtonClass}>
            {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={report} className={pillButtonClass}>Help improve this place</button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">
          <button onClick={() => navigate('/auth', { state: { background } })} className="font-medium text-accent underline">Sign in</button> to confirm, help improve, or edit this place.
        </p>
      )}
      {status && <p className="mt-2 text-sm text-muted">{status}</p>}

      <h2 className="mt-8 text-[15px] font-bold">Community notes</h2>
      <div className="mt-2 flex flex-col gap-3">
        {notes.map((n) => (
          <div key={n.id} className="rounded-xl bg-accent-light p-3 text-sm">
            <p>{n.body}</p>
            {session && (
              <button onClick={() => reportNote(n.id)} className="mt-1.5 text-[11.5px] font-medium text-muted underline">
                Report
              </button>
            )}
          </div>
        ))}
        {notes.length === 0 && <p className="text-sm text-muted">No community notes yet. Share something future travellers should know.</p>}
      </div>
      {session && (
        <div className="mt-3 flex gap-2">
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Stayed June 2026. Meals included. Cash only…"
            className="flex-1 rounded-full border border-ink/10 bg-surface px-4 py-2 text-sm outline-none focus:border-accent"
          />
          <button onClick={submitNote} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-surface">Post</button>
        </div>
      )}
      {noteStatus && <p className="mt-2 text-sm text-muted">{noteStatus}</p>}
    </div>
  )
}
