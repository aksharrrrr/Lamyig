import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  downloadSpitiPack, formatPackDate, getOfflinePack, removeOfflinePack,
  SPITI_MAP_BYTES, SPITI_PACK_SLUG, type OfflineRegionPack,
} from '../lib/offlinePack'

export default function Region({ embedded = false }: { embedded?: boolean }) {
  const { regionSlug } = useParams()
  const navigate = useNavigate()
  const [pack, setPack] = useState<OfflineRegionPack | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { getOfflinePack(regionSlug).then(setPack).catch(() => setPack(null)) }, [regionSlug])

  if (regionSlug !== SPITI_PACK_SLUG) {
    return wrapRegionContent(embedded, (
      <>
        {!embedded && <Link to="/" className="text-sm font-semibold text-accent-text underline">← Back to map</Link>}
        <h1 className={`${embedded ? '' : 'mt-5 '}text-2xl font-bold capitalize`}>{regionSlug}</h1>
        <p className="mt-2 text-sm text-muted">This region is still being mapped. Spiti is the first region available for offline download.</p>
      </>
    ))
  }

  const content = (
    <>
      {!embedded && <Link to="/" className="text-sm font-semibold text-accent-text underline">← Back to map</Link>}
      <p className={`${embedded ? '' : 'mt-5 '}text-xs font-semibold uppercase tracking-wide text-muted`}>Offline region</p>
      <h1 className="mt-1 text-3xl font-bold">Spiti Valley</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">Save the road map and a snapshot of every Lamyig place in Spiti—including details, Community Notes, and photos—for stretches without signal.</p>

      <div className="mt-5 rounded-xl bg-bg p-4 text-sm text-muted">
        <p><span className="font-semibold text-ink">Map:</span> {(SPITI_MAP_BYTES / 1_000_000).toFixed(1)} MB</p>
        <p><span className="font-semibold text-ink">Places:</span> {pack?.places.length ?? 'current snapshot'}</p>
        <p><span className="font-semibold text-ink">Photos:</span> included; total download varies</p>
        {pack && <p className="mt-2 text-xs font-medium text-accent-text">Stored on this device · downloaded {formatPackDate(pack.downloadedAt)}</p>}
      </div>

      {progress && <p className="mt-4 text-sm font-medium text-accent-text">{progress}</p>}
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(progress)}
          onClick={async () => {
            setError(null)
            try {
              setPack(await downloadSpitiPack(setProgress))
            } catch (downloadError) {
              setError(downloadError instanceof Error ? downloadError.message : 'Could not download Spiti.')
            } finally {
              setProgress(null)
            }
          }}
          className="rounded-[11px] bg-accent px-4 py-2.5 text-sm font-semibold text-surface disabled:opacity-50"
        >
          {pack ? 'Update download' : 'Download Spiti'}
        </button>
        {pack && (
          <button
            type="button"
            onClick={() => navigate('/?region=spiti&offline=spiti')}
            className="rounded-[11px] border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink"
          >Open downloaded map</button>
        )}
        {pack && (
          <button
            type="button"
            disabled={Boolean(progress)}
            onClick={async () => { await removeOfflinePack(); setPack(null); window.dispatchEvent(new CustomEvent('lamyig:offline-pack-updated')) }}
            className="px-2 py-2.5 text-sm font-semibold text-danger underline"
          >Remove download</button>
        )}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-light">The map, places, details, notes, and photos are stored only in this browser on this device. Use the Offline maps button on the map to return here. Update the download when connected to get newer contributions.</p>
    </>
  )

  return wrapRegionContent(embedded, content, true)
}

function wrapRegionContent(embedded: boolean, content: ReactNode, bordered = false) {
  if (embedded) return content
  return (
    <div className="min-h-full bg-bg p-6">
      <div className={`mx-auto max-w-lg rounded-2xl bg-surface p-6 shadow-lg${bordered ? ' border border-ink/10' : ''}`}>
        {content}
      </div>
    </div>
  )
}
