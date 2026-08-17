import { Link, useNavigate } from 'react-router'
import { useState } from 'react'
import { supabase, BACKEND_NOT_CONFIGURED_MESSAGE } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { OFFLINE_ACCOUNT_MESSAGE } from '../lib/connectivity'

export default function Profile() {
  const { session, configured } = useAuth()
  const navigate = useNavigate()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!configured) {
    return <p className="text-sm text-muted">{BACKEND_NOT_CONFIGURED_MESSAGE}</p>
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
      <div className="text-[15px] font-semibold">{session.user.email}</div>
      <button
        onClick={async () => { await supabase!.auth.signOut(); navigate('/') }}
        className="mt-2 w-full rounded-[11px] border border-ink/10 bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5"
      >
        Sign out
      </button>
      <div className="flex gap-3 text-xs text-muted">
        <Link to="/privacy" className="underline underline-offset-2">Privacy</Link>
        <Link to="/terms" className="underline underline-offset-2">Contribution terms</Link>
      </div>
      <div className="mt-4 w-full border-t border-ink/10 pt-4 text-left">
        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="text-sm font-semibold text-danger underline underline-offset-2"
          >
            Delete account
          </button>
        ) : (
          <div className="space-y-3 rounded-xl border border-danger/20 bg-bg p-3">
            <p className="text-sm text-ink">Permanently delete your account, notes, verifications, and reports? Shared place facts and photos remain, without your attribution.</p>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  if (!navigator.onLine) {
                    setError(OFFLINE_ACCOUNT_MESSAGE)
                    return
                  }
                  setDeleting(true)
                  setError(null)
                  const { error: deleteError } = await supabase!.rpc('delete_own_account')
                  if (deleteError) {
                    setError(deleteError.message)
                    setDeleting(false)
                    return
                  }
                  await supabase!.auth.signOut()
                  navigate('/')
                }}
                className="rounded-[10px] bg-danger px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Yes, delete permanently'}
              </button>
              <button type="button" disabled={deleting} onClick={() => setConfirmingDelete(false)} className="rounded-[10px] border border-ink/10 px-3 py-2 text-xs font-semibold">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
