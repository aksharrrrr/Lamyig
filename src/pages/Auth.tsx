import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'

export default function Auth() {
  const { session, configured } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!configured) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-medium">Sign in</h1>
        <p className="mt-2 text-neutral-500">
          Backend isn't connected yet — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </p>
      </div>
    )
  }

  if (session) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-medium">You're signed in</h1>
        <p className="mt-2 text-neutral-500">Signed in as {session.user.email}.</p>
        <button
          className="mt-4 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
          onClick={() => supabase!.auth.signOut()}
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

  async function handleGoogle() {
    await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-medium">
        {mode === 'sign-in' ? 'Sign in' : 'Create an account'}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Browsing Lamyig is always free — sign in to add or edit a place.
      </p>

      <button
        onClick={handleGoogle}
        className="mt-6 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
      >
        Continue with Google
      </button>

      <div className="my-4 flex items-center gap-3 text-xs text-neutral-400">
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        or
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {mode === 'sign-in' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      <button
        className="mt-4 text-sm text-neutral-500 underline"
        onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
      >
        {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}
