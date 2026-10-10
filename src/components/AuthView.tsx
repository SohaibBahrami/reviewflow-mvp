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
  const [email, setEmail] = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
        if (sessionError) setError(t('We could not connect your account service. Check your connection and try again.'))
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
          setError(t('We could not connect your account service. Check your connection and try again.'))
          setCheckingSession(false)
        }
      })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [t])

  useEffect(() => {
    setDisplayName(String(session?.user.user_metadata?.display_name ?? ''))
  }, [session?.user.id, session?.user.user_metadata?.display_name])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!client) return

    setError('')
    setMessage('')

    if (mode === 'sign-up') {
      if (!creatorName.trim()) {
        setError(t('Name is required.'))
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
            options: { data: { display_name: creatorName.trim() } },
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
        return
      }

      setPassword('')
      setConfirmPassword('')
      if (mode === 'sign-up') setCreatorName('')
    } catch (reason) {
      console.error('ReviewFlow account request failed.', reason)
      setError(t('We could not complete that account request. Check your connection and try again.'))
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    if (!client) return
    const cleanName = displayName.trim()
    if (!cleanName) {
      setError(t('Name is required.'))
      return
    }

    setError('')
    setMessage('')
    setLoading(true)
    try {
      const { error: updateError } = await client.auth.updateUser({
        data: { display_name: cleanName },
      })
      if (updateError) throw updateError
      setDisplayName(cleanName)
      setMessage(t('Profile saved.'))
    } catch (reason) {
      console.error('ReviewFlow could not update the creator profile.', reason)
      setError(t('We could not save your profile. Check your connection and try again.'))
    } finally {
      setLoading(false)
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
    return (
      <section className="auth-page">
        <div className="auth-card">
          <p className="eyebrow">{t('ReviewFlow account')}</p>
          <h1>{t('You’re signed in.')}</h1>
          <p className="hero-copy">{session.user.email}</p>
          <div className="auth-setup-note">
            <strong>{t('Your account is connected.')}</strong>
            <span>{t('After cloud database setup, project details, versions, and feedback sync to this account. Video files remain in this browser for now.')}</span>
          </div>
          <form className="form-card auth-form profile-form" onSubmit={saveProfile}>
            <label>
              {t('Creator name')}
              <input value={displayName} onChange={(event) => { setDisplayName(event.target.value); setError(''); setMessage('') }} placeholder={t('Your name')} autoComplete="name" maxLength={80} required />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            {message && <p className="form-success" role="status">{message}</p>}
            <button className="button button-primary" type="submit" disabled={loading}>
              {loading ? t('Working…') : t('Save profile')}
            </button>
          </form>
          <div className="auth-actions">
            <button className="button button-secondary" onClick={onDone}>{t('Back to projects')}</button>
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
              {t('Creator name')}
              <input value={creatorName} onChange={(event) => { setCreatorName(event.target.value); setError('') }} placeholder={t('Your name')} autoComplete="name" maxLength={80} required />
            </label>
          )}
          <label>
            {t('Email')}
            <input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="you@example.com" autoComplete="email" required />
          </label>
          <label>
            {t('Password')}
            <div className="password-field">
              <input className="password-input" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} placeholder={t('At least 6 characters')} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={6} required />
              <button className="password-toggle" type="button" aria-label={showPassword ? t('Hide password') : t('Show password')} aria-pressed={showPassword} onClick={() => setShowPassword((shown) => !shown)}>
                {showPassword ? t('Hide password') : t('Show password')}
              </button>
            </div>
          </label>
          {mode === 'sign-up' && (
            <label>
              {t('Confirm password')}
              <div className="password-field">
                <input className="password-input" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError('') }} autoComplete="new-password" minLength={6} required aria-invalid={Boolean(error && confirmPassword !== password)} />
                <button className="password-toggle" type="button" aria-label={showPassword ? t('Hide password') : t('Show password')} aria-pressed={showPassword} onClick={() => setShowPassword((shown) => !shown)}>
                  {showPassword ? t('Hide password') : t('Show password')}
                </button>
              </div>
            </label>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="form-success" role="status">{message}</p>}
          <button className="button button-primary" type="submit" disabled={loading}>{loading ? t('Working…') : mode === 'sign-in' ? t('Sign in') : t('Create account')}</button>
        </form>

        <button className="auth-switch" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); setMessage(''); setPassword(''); setConfirmPassword('') }}>
          {mode === 'sign-in' ? t('Need an account? Create one.') : t('Already have an account? Sign in.')}
        </button>
      </div>
    </section>
  )
}
