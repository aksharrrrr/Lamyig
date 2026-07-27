import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { usePlacesStore } from '../lib/usePlacesStore'

export default function Vision({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate()
  const close = onClose ?? (() => navigate(-1))
  const { places } = usePlacesStore()
  const [contributorCount, setContributorCount] = useState<number | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase.from('repo_stats').select('contributor_count').eq('id', true).maybeSingle().then(({ data }) => {
      if (data) setContributorCount(data.contributor_count)
    })
  }, [])

  return (
    <div className="flex flex-col gap-4 text-[14.5px] leading-relaxed text-ink">
      <p className="text-muted">
        Lamyig (ལམ་ཡིག) is the Spiti Bhoti word for guidebook, a name chosen to reflect a guide
        built from the shared knowledge of local communities and travellers.
      </p>

      <p className="font-semibold">Every journey depends on local knowledge.</p>

      <div>
        <p>The family that quietly opens their home to travellers.</p>
        <p>The mechanic who fixes a puncture in a remote village.</p>
        <p>The tea stall owner who knows where to find water, fuel, or the next place to stay.</p>
      </div>

      <p>
        Most of this knowledge never reaches the internet. It lives in conversations, in memory,
        and in the kindness of local people. For everyone else, it remains invisible.
      </p>

      <p>Lamyig exists to give that knowledge a permanent home.</p>

      <p>
        It is a free and open source guide built by travellers and local communities to help
        people discover homestays, mechanics, water points, campsites, food, road information,
        and countless places that commercial platforms rarely notice.
      </p>

      <div>
        <p>No bookings.</p>
        <p>No commissions.</p>
        <p>No sponsored listings.</p>
      </div>

      <p>Every place exists because someone believed another traveller should know about it.</p>

      {contributorCount !== null && (
        <p>
          Today, Lamyig is being shaped by <span className="font-bold">{contributorCount}</span>{' '}
          open source {contributorCount === 1 ? 'contributor' : 'contributors'}, while travellers
          and local communities have already shared{' '}
          <span className="font-bold">{places.length}</span> places.
        </p>
      )}

      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={close}
          className="rounded-[11px] bg-accent px-4 py-2.5 text-sm font-semibold text-surface"
        >
          Continue Exploring
        </button>
        <a
          href="https://github.com/aksharrrrr/Lamyig"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-[11px] border border-ink/[0.14] bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.53.1.72-.23.72-.51v-1.98c-2.94.64-3.56-1.28-3.56-1.28-.48-1.22-1.17-1.55-1.17-1.55-.96-.65.07-.64.07-.64 1.06.07 1.62 1.09 1.62 1.09.94 1.61 2.46 1.15 3.06.87.1-.68.37-1.15.67-1.41-2.35-.27-4.82-1.17-4.82-5.22 0-1.15.41-2.09 1.09-2.83-.11-.27-.47-1.35.1-2.81 0 0 .89-.28 2.91 1.08a10.1 10.1 0 0 1 5.3 0c2.02-1.36 2.91-1.08 2.91-1.08.57 1.46.21 2.54.1 2.81.68.74 1.09 1.68 1.09 2.83 0 4.06-2.48 4.95-4.84 5.21.38.33.72.97.72 1.96v2.9c0 .28.19.62.73.51A10.5 10.5 0 0 0 12 1.5z" />
          </svg>
          View on GitHub
        </a>
      </div>
    </div>
  )
}
