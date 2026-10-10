import { useEffect, useState, type FormEvent } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import { useI18n } from '../lib/i18n'

type Mode = 'sign-in' | 'sign-up'

export function AuthView({ onDone }: { onDone: () => void }) {
  const { t } = useI18n()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [client, setClient] = useState<SupabaseClient | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
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
        if (sessionError) setError(t('We could not connect your account service. Check your connection and try again.'))
        setSession(data.session)
        setName(String(data.session?.user.user_metadata?.display_name ?? ''))
        setCheckingSession(false)

        const authState = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
          if (mounted) {
            setSession(nextSession)
            if (nextSession?.user.user_metadata?.display_name) {
              setName(String(nextSession.user.user_metadata.display_name))
            }
          }
        })
        subscription = authState.data.subscription
      })
      .catch((reason) => {
        console.error('ReviewFlow could not initialize Supabase.', reason)
        if (mounted) {
          setError(t('We could not connect your account service. Check your connection and try again.'))
          setCheckingSession(false)
        }
      })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [t])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!client) return

    setError('')
    setMessage('')

    if (mode === 'sign-up') {
      if (!name.trim()) {
        setError(t('Enter your name to create an account.'))
        return
      }
      if (password !== confirmPassword) {
        setError(t('Passwords do not match.'))
        return
      }
    }

    setLoading(true)
    try {
      const result = mode === 'sign-in'
        ? await client.auth.signInWithPassword({ email: email.trim(), password })
        : await client.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { display_name: name.trim() } },
          })

      if (result.error) {
        setError(t('Your email or password could not be accepted. Check your details and try again.'))
        return
      }

      if (mode === 'sign-up' && !result.data.session) {
        setMessage(t('Check your email to confirm your account, then sign in.'))
        setMode('sign-in')
        setPassword('')
        setConfirmPassword('')
        setShowPassword(false)
        setShowConfirmPassword(false)
        return
      }

      setPassword('')
      setConfirmPassword('')
    } catch (reason) {
      console.error('ReviewFlow account request failed.', reason)
      setError(t('We could not complete that account request. Check your connection and try again.'))
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    if (!client || !session || !name.trim()) {
      setError(t('Enter your name to save your profile.'))
      return
    }

    setError('')
    setMessage('')
    setSavingProfile(true)
    try {
      const { data, error: updateError } = await client.auth.updateUser({
        data: { display_name: name.trim() },
      })
      if (updateError || !data.user) {
        setError(t('We could not save your name. Check your connection and try again.'))
        return
      }
      setSession((current) => current ? { ...current, user: data.user } : current)
      setName(String(data.user.user_metadata?.display_name ?? name.trim()))
      setMessage(t('Your name has been saved.'))
    } catch (reason) {
      console.error('ReviewFlow profile update failed.', reason)
      setError(t('We could not save your name. Check your connection and try again.'))
    } finally {
      setSavingProfile(false)
    }
  }

  async function signOut() {
    if (!client) return
    setError('')
    try {
      const { error: signOutError } = await client.auth.signOut()
      if (signOutError) setError(t('We could not sign you out. Check your connection and try again.'))
    } catch (reason) {
      console.error('ReviewFlow sign-out failed.', reason)
      setError(t('We could not sign you out. Check your connection and try again.'))
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <section className="auth-page">
        <div className="auth-card">
          <p className="eyebrow">{t('Cloud setup')}</p>
          <h1>{t('Connect your ReviewFlow account.')}</h1>
          <p className="hero-copy">{t('This build still works locally. To enable accounts and cloud persistence, add your Supabase URL and publishable key to')} <code>.env.local</code>.</p>
          <div className="auth-setup-note">
            <strong>{t('Local mode is still active.')}</strong>
            <span>{t('Supabase is optional until you configure a project.')}</span>
          </div>
          <button className="button button-primary" onClick={onDone}>{t('Back to projects')}</button>
        </div>
      </section>
    )
  }

  if (checkingSession) {
    return (
      <section className="auth-page">
        <div className="auth-card auth-loading"><span className="loading-dot" aria-hidden="true" /> {t('Checking your account…')}</div>
      </section>
    )
  }

  if (session) {
    const displayName = String(session.user.user_metadata?.display_name ?? '').trim()
    return (
      <section className="auth-page">
        <div className="auth-card">
          <p className="eyebrow">{t('ReviewFlow account')}</p>
          <h1>{t('You’re signed in.')}</h1>
          <p className="hero-copy">{session.user.email}</p>
          <form className="form-card auth-form profile-form" onSubmit={(event) => void saveProfile(event)}>
            <h2>{t('Creator profile')}</h2>
            <p className="muted">{t('This is the name associated with your creator account.')}</p>
            <label>
              {t('Your name')}
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('Enter your name')}
                autoComplete="name"
                maxLength={80}
                required
              />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            {message && <p className="form-success" role="status">{message}</p>}
            <button className="button button-primary" type="submit" disabled={savingProfile}>
              {savingProfile ? t('Saving…') : t('Save name')}
            </button>
          </form>
          <div className="auth-setup-note">
            <strong>{displayName ? t('Your account is connected.') : t('Add your creator name.')}</strong>
            <span>{t('Project details, versions, and feedback sync to this account. Video files remain in this browser for now.')}</span>
          </div>
          <div className="auth-actions">
            <button className="button button-primary" onClick={onDone}>{t('Back to projects')}</button>
            <button className="button button-secondary" onClick={() => void signOut()}>{t('Sign out')}</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">{t('ReviewFlow account')}</p>
        <h1>{mode === 'sign-in' ? t('Welcome back.') : t('Create your editor account.')}</h1>
        <p className="hero-copy">{t('When cloud sync is configured, project details, versions, and feedback are saved to this account. Video files remain in this browser for now.')}</p>

        <form className="form-card auth-form" onSubmit={submit}>
          {mode === 'sign-up' && (
            <label>
              {t('Your name')}
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('Enter your name')}
                autoComplete="name"
                maxLength={80}
                required
              />
            </label>
          )}
          <label>
            {t('Email')}
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
          </label>
          <label>
            {t('Password')}
            <span className="password-input-wrap">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('At least 6 characters')} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={6} required />
              <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={t(showPassword ? 'Hide password' : 'Show password')}>
                {t(showPassword ? 'Hide' : 'Show')}
              </button>
            </span>
          </label>
          {mode === 'sign-up' && (
            <label>
              {t('Confirm password')}
              <span className="password-input-wrap">
                <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={t('Re-enter your password')} autoComplete="new-password" minLength={6} required />
                <button className="password-toggle" type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={t(showConfirmPassword ? 'Hide password' : 'Show password')}>
                  {t(showConfirmPassword ? 'Hide' : 'Show')}
                </button>
              </span>
            </label>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="form-success" role="status">{message}</p>}
          <button className="button button-primary" type="submit" disabled={loading}>{loading ? t('Working…') : mode === 'sign-in' ? t('Sign in') : t('Create account')}</button>
        </form>

        <button className="auth-switch" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); setMessage('') }}>
          {mode === 'sign-in' ? t('Need an account? Create one.') : t('Already have an account? Sign in.')}
        </button>
      </div>
    </section>
  )
}
