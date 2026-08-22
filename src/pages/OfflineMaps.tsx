import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { formatMegabytes, getOfflinePackStatuses, OFFLINE_REGION_CONFIG, type OfflinePackStatus } from '../lib/offlinePack'

export default function OfflineMaps() {
  const navigate = useNavigate()
  const location = useLocation()
  const [statuses, setStatuses] = useState<OfflinePackStatus[]>([])

  useEffect(() => { getOfflinePackStatuses().then(setStatuses).catch(() => setStatuses([])) }, [])

  return (
    <div className="space-y-2">
      <p className="pb-2 text-sm leading-relaxed text-muted">Pick a region to carry with you when the road runs out of signal.</p>
      {Object.entries(OFFLINE_REGION_CONFIG).map(([slug, config]) => {
        const status = statuses.find(({ pack }) => pack.slug === slug)
        const saved = Boolean(status)
        return (
          <button
            key={slug}
            type="button"
            onClick={() => navigate(`/region/${slug}`, {
              state: { ...(location.state as object | null), mapReturnSteps: 2 },
            })}
            className="group flex w-full items-center justify-between rounded-xl border border-ink/[0.08] bg-surface px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-accent-text transition group-hover:rotate-6">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 19c4-1 3-6 7-7s3-5 7-7" /><path d="M6 5h.01M18 19h.01" /><circle cx="6" cy="5" r="2" /><circle cx="18" cy="19" r="2" />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{config.name}</span>
                <span className="mt-0.5 block text-xs text-muted-light">{formatMegabytes(config.mapBytes)}</span>
              </span>
            </span>
            <span className={`text-xs font-semibold ${status?.updateAvailable || status?.pack.missingPhotoCount ? 'text-danger' : saved ? 'text-accent-text' : 'text-muted-light'}`}>
              {status?.updateAvailable ? 'Update available' : status?.pack.missingPhotoCount ? 'Photos incomplete' : saved ? 'On this device' : 'Download'} →
            </span>
          </button>
        )
      })}
    </div>
  )
}
