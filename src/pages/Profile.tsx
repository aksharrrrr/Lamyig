import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'

export default function Profile() {
  const { session, configured } = useAuth()
  const navigate = useNavigate()
  const [placesCount, setPlacesCount] = useState<number | null>(null)

  useEffect(() => {
    if (!supabase || !session) return
    supabase
      .from('places')
      .select('id', { count: 'exact', head: true })
      .eq('added_by', session.user.id)
      .then(({ count }) => setPlacesCount(count ?? 0))
  }, [session])

  if (!configured) {
    return <p className="text-sm text-muted">Backend isn't connected yet.</p>
  }

  if (!session) {
    return <p className="text-sm text-muted">Sign in to see your profile.</p>
  }

  const initials = session.user.email ? session.user.email.slice(0, 2).toUpperCase() : '?'

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-accent text-[26px] font-bold text-surface shadow-lg">
        {initials}
      </div>
      <div>
        <div className="text-[15px] font-semibold">{session.user.email}</div>
        <div className="mt-1 text-[13px] text-muted">
          {placesCount === null ? 'Loading…' : `${placesCount} place${placesCount === 1 ? '' : 's'} added`}
        </div>
      </div>
      <button
        onClick={async () => { await supabase!.auth.signOut(); navigate('/') }}
        className="mt-2 w-full rounded-[11px] border border-ink/10 bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5"
      >
        Sign out
      </button>
    </div>
  )
}
