import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { supabase, BACKEND_NOT_CONFIGURED_MESSAGE } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'

const inputClass = 'rounded-[10px] border border-ink/[0.14] bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent-light'
const passwordInputClass = `${inputClass} w-full pr-10`

function PasswordVisibilityToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Hide password' : 'Show password'}
      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
    >
      {visible ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  )
}

// Mode lives in the URL (?mode=sign-up / ?mode=forgot), not local state, so
// App.tsx can read it to show the right title on the shared Overlay
// wrapper, which only takes a plain string title prop.
export default function Auth() {
  const { session, configured } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const modeParam = searchParams.get('mode')
  const mode = modeParam === 'sign-up' || modeParam === 'forgot' ? modeParam : 'sign-in'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [signupConfirmSent, setSignupConfirmSent] = useState(false)
  // Clicking the emailed reset link lands back here already "signed in" (a
  // temporary recovery session) and fires this specific auth event - that's
  // the only way to distinguish "here to set a new password" from an
  // ordinary signed-in visit, since both have a non-null session.
  const [recovering, setRecovering] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => {
    if (!supabase) return
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (!configured) {
    return <p className="text-sm text-muted">{BACKEND_NOT_CONFIGURED_MESSAGE}</p>
  }

  if (recovering) {
    async function handleSetNewPassword(e: React.FormEvent) {
      e.preventDefault()
      setError(null)
      setSubmitting(true)
      const { error } = await supabase!.auth.updateUser({ password: newPassword })
      setSubmitting(false)
      if (error) {
        setError(error.message)
        return
      }
      setRecovering(false)
      showToast('Password updated.')
      navigate('/')
    }

    return (
      <form onSubmit={handleSetNewPassword} className="flex flex-col gap-3">
        <p className="text-sm text-muted">Choose a new password.</p>
        <div className="relative">
          <input
            type={showNewPassword ? 'text' : 'password'}
            required
            minLength={6}
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={passwordInputClass}
          />
          <PasswordVisibilityToggle visible={showNewPassword} onToggle={() => setShowNewPassword((v) => !v)} />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-[11px] bg-accent px-4 py-2.5 text-sm font-semibold text-surface disabled:opacity-50"
        >
          Update password
        </button>
      </form>
    )
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

  if (mode === 'forgot') {
    async function handleForgotSubmit(e: React.FormEvent) {
      e.preventDefault()
      setError(null)
      setSubmitting(true)
      const { error } = await supabase!.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      })
      setSubmitting(false)
      if (error) {
        setError(error.message)
        return
      }
      setResetSent(true)
    }

    if (resetSent) {
      return <p className="text-sm text-muted">If an account exists for {email}, a reset link is on its way. Check your email.</p>
    }

    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">Enter your email and we'll send a link to reset your password.</p>
        <form onSubmit={handleForgotSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-[11px] bg-accent px-4 py-2.5 text-sm font-semibold text-surface disabled:opacity-50"
          >
            Send reset link
          </button>
        </form>
        <button
          className="text-sm font-medium text-muted underline underline-offset-2 hover:text-ink"
          onClick={() => setSearchParams({}, { state: location.state, replace: true })}
        >
          Back to sign in
        </button>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    if (mode === 'sign-in') {
      const { error } = await supabase!.auth.signInWithPassword({ email, password })
      setSubmitting(false)
      if (error) {
        setError(error.message)
        return
      }
      navigate('/')
      return
    }

    // Email confirmation is on (Authentication -> Providers -> Email in the
    // Supabase dashboard), so a successful signUp doesn't come with a
    // session yet - the account exists but is unconfirmed. Redirecting to
    // '/' here would silently drop back to a signed-out home page with zero
    // feedback, indistinguishable from nothing having happened at all.
    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    if (!data.session) {
      setSignupConfirmSent(true)
      return
    }
    navigate('/')
  }

  if (signupConfirmSent) {
    return <p className="text-sm text-muted">Almost there - we sent a confirmation link to {email}. Click it to finish signing up.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Browsing Lamyig is always free. {mode === 'sign-in' ? 'Sign in' : 'Join'} to add or edit a place.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={passwordInputClass}
          />
          <PasswordVisibilityToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
        </div>
        {mode === 'sign-in' && (
          <button
            type="button"
            className="self-start text-[13px] font-medium text-muted underline underline-offset-2 hover:text-ink"
            onClick={() => setSearchParams({ mode: 'forgot' }, { state: location.state, replace: true })}
          >
            Forgot password?
          </button>
        )}
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
        onClick={() => setSearchParams(mode === 'sign-in' ? { mode: 'sign-up' } : {}, { state: location.state, replace: true })}
      >
        {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}
