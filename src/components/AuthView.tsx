import { useEffect, useState, type FormEvent } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'

type Mode = 'sign-in' | 'sign-up'

export function AuthView({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    let subscription: { unsubscribe: () => void } | null = null

    void getSupabaseClient()
      .then(async (supabaseClient) => {
        if (!mounted) return
        setClient(supabaseClient)
        if (!supabaseClient) {
          setCheckingSession(false)
          return
        }

        const { data, error: sessionError } = await supabaseClient.auth.getSession()
        if (!mounted) return
        if (sessionError) setError(sessionError.message)
        setSession(data.session)
        setCheckingSession(false)

        const authState = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
          if (mounted) setSession(nextSession)
        })
        subscription = authState.data.subscription
      })
      .catch((reason) => {
        console.error('ReviewFlow could not initialize Supabase.', reason)
        if (mounted) {
          setError('We could not connect your account service. Check your connection and try again.')
          setCheckingSession(false)
        }
      })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!client) return

    setError('')
    setMessage('')
    setLoading(true)

    try {
      const result = mode === 'sign-in'
        ? await client.auth.signInWithPassword({ email: email.trim(), password })
        : await client.auth.signUp({ email: email.trim(), password })

      if (result.error) {
        setError(result.error.message)
        return
      }

      if (mode === 'sign-up' && !result.data.session) {
        setMessage('Check your email to confirm your account, then sign in.')
        setMode('sign-in')
        return
      }

      setPassword('')
    } catch (reason) {
      console.error('ReviewFlow account request failed.', reason)
      setError('We could not complete that account request. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    if (!client) return
    setError('')
    try {
      const { error: signOutError } = await client.auth.signOut()
      if (signOutError) setError(signOutError.message)
    } catch (reason) {
      console.error('ReviewFlow sign-out failed.', reason)
      setError('We could not sign you out. Check your connection and try again.')
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <section className="auth-page">
        <div className="auth-card">
          <p className="eyebrow">Cloud setup</p>
          <h1>Connect your ReviewFlow account.</h1>
          <p className="hero-copy">This build still works locally. To enable accounts and cloud persistence, add your Supabase URL and publishable key to <code>.env.local</code>.</p>
          <div className="auth-setup-note">
            <strong>Local mode is still active.</strong>
            <span>Supabase is optional until you configure a project.</span>
          </div>
          <button className="button button-primary" onClick={onDone}>Back to projects</button>
        </div>
      </section>
    )
  }

  if (checkingSession) {
    return (
      <section className="auth-page">
        <div className="auth-card auth-loading"><span className="loading-dot" aria-hidden="true" /> Checking your account…</div>
      </section>
    )
  }

  if (session) {
    return (
      <section className="auth-page">
        <div className="auth-card">
          <p className="eyebrow">ReviewFlow account</p>
          <h1>You’re signed in.</h1>
          <p className="hero-copy">{session.user.email}</p>
          <div className="auth-setup-note">
            <strong>Your account is connected.</strong>
            <span>Cloud project data will be connected to this account in the next migration step.</span>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="auth-actions">
            <button className="button button-primary" onClick={onDone}>Back to projects</button>
            <button className="button button-secondary" onClick={() => void signOut()}>Sign out</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">ReviewFlow account</p>
        <h1>{mode === 'sign-in' ? 'Welcome back.' : 'Create your editor account.'}</h1>
        <p className="hero-copy">Your account will own your projects and control who can access them.</p>

        <form className="form-card auth-form" onSubmit={submit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={6} required />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="form-success" role="status">{message}</p>}
          <button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Working…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button>
        </form>

        <button className="auth-switch" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); setMessage('') }}>
          {mode === 'sign-in' ? 'Need an account? Create one.' : 'Already have an account? Sign in.'}
        </button>
      </div>
    </section>
  )
}
