import { useState } from 'react'
import { supabase, BACKEND_NOT_CONFIGURED_MESSAGE } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'
import { connectionAwareError, OFFLINE_CONTRIBUTION_MESSAGE } from '../lib/connectivity'
import { useOverlayClose } from '../lib/useOverlayNavigation'

const inputClass = 'rounded-[10px] border border-ink/[0.14] bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent-light'

export default function Feedback() {
  const { session, configured } = useAuth()
  const { showToast } = useToast()
  const close = useOverlayClose()
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!configured) {
    return <p className="text-sm text-muted">{BACKEND_NOT_CONFIGURED_MESSAGE}</p>
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!navigator.onLine) {
      setError(OFFLINE_CONTRIBUTION_MESSAGE)
      return
    }
    setSubmitting(true)
    const { error } = await supabase!.from('feedback').insert({
      message,
      email: email || null,
      submitted_by: session?.user.id ?? null,
    })
    setSubmitting(false)
    if (error) {
      setError(connectionAwareError(error, "Couldn't send that. Try again."))
      return
    }
    showToast('Thanks for the feedback.')
    close()
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">Bug, idea, or anything about Lamyig that's bugging you. This is read directly, not filed into a queue.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          required
          maxLength={5000}
          placeholder="What's on your mind?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className={`${inputClass} resize-none`}
        />
        {!session && (
          <input
            type="email"
            placeholder="Email (optional, if you want a reply)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="rounded-[11px] bg-accent px-4 py-2.5 text-sm font-semibold text-surface disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Send feedback'}
        </button>
      </form>
    </div>
  )
}
