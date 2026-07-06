import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'

const inputClass = 'rounded-[10px] border border-ink/[0.14] bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent-light'

export default function Auth() {
  const { session, configured } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!configured) {
    return <p className="text-sm text-muted">Backend isn't connected yet — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>
  }

  if (session) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">Signed in as {session.user.email}.</p>
        <button
          onClick={() => supabase!.auth.signOut()}
          className="rounded-[11px] border border-ink/10 bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5"
        >
          Sign out
        </button>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = mode === 'sign-in'
      ? await supabase!.auth.signInWithPassword({ email, password })
      : await supabase!.auth.signUp({ email, password })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">Browsing Lamyig is always free — sign in to add or edit a place.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-[11px] bg-accent px-4 py-2.5 text-sm font-semibold text-surface disabled:opacity-50"
        >
          {mode === 'sign-in' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      <button
        className="text-sm font-medium text-muted underline underline-offset-2 hover:text-ink"
        onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
      >
        {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}
