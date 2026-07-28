import { useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'

const inputClass = 'rounded-[10px] border border-ink/[0.14] bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent-light'

export default function Feedback() {
  const { session, configured } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!configured) {
    return <p className="text-sm text-muted">Backend isn't connected yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await supabase!.from('feedback').insert({
      message,
      email: email || null,
      submitted_by: session?.user.id ?? null,
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    showToast('Thanks for the feedback.')
    navigate(-1)
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
