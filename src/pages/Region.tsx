import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  downloadOfflinePack, forgetOfflineRegion, formatPackDate, getOfflinePack, isOfflineRegionSlug,
  OFFLINE_REGION_CONFIG, offlinePackNeedsUpdate, rememberOfflineRegion, removeOfflinePack, type OfflineRegionPack,
} from '../lib/offlinePack'

export default function Region() {
  const { regionSlug } = useParams()
  const navigate = useNavigate()
  const config = isOfflineRegionSlug(regionSlug) ? OFFLINE_REGION_CONFIG[regionSlug] : null
  const [pack, setPack] = useState<OfflineRegionPack | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  useEffect(() => {
    const refresh = () => {
      setOnline(navigator.onLine)
      getOfflinePack(regionSlug)
        .then(async (savedPack) => {
          setPack(savedPack)
          setUpdateAvailable(savedPack ? await offlinePackNeedsUpdate(savedPack) : false)
        })
        .catch(() => { setPack(null); setUpdateAvailable(false) })
    }
    refresh()
    window.addEventListener('online', refresh)
    window.addEventListener('offline', refresh)
    return () => {
      window.removeEventListener('online', refresh)
      window.removeEventListener('offline', refresh)
    }
  }, [regionSlug])

  if (!config || !isOfflineRegionSlug(regionSlug)) {
    return <p className="text-sm leading-relaxed text-muted">Offline access is not available for this region yet.</p>
  }

  const size = `${(config.mapBytes / 1_000_000).toFixed(1)} MB`

  return (
    <div>
      <p className="text-sm leading-relaxed text-muted">
        Take {config.name} with you. Roads, places, photos, and Community Notes stay close—even when the signal does not.
      </p>

      <div className="mt-5 grid grid-cols-3 divide-x divide-ink/10 rounded-xl bg-bg px-2 py-4 text-center">
        <PackStat label="Road map" value={size} />
        <PackStat label="Place guide" value={pack ? String(pack.places.length) : 'Latest'} />
        <PackStat label="Photos & notes" value="Included" />
      </div>

      {pack && (
        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-accent-text">
          <span className="h-2 w-2 rounded-full bg-accent" />
          Ready for the road · updated {formatPackDate(pack.downloadedAt)}
        </div>
      )}
      {pack && updateAvailable && (
        <p className="mt-3 rounded-xl bg-accent-light px-3 py-2 text-sm font-medium text-accent-text">
          New community knowledge is ready. Update before your next stretch without signal.
        </p>
      )}
      {pack && Boolean(pack.missingPhotoCount) && (
        <p className="mt-3 rounded-xl bg-bg px-3 py-2 text-sm text-muted">
          {pack.missingPhotoCount} {pack.missingPhotoCount === 1 ? 'photo was' : 'photos were'} unavailable. Your map and place guide are ready; update later to try again.
        </p>
      )}
      {progress && <p className="mt-4 text-sm font-medium text-accent-text">{progress}</p>}
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {(!pack || updateAvailable) && (
          <button
            type="button"
            disabled={Boolean(progress) || !online}
            onClick={async () => {
              setError(null)
              try {
                setPack(await downloadOfflinePack(regionSlug, setProgress))
                setUpdateAvailable(false)
              } catch (downloadError) {
                const message = downloadError instanceof Error ? downloadError.message : `Could not download ${config.name}.`
                setError(pack ? `${message} Your saved copy is still ready.` : message)
              } finally {
                setProgress(null)
              }
            }}
            className="rounded-[11px] bg-accent px-4 py-2.5 text-sm font-semibold text-surface disabled:opacity-50"
          >
            {pack ? `Update ${config.name}` : `Download ${config.name}`}
          </button>
        )}
        {pack && !updateAvailable && (
          <span className="rounded-[11px] bg-accent-light px-4 py-2.5 text-sm font-semibold text-accent-text">
            {online ? 'Up to date' : 'Saved offline'}
          </span>
        )}
        {pack && (
          <button
            type="button"
            onClick={() => {
              rememberOfflineRegion(regionSlug)
              navigate(`/?region=${regionSlug}&offline=${regionSlug}`)
            }}
            className="rounded-[11px] border border-ink/10 bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5"
          >Open map</button>
        )}
        {pack && !confirmingRemove && (
          <button
            type="button"
            disabled={Boolean(progress)}
            onClick={() => setConfirmingRemove(true)}
            className="ml-auto px-2 py-2.5 text-sm font-semibold text-danger hover:underline"
          >Remove</button>
        )}
      </div>
      {pack && confirmingRemove && (
        <div className="mt-3 rounded-xl border border-danger/15 bg-bg px-3 py-3">
          <p className="text-sm font-medium text-ink">Leave {config.name} on this device?</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">Its road map and saved guide will go. You can always bring it back before another trip.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmingRemove(false)}
              className="rounded-[10px] border border-ink/10 bg-surface px-3 py-2 text-xs font-semibold text-ink"
            >Keep it</button>
            <button
              type="button"
              onClick={async () => {
                setError(null)
                try {
                  await removeOfflinePack(regionSlug)
                  forgetOfflineRegion(regionSlug)
                  setPack(null)
                  setUpdateAvailable(false)
                  setConfirmingRemove(false)
                  window.dispatchEvent(new CustomEvent('lamyig:offline-pack-updated'))
                } catch {
                  setError(`Could not remove ${config.name}. Your saved copy is still here.`)
                }
              }}
              className="rounded-[10px] bg-danger px-3 py-2 text-xs font-semibold text-white"
            >Remove download</button>
          </div>
        </div>
      )}
      <p className="mt-4 text-xs leading-relaxed text-muted-light">This copy stays on this device. Refresh it before your next trip to pick up newer community knowledge.</p>
    </div>
  )
}

function PackStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2">
      <div className="text-sm font-semibold text-ink">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-light">{label}</div>
    </div>
  )
}
