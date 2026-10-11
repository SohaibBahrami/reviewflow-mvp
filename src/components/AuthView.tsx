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
  const [savedDisplayName, setSavedDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
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

        // Read the user from Supabase as well as local session storage so profile
        // metadata doesn't get lost when this page is reopened.
        const { data: userData, error: userError } = data.session
          ? await supabaseClient.auth.getUser()
          : { data: { user: null }, error: null }
        if (!mounted) return
        if (userError) setError(t('We could not connect your account service. Check your connection and try again.'))
        const currentSession = data.session && userData.user
          ? { ...data.session, user: userData.user }
          : data.session
        setSession(currentSession)
        const currentDisplayName = String(currentSession?.user.user_metadata?.display_name ?? '').trim()
        setName(currentDisplayName)
        setSavedDisplayName(currentDisplayName)
        setCheckingSession(false)

        const authState = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
          if (!mounted) return
          setSession((current) => {
            if (!nextSession) return null
            const currentName = String(current?.user.user_metadata?.display_name ?? '').trim()
            const nextName = String(nextSession.user.user_metadata?.display_name ?? '').trim()
            // Don't let a stale auth event erase a name just saved in this view.
            if (current?.user.id === nextSession.user.id && currentName && !nextName) {
              return {
                ...nextSession,
                user: {
                  ...nextSession.user,
                  user_metadata: { ...nextSession.user.user_metadata, display_name: currentName },
                },
              }
            }
            return nextSession
          })
          if (nextSession?.user.user_metadata?.display_name) {
            const nextName = String(nextSession.user.user_metadata.display_name).trim()
            setName(nextName)
            setSavedDisplayName(nextName)
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
      const savedName = String(data.user.user_metadata?.display_name ?? name.trim()).trim()
      setName(savedName)
      setSavedDisplayName(savedName)
      setEditingName(false)
      setMessage(t('Your name has been saved.'))
    } catch (reason) {
      console.error('ReviewFlow profile update failed.', reason)
      setError(t('We could not save your name. Check your connection and try again.'))
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault()
    if (!client || !session) return

    setError('')
    setMessage('')
    if (newPassword.length < 6) {
      setError(t('Your new password must be at least 6 characters.'))
      return
    }
    if (newPassword !== confirmNewPassword) {
      setError(t('Passwords do not match.'))
      return
    }

    setSavingPassword(true)
    try {
      const { error: updateError } = await client.auth.updateUser({ password: newPassword })
      if (updateError) {
        setError(t('We could not change your password. Check your connection and try again.'))
        return
      }
      setNewPassword('')
      setConfirmNewPassword('')
      setShowNewPassword(false)
      setShowConfirmNewPassword(false)
      setChangingPassword(false)
      setMessage(t('Your password has been changed.'))
    } catch (reason) {
      console.error('ReviewFlow password update failed.', reason)
      setError(t('We could not change your password. Check your connection and try again.'))
    } finally {
      setSavingPassword(false)
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
    const displayName = savedDisplayName
    return (
      <section className="auth-page">
        <div className="auth-card">
          <p className="eyebrow">{t('ReviewFlow account')}</p>
          <h1>{t('Account settings')}</h1>
          <p className="hero-copy">{session.user.email}</p>

          <div className="form-card auth-form profile-form">
            <div className="account-setting-heading">
              <div>
                <h2>{t('Creator name')}</h2>
                {displayName && !editingName && <p className="muted">{displayName}</p>}
                {!displayName && <p className="muted">{t('Add a name so collaborators know who you are.')}</p>}
              </div>
              {displayName && !editingName && (
                <button className="button button-secondary" type="button" onClick={() => { setName(displayName); setEditingName(true); setError(''); setMessage('') }}>
                  {t('Change name')}
                </button>
              )}
            </div>
            {(!displayName || editingName) && (
              <form className="account-edit-form" onSubmit={(event) => void saveProfile(event)}>
                <label>
                  {t('Your name')}
                  <input
                    type="text"
                    id="account-display-name"
                    name="display_name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t('Enter your name')}
                    autoComplete="name"
                    maxLength={80}
                    required
                  />
                </label>
                <div className="auth-actions">
                  <button className="button button-primary" type="submit" disabled={savingProfile}>
                    {savingProfile ? t('Saving…') : t('Save name')}
                  </button>
                  {displayName && (
                    <button className="button button-secondary" type="button" onClick={() => { setName(displayName); setEditingName(false); setError(''); setMessage('') }}>
                      {t('Cancel')}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <div className="form-card auth-form profile-form">
            <div className="account-setting-heading">
              <div>
                <h2>{t('Password')}</h2>
                <p className="muted">{t('Change the password you use to sign in.')}</p>
              </div>
              {!changingPassword && (
                <button className="button button-secondary" type="button" onClick={() => { setChangingPassword(true); setError(''); setMessage('') }}>
                  {t('Change password')}
                </button>
              )}
            </div>
            {changingPassword && (
              <form className="account-edit-form" onSubmit={(event) => void savePassword(event)}>
                <label>
                  {t('New password')}
                  <span className="password-input-wrap">
                    <input id="account-new-password" name="new_password" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={6} placeholder={t('At least 6 characters')} required />
                    <button className="password-toggle" type="button" onClick={() => setShowNewPassword((visible) => !visible)} aria-label={t(showNewPassword ? 'Hide password' : 'Show password')}>
                      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {showNewPassword ? <><path d="M3 3l18 18" /><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /></> : <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>}
                      </svg>
                    </button>
                  </span>
                </label>
                <label>
                  {t('Confirm new password')}
                  <span className="password-input-wrap">
                    <input id="account-confirm-new-password" name="confirm_new_password" type={showConfirmNewPassword ? 'text' : 'password'} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} autoComplete="new-password" minLength={6} placeholder={t('Re-enter your new password')} required />
                    <button className="password-toggle" type="button" onClick={() => setShowConfirmNewPassword((visible) => !visible)} aria-label={t(showConfirmNewPassword ? 'Hide password' : 'Show password')}>
                      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {showConfirmNewPassword ? <><path d="M3 3l18 18" /><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /></> : <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>}
                      </svg>
                    </button>
                  </span>
                </label>
                <div className="auth-actions">
                  <button className="button button-primary" type="submit" disabled={savingPassword}>
                    {savingPassword ? t('Saving…') : t('Update password')}
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => { setChangingPassword(false); setNewPassword(''); setConfirmNewPassword(''); setError(''); setMessage('') }}>
                    {t('Cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="form-success" role="status">{message}</p>}
          <div className="auth-setup-note">
            <span>{t('After cloud database setup, project details, versions, and feedback sync to this account. Video files remain in this browser for now.')}</span>
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
                id="signup-name"
                name="display_name"
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
            <input id="account-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
          </label>
          <label>
            {t('Password')}
            <span className="password-input-wrap">
              <input id="account-password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('At least 6 characters')} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={6} required />
              <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={t(showPassword ? 'Hide password' : 'Show password')}>
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {showPassword ? (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.2A11.8 11.8 0 0 1 12 5c6.4 0 10 7 10 7a15.6 15.6 0 0 1-3.1 3.8" />
                      <path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1.1 0 2.1-.2 3-.5" />
                    </>
                  ) : (
                    <>
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </span>
          </label>
          {mode === 'sign-up' && (
            <label>
              {t('Confirm password')}
              <span className="password-input-wrap">
                <input id="signup-confirm-password" name="confirm_password" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={t('Re-enter your password')} autoComplete="new-password" minLength={6} required />
                <button className="password-toggle" type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={t(showConfirmPassword ? 'Hide password' : 'Show password')}>
                  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {showConfirmPassword ? (
                      <>
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 5.2A11.8 11.8 0 0 1 12 5c6.4 0 10 7 10 7a15.6 15.6 0 0 1-3.1 3.8" />
                        <path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1.1 0 2.1-.2 3-.5" />
                      </>
                    ) : (
                      <>
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
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
