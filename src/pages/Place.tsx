import { Fragment, useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, type Location } from 'react-router'
import { supabase, BACKEND_NOT_CONFIGURED_MESSAGE } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { categoryDef } from '../lib/categories'
import type { CommunityNote, Place as PlaceT, PlacePhoto } from '../lib/types'
import { REPORT_REASONS } from '../lib/constants'
import { getOfflinePacks } from '../lib/offlinePack'
import { mergeOfflinePackContent } from '../lib/offlineMerge'
import { connectionAwareError, OFFLINE_CONTRIBUTION_MESSAGE } from '../lib/connectivity'
import { useToast } from '../lib/useToast'
import { curatedPlacePhoto } from '../lib/curatedPlacePhotos'

const pillButtonClass = 'rounded-full border border-ink/10 bg-surface px-3.5 py-1.5 text-[13px] font-medium text-ink disabled:opacity-50'
const noteIconButtonClass = 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-light hover:bg-ink/5'

function relativeNoteTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export default function Place() {
  const { placeId } = useParams()
  const { session, configured } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useToast()
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
  const [offlinePhotoUrls, setOfflinePhotoUrls] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    if (!supabase || !placeId) return
    if (!navigator.onLine) {
      const content = mergeOfflinePackContent(await getOfflinePacks())
      const offlinePlace = content.places.find((candidate) => candidate.id === placeId)
      if (offlinePlace) {
        setPlace(offlinePlace)
        const offlinePhotos = content.photos.filter((photo) => photo.place_id === placeId)
        setPhotos(offlinePhotos)
        setNotes(content.notes.filter((note) => note.place_id === placeId).sort((a, b) => b.created_at.localeCompare(a.created_at)))
        setOfflinePhotoUrls(Object.fromEntries(offlinePhotos.map((photo) => [photo.storage_path, URL.createObjectURL(photo.blob)])))
      }
      return
    }
    const [{ data: placeData }, { data: photoData }, { data: noteData }] = await Promise.all([
      supabase.from('places').select('*').eq('id', placeId).single(),
      supabase.from('place_photos').select('*').eq('place_id', placeId),
      supabase.from('community_notes').select('*').eq('place_id', placeId).order('created_at', { ascending: false }),
    ])
    if (placeData) setPlace(placeData as PlaceT)
    else {
      const content = mergeOfflinePackContent(await getOfflinePacks())
      const offlinePlace = content.places.find((candidate) => candidate.id === placeId)
      if (offlinePlace) setPlace(offlinePlace)
    }
    if (photoData) setPhotos(photoData as PlacePhoto[])
    if (noteData) setNotes(noteData as CommunityNote[])
  }, [placeId])

  useEffect(() => { load() }, [load])

  async function report() {
    if (!supabase || !session || !placeId) return
    if (!navigator.onLine) return setStatus(OFFLINE_CONTRIBUTION_MESSAGE)
    const { error } = await supabase.from('place_reports').insert({ place_id: placeId, reporter_id: session.user.id, reason: reportReason })
    setStatus(error ? connectionAwareError(error, "Couldn't send that report. Try again.") : "Thanks for the heads up - we'll take a look.")
  }

  async function reportNote(noteId: string) {
    if (!supabase || !session || !placeId) return
    if (!navigator.onLine) return setNoteStatus(OFFLINE_CONTRIBUTION_MESSAGE)
    const { error } = await supabase.from('place_reports').insert({ place_id: placeId, reporter_id: session.user.id, reason: 'spam', note_id: noteId })
    setNoteStatus(error ? connectionAwareError(error, "Couldn't send that report. Try again.") : "Thanks for the heads up - we'll take a look.")
  }

  async function deleteNote(noteId: string) {
    if (!supabase || !session) return
    if (!navigator.onLine) return setNoteStatus(OFFLINE_CONTRIBUTION_MESSAGE)
    const { error } = await supabase.from('community_notes').delete().eq('id', noteId)
    setNoteStatus(error ? connectionAwareError(error, "Couldn't remove that note. Try again.") : 'Note removed.')
    load()
  }

  async function submitNote() {
    if (!supabase || !session || !placeId || !newNote.trim()) return
    setNoteStatus(null)
    if (!navigator.onLine) return setNoteStatus(OFFLINE_CONTRIBUTION_MESSAGE)
    const { error } = await supabase.from('community_notes').insert({ place_id: placeId, author_id: session.user.id, body: newNote.trim() })
    if (error) {
      setNoteStatus(connectionAwareError(error, "Couldn't post that note. Try again."))
      return
    }
    setNoteStatus('Your note is up - future travellers will see it.')
    setNewNote('')
    load()
  }

  if (!configured) {
    return <p className="text-sm text-muted">{BACKEND_NOT_CONFIGURED_MESSAGE}</p>
  }

  if (!place) return <p className="text-sm text-muted">Finding this place…</p>

  const def = categoryDef(place.category)
  const curatedPhoto = curatedPlacePhoto(place.id)
  const publicUrl = (path: string) => offlinePhotoUrls[path] ?? supabase!.storage.from('place-photos').getPublicUrl(path).data.publicUrl

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{place.name}</h1>
          <p className="text-sm text-muted">{def?.label ?? place.category}</p>
        </div>
        <button
          onClick={() => {
            if (!navigator.onLine) return showToast(OFFLINE_CONTRIBUTION_MESSAGE)
            navigate(`/place/${place.id}/edit`, { state: { background } })
          }}
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

      {photos.length === 0 && curatedPhoto && (
        <figure className="mt-4">
          <img src={curatedPhoto.url} alt={curatedPhoto.alt} className="h-56 w-full rounded-xl object-cover" />
          <figcaption className="mt-1.5 text-[11px] leading-4 text-muted-light">
            Photo by{' '}
            <a href={curatedPhoto.sourceUrl} target="_blank" rel="noreferrer" className="underline">{curatedPhoto.credit}</a>
            {' · '}
            <a href={curatedPhoto.licenseUrl} target="_blank" rel="noreferrer" className="underline">{curatedPhoto.license}</a>
          </figcaption>
        </figure>
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

      {session ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <select value={reportReason} onChange={(e) => setReportReason(e.target.value as typeof reportReason)} className={pillButtonClass}>
            {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={report} className={pillButtonClass}>Report</button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">
          <button onClick={() => navigate('/auth', { state: { background } })} className="font-medium text-accent underline">Sign in</button> to report or edit this place.
        </p>
      )}
      {status && <p className="mt-2 text-sm text-muted">{status}</p>}

      <h2 className="mt-8 text-[15px] font-bold">Community notes</h2>
      <div className="mt-1">
        {notes.map((n, i) => (
          <div key={n.id} className={`flex items-start justify-between gap-3 py-3 ${i > 0 ? 'border-t border-ink/10' : ''}`}>
            <div className="min-w-0">
              <p className="text-sm">{n.body}</p>
              <p className="mt-1 text-[12px] text-muted-light">{relativeNoteTime(n.created_at)}</p>
            </div>
            {session && session.user.id === n.author_id && (
              <button onClick={() => deleteNote(n.id)} title="Delete your note" className={noteIconButtonClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
                </svg>
              </button>
            )}
            {session && session.user.id !== n.author_id && (
              <button onClick={() => reportNote(n.id)} title="Report this note" className={noteIconButtonClass}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 21V4" /><path d="M5 4h12l-3 4 3 4H5" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {notes.length === 0 && <p className="py-3 text-sm text-muted">No community notes yet. Share something future travellers should know.</p>}
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
